import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { gzipSync } from 'node:zlib';
import { rewriteUpstreamUrl, docsSlugFor, legacyDocsUrl } from '../../lib/projects.mjs';
import { releaseCoordinates, validateLock } from '../../scripts/site-inputs/lock.mjs';
import {
  collectPendingRedirects, extractInput, extractLinks, extractPreviewIds, obtainArtifact, stageDocsSnapshot, verifyMixPreviews,
} from '../../scripts/site-inputs/sync-lib.mjs';
import { packDirectory, readArchive, sha256 } from '../../scripts/site-inputs/tar.mjs';

const COMMIT = 'a'.repeat(40);

async function tempDir() {
  return mkdtemp(path.join(tmpdir(), 'site-inputs-'));
}

async function writeTree(root, files) {
  for (const [file, content] of Object.entries(files)) {
    await mkdir(path.dirname(path.join(root, file)), { recursive: true });
    await writeFile(path.join(root, file), content);
  }
}

/** Build a raw ustar entry so tests can describe archives the packer refuses to make. */
function rawEntry(name, data = '', type = '0') {
  const body = Buffer.from(data);
  const header = Buffer.alloc(512);
  header.write(name, 0, 100);
  header.write('0000644\0', 100);
  header.write('0000000\0', 108);
  header.write('0000000\0', 116);
  header.write(body.length.toString(8).padStart(11, '0') + '\0', 124);
  header.write('00000000000\0', 136);
  header.fill(' ', 148, 156);
  header.write(type, 156);
  header.write('ustar\0', 257);
  header.write('00', 263);
  let sum = 0;
  for (const byte of header) sum += byte;
  header.write(sum.toString(8).padStart(6, '0') + '\0 ', 148);
  return Buffer.concat([header, body, Buffer.alloc((512 - (body.length % 512)) % 512)]);
}
const rawArchive = (...entries) => gzipSync(Buffer.concat([...entries, Buffer.alloc(1024)]));

async function archiveFor(files) {
  const dir = await tempDir();
  await writeTree(dir, files);
  const { archive } = await packDirectory(dir);
  await rm(dir, { recursive: true });
  return archive;
}

const metadata = (overrides = {}) => JSON.stringify({
  schemaVersion: 1, name: 'mix-previews', source: { repository: 'btwld/website', commit: COMMIT }, ...overrides,
});

function lockEntry(archive, commit = COMMIT) {
  return {
    source: { repository: 'btwld/website', commit },
    artifact: { url: releaseCoordinates('mix-previews', commit).url, sha256: sha256(archive), size: archive.length },
  };
}

test('packing is deterministic and round-trips', async () => {
  const files = { 'b.txt': 'b', 'a/nested/file.dart': 'class A {}', 'site-input.json': metadata() };
  const first = await archiveFor(files);
  const second = await archiveFor(files);
  assert.equal(sha256(first), sha256(second));
  const entries = readArchive(first);
  assert.deepEqual(entries.map(entry => entry.path), ['a/nested/file.dart', 'b.txt', 'site-input.json']);
  assert.equal(entries[0].data.toString(), 'class A {}');
});

test('long paths use the ustar prefix field', async () => {
  const long = `${'d'.repeat(80)}/${'e'.repeat(60)}/file.dart`;
  const [entry] = readArchive(await archiveFor({ [long]: 'x' }));
  assert.equal(entry.path, long);
});

test('the reader rejects unsafe or unsupported entries', () => {
  assert.throws(() => readArchive(rawArchive(rawEntry('../escape.txt', 'x'))), /not normalized/);
  assert.throws(() => readArchive(rawArchive(rawEntry('/etc/passwd', 'x'))), /absolute/);
  assert.throws(() => readArchive(rawArchive(rawEntry('link', '', '2'))), /unsupported type/);
  assert.throws(() => readArchive(rawArchive(rawEntry('a', '1'), rawEntry('a', '2'))), /duplicated/);
  const corrupt = rawEntry('file.txt', 'x');
  corrupt[0] = 'g'.charCodeAt(0);
  assert.throws(() => readArchive(rawArchive(corrupt)), /checksum/);
  assert.throws(() => readArchive(gzipSync(rawEntry('file.txt', 'x'))), /end-of-archive/);
});

