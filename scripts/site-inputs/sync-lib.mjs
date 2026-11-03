// Fetch, verify, unpack, and stage the pinned site inputs.
//
// Every input is addressed by sources.lock.json (source commit, release asset
// URL, SHA-256, size). Nothing reaches the generated content or public
// directories until its digest matches and its embedded metadata names the
// same source commit. Missing artifacts, digest mismatches, and unresolved
// preview IDs all fail the build.
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { cp, mkdir, readdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { PROJECTS, PROJECT_IDS, docsSlugFor, legacyDocsUrl, rewriteUpstreamUrl } from '../../lib/projects.mjs';
import { validateLock, validateSiteInputMetadata } from './lock.mjs';
import { readArchive, sha256, writeEntries } from './tar.mjs';

/** Where each docs-snapshot input lands, keyed by input name. */
const SNAPSHOT_INPUTS = { 'remix-docs': 'remix' };

export function paths(root) {
  return {
    lock: path.join(root, 'sources.lock.json'),
    scope: path.join(root, 'site-scope.json'),
    cache: process.env.SITE_INPUTS_CACHE ? path.resolve(process.env.SITE_INPUTS_CACHE) : path.join(root, '.site-inputs/cache'),
    extracted: path.join(root, '.site-inputs/extracted'),
    generated: path.join(root, '.generated'),
    content: path.join(root, 'content'),
    mixContent: path.join(root, 'content/mix'),
    publicPreviews: path.join(root, 'public/previews'),
    publicRemix: path.join(root, 'public/remix'),
  };
}

function digestMismatch(name, origin, expected, actualSha, actualSize) {
  return new Error(
    `${name}: ${origin} artifact does not match sources.lock.json ` +
    `(expected sha256 ${expected.sha256}, ${expected.size} bytes; got ${actualSha}, ${actualSize} bytes). ` +
    'A published asset changed or the lock is wrong; refusing to build.',
  );
}

/** Return the verified archive bytes from the local cache or the lock's URL. */
export async function obtainArtifact(name, entry, { cacheDir, offline = false, fetchImpl = globalThis.fetch, log = () => {} }) {
  const { url, sha256: expectedSha, size: expectedSize } = entry.artifact;
  const cached = path.join(cacheDir, `${expectedSha}.tar.gz`);
  if (existsSync(cached)) {
    const data = await readFile(cached);
    const actual = sha256(data);
    if (actual === expectedSha && data.length === expectedSize) return data;
    // A cache entry is named by its expected digest, so a mismatch is local
    // corruption: drop it and fetch again rather than trusting it.
    log(`${name}: discarding corrupt cache entry ${cached}`);
    await rm(cached, { force: true });
  }
  if (offline) {
    throw new Error(`${name}: artifact is not cached at ${cached} and downloads are disabled (SITE_INPUTS_OFFLINE). Expected ${url}`);
  }
  log(`${name}: downloading ${url}`);
  let response;
  try {
    response = await fetchImpl(url, { redirect: 'follow' });
  } catch (error) {
    throw new Error(`${name}: could not download ${url}: ${error.message}`);
  }
  if (!response.ok) throw new Error(`${name}: download of ${url} failed with HTTP ${response.status}`);
  const data = Buffer.from(await response.arrayBuffer());
  const actual = sha256(data);
  if (actual !== expectedSha || data.length !== expectedSize) throw digestMismatch(name, 'downloaded', entry.artifact, actual, data.length);
  await mkdir(cacheDir, { recursive: true });
  const temporary = `${cached}.${process.pid}.tmp`;
  await writeFile(temporary, data);
  await rename(temporary, cached);
  return data;
}

/** Unpack an archive and check that it describes the locked source. */
export async function extractInput(name, entry, data, destination) {
  const entries = readArchive(data);
  const metadataEntry = entries.find(item => item.path === 'site-input.json');
  if (!metadataEntry) throw new Error(`${name}: archive has no site-input.json`);
  const metadata = validateSiteInputMetadata(JSON.parse(metadataEntry.data.toString('utf8')));
  if (metadata.name !== name) throw new Error(`${name}: archive describes ${metadata.name}`);
  for (const key of ['repository', 'commit']) {
    if (metadata.source[key] !== entry.source[key]) {
      throw new Error(`${name}: archive source.${key} is ${metadata.source[key]}, sources.lock.json pins ${entry.source[key]}`);
    }
  }
  await rm(destination, { recursive: true, force: true });
  await mkdir(destination, { recursive: true });
  await writeEntries(entries, destination);
  return metadata;
}

async function walk(dir, predicate, relative = '') {
  const found = [];
  if (!existsSync(path.join(dir, relative))) return found;
  for (const entry of await readdir(path.join(dir, relative), { withFileTypes: true })) {
    const child = relative ? `${relative}/${entry.name}` : entry.name;
    if (entry.isDirectory()) found.push(...await walk(dir, predicate, child));
    else if (predicate(child)) found.push(child);
  }
  return found.sort();
}

const stripCode = text => text.replace(/^(```|~~~)[^\n]*\n[\s\S]*?^\1[^\n]*$/gm, '');

/** Root-relative link and asset targets in MDX prose (fenced code is ignored). */
export function extractLinks(mdx) {
  const text = stripCode(mdx);
  const urls = [];
  for (const match of text.matchAll(/\]\((\/[^)\s]*)(?:\s+"[^"]*")?\)/g)) urls.push(match[1]);
  for (const match of text.matchAll(/\b(?:href|src)=["'](\/[^"']*)["']/g)) urls.push(match[1]);
  return urls;
}

/** Every `<FlutterPreview previewId="…">` in Mix MDX; any non-literal ID is an error. */
export function extractPreviewIds(mdx, file = 'MDX') {
  const ids = [];
  for (const match of stripCode(mdx).matchAll(/<FlutterPreview\b([^>]*)>/g)) {
    const literal = match[1].match(/\bpreviewId=(?:"([^"]+)"|'([^']+)'|\{\s*["']([^"']+)["']\s*\})/);
    if (!literal) throw new Error(`${file}: <FlutterPreview> needs a literal previewId`);
    ids.push(literal[1] ?? literal[2] ?? literal[3]);
  }
  return ids;
}

function hasRegion(source, region) {
  return source.split(/\r?\n/).some(line => {
    const match = line.trim().match(/^\/\/\s*#(?:docregion|region)\b(.*)$/);
    return match && match[1].split(/[\s,]+/).filter(Boolean).includes(region);
  });
}

/** Resolve every Mix preview ID against the locked manifest and bundled sources. */
export async function verifyMixPreviews(contentDir, bundleDir) {
  const manifest = JSON.parse(await readFile(path.join(bundleDir, 'previews-manifest.json'), 'utf8'));
  const byId = new Map(manifest.entries.map(entry => [entry.previewId, entry]));
  const problems = [];
  const used = [];
  for (const file of await walk(contentDir, name => name.endsWith('.mdx'))) {
    for (const id of extractPreviewIds(await readFile(path.join(contentDir, file), 'utf8'), file)) {
      used.push(id);
      const entry = byId.get(id);
      if (!entry) { problems.push(`${file}: previewId "${id}" is not in the locked Mix manifest`); continue; }
      const sourceFile = path.join(bundleDir, 'sources', entry.sourcePath);
      if (!existsSync(sourceFile)) { problems.push(`${file}: source for "${id}" is missing (${entry.sourcePath})`); continue; }
      if (entry.snippetRegion && !hasRegion(await readFile(sourceFile, 'utf8'), entry.snippetRegion)) {
        problems.push(`${file}: region "${entry.snippetRegion}" for "${id}" is missing from ${entry.sourcePath}`);
      }
    }
  }
  if (problems.length) throw new Error(`Unresolved Mix previews:\n  ${problems.join('\n  ')}`);
  return used;
}

function parseLinkEntry(item) {
  const match = /^\[([^\]]+)\]\((\/[^)]*)\)$/.exec(item);
  return match ? { title: match[1], href: match[2] } : null;
}

/**
 * Filter a snapshot's Fumadocs meta tree down to the published pages and
 * rebase its link entries onto the project's docs route.
 */
async function filterMeta(projectId, contentDir, published, relative = '') {
  const metaFile = path.join(contentDir, relative, 'meta.json');
  if (!existsSync(metaFile)) return false;
  const meta = JSON.parse(await readFile(metaFile, 'utf8'));
  // A separator heads the link entries that follow it; folders are their own
  // (collapsible) groups. Keep a separator only while one of its links survives.
  const pages = [];
  let separator = null;
  for (const item of meta.pages ?? []) {
    const link = parseLinkEntry(item);
    if (link) {
      const slug = link.href.replace(/^\/+|\/+$/g, '');
      if (!published.has(slug)) continue;
      if (separator) { pages.push(separator); separator = null; }
      pages.push(`[${link.title}](${PROJECTS[projectId].docsBase}${slug ? `/${slug}` : ''})`);
    } else if (/^---.*---$/.test(item)) {
      separator = item;
    } else if (/^[\w.-]+$/.test(item)) {
      separator = null;
      const child = relative ? `${relative}/${item}` : item;
      if (await filterMeta(projectId, contentDir, published, child) || published.has(child)) pages.push(item);
    } else {
      throw new Error(`${projectId}: unsupported meta.json entry ${JSON.stringify(item)} in ${relative || 'root'}`);
    }
  }
  if (pages.length === 0 && relative) { await rm(metaFile); return false; }
  await writeFile(metaFile, JSON.stringify({ ...meta, pages }, null, 2) + '\n');
  return pages.length > 0;
}

/** Remove directories that filtering left without any files. */
async function pruneEmptyDirectories(dir, isRoot = true) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) await pruneEmptyDirectories(path.join(dir, entry.name), false);
  }
  if (!isRoot && (await readdir(dir)).length === 0) await rm(dir, { recursive: true });
}

/** Copy the in-scope pages of a docs snapshot into generated content. */
export async function stageDocsSnapshot(projectId, snapshotDir, scopePages, outDir) {
  const contentDir = path.join(snapshotDir, 'content');
  await rm(outDir, { recursive: true, force: true });
  const published = new Set();
  for (const page of scopePages) {
    const candidates = [`${page}.mdx`, `${page}/index.mdx`];
    const found = candidates.find(candidate => existsSync(path.join(contentDir, candidate)));
    if (!found) throw new Error(`${projectId}: scoped page "${page}" is not in the pinned snapshot`);
    await mkdir(path.dirname(path.join(outDir, found)), { recursive: true });
    await cp(path.join(contentDir, found), path.join(outDir, found));
    published.add(page === 'index' ? '' : page);
  }
  for (const meta of await walk(contentDir, name => name.endsWith('meta.json'))) {
    await mkdir(path.dirname(path.join(outDir, meta)), { recursive: true });
    await cp(path.join(contentDir, meta), path.join(outDir, meta));
  }
  await filterMeta(projectId, outDir, published);
  await pruneEmptyDirectories(outDir);
  return published;
}

/** Projects whose MDX lives in this repository. */
const IN_REPO_PROJECTS = ['mix', 'naked-ui'];

/** Published docs slugs for in-repository content. */
async function repoPages(contentDir) {
  return new Set((await walk(contentDir, name => name.endsWith('.mdx'))).map(file => file.replace(/(\/index)?\.mdx$/, '').replace(/^index$/, '')));
}

/**
 * Links from published pages to in-project pages that have not migrated yet
 * become temporary redirects to the page's current home, so the pilot never
 * links to a 404. Each entry disappears once its page is published.
 */
export async function collectPendingRedirects(projects) {
  const redirects = new Map();
  const assets = new Map();
  for (const { projectId, contentDir, published } of projects) {
    for (const file of await walk(contentDir, name => name.endsWith('.mdx'))) {
      for (const raw of extractLinks(await readFile(path.join(contentDir, file), 'utf8'))) {
        const url = rewriteUpstreamUrl(projectId, raw);
        const project = PROJECTS[projectId];
        if (project.assetsBase && url.startsWith(`${project.assetsBase}/`)) {
          assets.set(url, { projectId, file });
          continue;
        }
        for (const target of PROJECT_IDS) {
          const slug = docsSlugFor(target, url);
          if (slug === null) continue;
          const pages = projects.find(item => item.projectId === target)?.published ?? new Set();
          if (!pages.has(slug)) {
            redirects.set(`${PROJECTS[target].docsBase}${slug ? `/${slug}` : ''}`, legacyDocsUrl(target, slug));
          }
        }
      }
    }
  }
  return {
    redirects: [...redirects].sort().map(([source, destination]) => ({ source, destination })),
    assets: [...assets.keys()].sort(),
  };
}

export async function syncSiteInputs({ root, offline = false, fetchImpl, log = console.log }) {
  const p = paths(root);
  const lockText = await readFile(p.lock, 'utf8');
  const lock = validateLock(JSON.parse(lockText));
  const scope = JSON.parse(await readFile(p.scope, 'utf8'));
  const summary = { lockSha256: createHash('sha256').update(lockText).digest('hex'), inputs: {} };
  const metadata = {};

  for (const [name, entry] of Object.entries(lock.inputs)) {
    const data = await obtainArtifact(name, entry, { cacheDir: p.cache, offline, fetchImpl, log });
    metadata[name] = await extractInput(name, entry, data, path.join(p.extracted, name));
    summary.inputs[name] = {
      repository: entry.source.repository,
      commit: entry.source.commit,
      sha256: entry.artifact.sha256,
      toolchain: metadata[name].toolchain ?? null,
    };
    log(`${name}: verified ${entry.source.repository}@${entry.source.commit.slice(0, 12)} (sha256 ${entry.artifact.sha256.slice(0, 12)})`);
  }

  // Mix previews: a content-addressed directory, so a returning browser can
  // never combine an engine, manifest, or snippet from two different builds.
  const previewId = lock.inputs['mix-previews'].artifact.sha256.slice(0, 16);
  const previewsBase = `/previews/mix/${previewId}`;
  await rm(p.publicPreviews, { recursive: true, force: true });
  await mkdir(path.join(p.publicPreviews, 'mix'), { recursive: true });
  await cp(path.join(p.extracted, 'mix-previews/bundle'), path.join(p.publicPreviews, 'mix', previewId), { recursive: true });
  const usedPreviews = await verifyMixPreviews(p.mixContent, path.join(p.publicPreviews, 'mix', previewId));

  // Docs snapshots: only the scoped pages and their navigation.
  const projects = [];
  for (const projectId of IN_REPO_PROJECTS) {
    const contentDir = path.join(p.content, projectId);
    projects.push({ projectId, contentDir, published: await repoPages(contentDir) });
  }
  for (const [name, projectId] of Object.entries(SNAPSHOT_INPUTS)) {
    const outDir = path.join(p.generated, 'content', projectId);
    const published = await stageDocsSnapshot(projectId, path.join(p.extracted, name), scope[projectId]?.pages ?? [], outDir);
    projects.push({ projectId, contentDir: outDir, published });
  }

  // Remix public files: the catalog keeps its own base href (/remix/catalog/).
  await rm(p.publicRemix, { recursive: true, force: true });
  await mkdir(p.publicRemix, { recursive: true });
  const remixDir = path.join(p.extracted, 'remix-docs');
  const catalogIndex = await readFile(path.join(remixDir, 'catalog/index.html'), 'utf8');
  if (!catalogIndex.includes(`<base href="${PROJECTS.remix.catalogPath}">`)) {
    throw new Error(`remix-docs: catalog/index.html does not use base href ${PROJECTS.remix.catalogPath}`);
  }
  await cp(path.join(remixDir, 'catalog'), path.join(p.publicRemix, 'catalog'), { recursive: true });

  const { redirects, assets } = await collectPendingRedirects(projects);
  // Copy only the assets the published pages reference, plus the wordmarks.
  const wanted = new Set([...assets, '/remix/assets/logo_light.png', '/remix/assets/logo_dark.png', '/remix/assets/favicon.png']);
  for (const url of wanted) {
    const relative = url.slice('/remix/assets/'.length).split(/[?#]/)[0];
    const from = path.join(remixDir, 'assets', relative);
    if (!existsSync(from)) throw new Error(`remix-docs: referenced asset ${url} is not in the pinned snapshot`);
    await mkdir(path.dirname(path.join(p.publicRemix, 'assets', relative)), { recursive: true });
    await cp(from, path.join(p.publicRemix, 'assets', relative));
  }

  await mkdir(p.generated, { recursive: true });
  const site = {
    ...summary,
    mix: { previewsBase, sourcesBase: `${previewsBase}/sources`, previewIds: usedPreviews },
    remix: { catalogPath: PROJECTS.remix.catalogPath },
    pages: Object.fromEntries(projects.map(item => [item.projectId, [...item.published].sort()])),
  };
  await writeFile(path.join(p.generated, 'site-inputs.json'), JSON.stringify(site, null, 2) + '\n');
  await writeFile(path.join(p.generated, 'pending-redirects.json'), JSON.stringify(redirects, null, 2) + '\n');
  log(`staged ${usedPreviews.length} Mix previews, ${projects.reduce((n, item) => n + item.published.size, 0)} pages, ${redirects.length} pending redirects`);
  return site;
}

export async function fileSize(file) {
  return (await stat(file)).size;
}