test('lock validation requires every input, a release URL, and full digests', () => {
  const entry = { producer: {repository: 'btwld/mix-website', script: 'scripts/site-inputs/produce/remix-docs.sh', commit: COMMIT}, source: { repository: 'btwld/remix', commit: COMMIT }, artifact: { url: releaseCoordinates('remix-docs', COMMIT).url, sha256: 'f'.repeat(64), size: 1 } };
  const lock = { version: 1, inputs: { 'mix-previews': { ...entry, producer: {...entry.producer, script:'scripts/site-inputs/produce/mix-previews.sh'}, source: { repository: 'btwld/mix-website', commit: COMMIT } }, 'remix-docs': entry, 'naked-ui-docs': {...entry, producer:{...entry.producer, script:'scripts/site-inputs/produce/naked-ui-docs.sh'}} } };
  assert.doesNotThrow(() => validateLock(lock));
  assert.throws(() => validateLock({...lock, inputs:{...lock.inputs, 'remix-docs': {...entry, producer:undefined}}}), /missing producer/);
  assert.throws(() => validateLock({ version: 1, inputs: { 'remix-docs': entry } }), /missing input mix-previews/);
  assert.throws(() => validateLock({ ...lock, inputs: { ...lock.inputs, 'remix-docs': { ...entry, artifact: { ...entry.artifact, url: 'https://example.com/x.tar.gz' } } } }), /release asset/);
  assert.throws(() => validateLock({ ...lock, inputs: { ...lock.inputs, 'remix-docs': { ...entry, source: { ...entry.source, commit: 'main' } } } }), /40-character/);
  assert.throws(() => validateLock({ ...lock, inputs: { ...lock.inputs, 'remix-docs': { ...entry, artifact: { ...entry.artifact, sha256: 'abc' } } } }), /sha256/);
});

test('a missing artifact fails when downloads are disabled', async () => {
  const archive = await archiveFor({ 'site-input.json': metadata() });
  const cacheDir = await tempDir();
  await assert.rejects(obtainArtifact('mix-previews', lockEntry(archive), { cacheDir, offline: true }), /not cached .* downloads are disabled/);
});

test('a missing release asset fails the build', async () => {
  const archive = await archiveFor({ 'site-input.json': metadata() });
  const cacheDir = await tempDir();
  const fetchImpl = async () => new Response('Not Found', { status: 404 });
  await assert.rejects(obtainArtifact('mix-previews', lockEntry(archive), { cacheDir, fetchImpl }), /HTTP 404/);
});

test('a changed published asset fails the build and is not cached', async () => {
  const archive = await archiveFor({ 'site-input.json': metadata() });
  const changed = await archiveFor({ 'site-input.json': metadata(), 'extra.txt': 'tampered' });
  const cacheDir = await tempDir();
  const fetchImpl = async () => new Response(changed);
  await assert.rejects(obtainArtifact('mix-previews', lockEntry(archive), { cacheDir, fetchImpl }), /does not match sources\.lock\.json/);
  assert.equal(existsSync(path.join(cacheDir, `${sha256(archive)}.tar.gz`)), false);
});

test('a verified download is cached by digest and a corrupt cache entry is replaced', async () => {
  const archive = await archiveFor({ 'site-input.json': metadata() });
  const cacheDir = await tempDir();
  let downloads = 0;
  const fetchImpl = async () => { downloads++; return new Response(archive); };
  const entry = lockEntry(archive);
  assert.equal(sha256(await obtainArtifact('mix-previews', entry, { cacheDir, fetchImpl })), sha256(archive));
  await obtainArtifact('mix-previews', entry, { cacheDir, fetchImpl });
  assert.equal(downloads, 1);
  await writeFile(path.join(cacheDir, `${sha256(archive)}.tar.gz`), 'corrupt');
  await obtainArtifact('mix-previews', entry, { cacheDir, fetchImpl });
  assert.equal(downloads, 2);
});

test('an archive built from another commit is rejected', async () => {
  const archive = await archiveFor({ 'site-input.json': metadata() });
  const destination = await tempDir();
  await assert.rejects(extractInput('mix-previews', lockEntry(archive, 'b'.repeat(40)), archive, destination), /source\.commit/);
  const wrongName = await archiveFor({ 'site-input.json': metadata({ name: 'remix-docs' }) });
  await assert.rejects(extractInput('mix-previews', lockEntry(wrongName), wrongName, destination), /describes remix-docs/);
});

test('preview IDs must be literal and resolve to a bundled source', async () => {
  assert.deepEqual(extractPreviewIds('<FlutterPreview previewId="a.0" height={200} />\n<FlutterPreview\n  previewId={"b.1"}\n/>'), ['a.0', 'b.1']);
  assert.deepEqual(extractPreviewIds('```mdx\n<FlutterPreview previewId="in.code" />\n```'), []);
  assert.throws(() => extractPreviewIds('<FlutterPreview previewId={id} />'), /literal previewId/);

  const root = await tempDir();
  const content = path.join(root, 'content');
  const bundle = path.join(root, 'bundle');
  await writeTree(bundle, {
    'previews-manifest.json': JSON.stringify({ entries: [
      { previewId: 'ok.0', sourcePath: 'lib/ok.dart' },
      { previewId: 'region.0', sourcePath: 'lib/region.dart', snippetRegion: 'main' },
      { previewId: 'gone.0', sourcePath: 'lib/gone.dart' },
    ] }),
    'sources/lib/ok.dart': 'class Ok {}',
    'sources/lib/region.dart': '// #docregion main\nclass R {}\n// #enddocregion main',
  });
  await writeTree(content, { 'page.mdx': '<FlutterPreview previewId="ok.0" />\n<FlutterPreview previewId="region.0" />' });
  assert.deepEqual(await verifyMixPreviews(content, bundle), ['ok.0', 'region.0']);
  await writeTree(content, { 'bad.mdx': '<FlutterPreview previewId="missing.0" />\n<FlutterPreview previewId="gone.0" />' });
  await assert.rejects(verifyMixPreviews(content, bundle), error => {
    assert.match(error.message, /"missing\.0" is not in the locked Mix manifest/);
    assert.match(error.message, /source for "gone\.0" is missing/);
    return true;
  });
});

test('upstream Remix links map onto the site', () => {
  assert.equal(rewriteUpstreamUrl('remix', '/'), '/remix/docs/');
  assert.equal(rewriteUpstreamUrl('remix', '/components/button'), '/remix/docs/components/button/');
  assert.equal(rewriteUpstreamUrl('remix', '/open-code#dry-run'), '/remix/docs/open-code/#dry-run');
  assert.equal(rewriteUpstreamUrl('remix', '/assets/fortal-catalog.png'), '/remix/assets/fortal-catalog.png');
  assert.equal(rewriteUpstreamUrl('remix', '/catalog/#/?path=x'), '/remix/catalog/#/?path=x');
  assert.equal(rewriteUpstreamUrl('remix', 'https://pub.dev/packages/remix'), 'https://pub.dev/packages/remix');
  assert.equal(rewriteUpstreamUrl('mix', '/mix/docs/guides/styling/'), '/mix/docs/guides/styling/');
  assert.equal(docsSlugFor('mix', '/mix/docs/guides/styling/#x'), 'guides/styling');
  assert.equal(docsSlugFor('mix', '/remix/docs/'), null);
  assert.equal(legacyDocsUrl('remix', 'components/dialog'), 'https://btwld.github.io/remix/components/dialog/');
  assert.equal(legacyDocsUrl('mix', 'guides/styling'), 'https://concepta.dev/documentation/mix/guides/styling');
  assert.deepEqual(extractLinks('[a](/x) ![i](/assets/i.png "t")\n```md\n[no](/code)\n```\n<a href="/y">'), ['/x', '/assets/i.png', '/y']);
});

test('docs snapshots publish only scoped pages and their navigation', async () => {
  const root = await tempDir();
  const snapshot = path.join(root, 'snapshot');
  await writeTree(snapshot, {
    'content/meta.json': JSON.stringify({ pages: ['---Start---', '[Intro](/)', '---Tutorials---', '[Tour](/tour)', 'nav-a', 'nav-b'] }),
    'content/nav-a/meta.json': JSON.stringify({ title: 'A', pages: ['[Button](/components/button)', '[Dialog](/components/dialog)'] }),
    'content/nav-b/meta.json': JSON.stringify({ title: 'B', pages: ['[Card](/components/card)'] }),
    'content/index.mdx': '---\ntitle: Intro\n---\n',
    'content/components/button.mdx': '---\ntitle: Button\n---\n[Dialog](/components/dialog) [Intro](/) ![x](/assets/x.png)',
    'content/components/dialog.mdx': '---\ntitle: Dialog\n---\n',
  });
  const out = path.join(root, 'out');
  const published = await stageDocsSnapshot('remix', snapshot, ['components/button'], out);
  assert.deepEqual([...published], ['components/button']);
  assert.deepEqual(JSON.parse(await readFile(path.join(out, 'meta.json'), 'utf8')).pages, ['nav-a']);
  assert.deepEqual(JSON.parse(await readFile(path.join(out, 'nav-a/meta.json'), 'utf8')).pages, ['[Button](/remix/docs/components/button)']);
  assert.equal(existsSync(path.join(out, 'nav-b')), false);
  assert.equal(existsSync(path.join(out, 'components/dialog.mdx')), false);

  const { redirects, assets } = await collectPendingRedirects([{ projectId: 'remix', contentDir: out, published }]);
  // The docs root (linked as `/`) always renders, so it never redirects away.
  assert.deepEqual(redirects, [
    { source: '/remix/docs/components/dialog', destination: 'https://btwld.github.io/remix/components/dialog/' },
  ]);
  assert.deepEqual(assets, ['/remix/assets/x.png']);
  await assert.rejects(stageDocsSnapshot('remix', snapshot, ['components/missing'], out), /not in the pinned snapshot/);
});

test('archive provenance rejects another producer or toolchain even at the same source commit', async () => {
  const root = await tempDir();
  const producer = { repository: 'btwld/mix-website', script: 'scripts/site-inputs/produce/mix-previews.sh', commit: COMMIT };
  const toolchain = { flutter: '3.44.0' };
  const archive = await archiveFor({ 'site-input.json': metadata({ producer, toolchain }) });
  const entry = { ...lockEntry(archive), producer, toolchain };
  try {
    await extractInput('mix-previews', entry, archive, path.join(root, 'out'));
    await assert.rejects(extractInput('mix-previews', { ...entry, producer: { ...producer, commit: 'b'.repeat(40) } }, archive, path.join(root, 'out')), /producer differs/);
    await assert.rejects(extractInput('mix-previews', { ...entry, toolchain: { flutter: '3.45.0' } }, archive, path.join(root, 'out')), /toolchain differs/);
  } finally { await rm(root, { recursive: true }); }
});

test('prebuild refuses a preview archive after its canonical Dart source changes', async () => {
  const root = await tempDir();
  const relative = 'packages/mix_docs_preview/lib/example.dart';
  try {
    await writeTree(root, {
      [relative]: 'class Example {}',
      'content/example.mdx': '<FlutterPreview previewId="example.0" />',
      'bundle/previews-manifest.json': JSON.stringify({entries:[{previewId:'example.0',sourcePath:relative}]}),
      ['bundle/sources/'+relative]: 'class Example {}',
    });
    assert.deepEqual(await verifyMixPreviews(path.join(root,'content'),path.join(root,'bundle'),root),['example.0']);
    await writeFile(path.join(root,relative),'class ChangedExample {}');
    await assert.rejects(verifyMixPreviews(path.join(root,'content'),path.join(root,'bundle'),root), /Stale bundled source/);
  } finally { await rm(root,{recursive:true}); }
});
