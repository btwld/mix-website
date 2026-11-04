#!/usr/bin/env node
// Copy legacy docs pages into content/<project>/ with mechanical adaptations only.
//
// Usage:
//   node scripts/migrate/import-docs.mjs --project mix --source <btwld/website checkout> <page>...
//   node scripts/migrate/import-docs.mjs --project naked-ui --source <btwld/naked_ui checkout> <page>...
//
// The checkout must be at a clean commit; its SHA and each original file's
// SHA-256 are recorded in content/<project>/SOURCES.json so reviewers can
// diff an imported page against its source. Editorial fixes belong in a
// separate, reviewed commit after the import.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { parseArgs } from 'node:util';

const { values, positionals: pages } = parseArgs({
  options: { project: { type: 'string' }, source: { type: 'string' } },
  allowPositionals: true,
});

const PROFILES = {
  mix: {
    repository: 'btwld/website',
    contentRoot: 'src/content/documentation/mix',
    adapt: adaptMix,
    navigation: mixNavigation,
  },
  'naked-ui': {
    repository: 'btwld/naked_ui',
    contentRoot: 'docs',
    adapt: adaptNakedUi,
    navigation: nakedUiNavigation,
  },
};

const profile = PROFILES[values.project];
if (!profile || !values.source || pages.length === 0) {
  console.error('Usage: import-docs.mjs --project mix|naked-ui --source <checkout> <page>...');
  process.exit(2);
}

const source = path.resolve(values.source);
const git = (...args) => execFileSync('git', ['-C', source, ...args], { encoding: 'utf8' }).trim();
const commit = git('rev-parse', 'HEAD');
if (git('status', '--porcelain', '--untracked-files=no')) throw new Error(`${source} has tracked changes`);

const outRoot = path.resolve('content', values.project);
const frontmatterTitle = text => /^---\n[\s\S]*?^title:\s*["']?(.+?)["']?\s*$/m.exec(text)?.[1];

/** Nextra page: provided components replace nextra imports; the theme renders the title. */
function adaptMix(text) {
  const title = frontmatterTitle(text);
  let out = text.replace(/^import\s+\{([^}]+)\}\s+from\s+["']nextra\/components["'];?\n+/gm, (_, names) => {
    const unknown = names.split(',').map(name => name.trim()).filter(name => name && !['Callout', 'Steps'].includes(name));
    if (unknown.length) throw new Error(`Unsupported nextra imports: ${unknown.join(', ')}`);
    return '';
  });
  if (/^import\s/m.test(out.replace(/^(```|~~~)[^\n]*\n[\s\S]*?^\1[^\n]*$/gm, ''))) throw new Error('Page has imports this site does not provide');
  if (title) out = out.replace(new RegExp(`^# ${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\n+`, 'm'), '');
  // Concepta URLs move under /mix/docs; the site uses trailing slashes.
  out = out.replace(/\]\(\/documentation\/mix\/([^)#\s]+?)\/?(#[^)\s]*)?\)/g, (_, slug, hash = '') => `](/mix/docs/${slug}/${hash})`);
  return out;
}

/** docs.page page: links are relative to the project root. */
function adaptNakedUi(text) {
  return text.replace(/\]\(\/([^)#\s]*?)\/?(#[^)\s]*)?\)/g, (_, slug, hash = '') => `](/naked-ui/docs/${slug ? `${slug}/` : ''}${hash})`);
}

/** Order folders and pages as Nextra's _meta.js files do. */
async function mixNavigation(imported) {
  const readMeta = async dir => {
    const file = path.join(source, PROFILES.mix.contentRoot, dir, '_meta.js');
    const text = existsSync(file) ? await readFile(file, 'utf8') : '';
    return [...text.matchAll(/^\s*['"]?([\w-]+)['"]?\s*:\s*['"]([^'"]+)['"]/gm)].map(([, key, title]) => ({ key, title }));
  };
  const root = await readMeta('');
  const folders = new Map();
  for (const page of imported) {
    const [folder, name] = page.split('/');
    if (!folders.has(folder)) folders.set(folder, new Set());
    folders.get(folder).add(name);
  }
  const files = { 'meta.json': { pages: root.map(item => item.key).filter(key => folders.has(key)) } };
  for (const [folder, names] of folders) {
    const meta = await readMeta(folder);
    files[`${folder}/meta.json`] = {
      title: root.find(item => item.key === folder)?.title ?? folder,
      pages: meta.map(item => item.key).filter(key => names.has(key)),
    };
  }
  return files;
}

/** Order pages as docs.json's sidebar does. */
async function nakedUiNavigation(imported) {
  const { sidebar } = JSON.parse(await readFile(path.join(source, 'docs.json'), 'utf8'));
  const folders = new Map();
  for (const group of sidebar) {
    for (const page of group.pages) {
      const slug = page.href.replace(/^\/+|\/+$/g, '') || 'index';
      if (!imported.includes(slug)) continue;
      const [folder, name] = slug.includes('/') ? slug.split('/') : ['', slug];
      if (!folders.has(folder)) folders.set(folder, { title: group.group, names: [] });
      folders.get(folder).names.push(name);
    }
  }
  const files = { 'meta.json': { pages: [...folders.keys()].map(folder => folder || null).filter(Boolean) } };
  for (const [folder, { title, names }] of folders) {
    if (folder) files[`${folder}/meta.json`] = { title, pages: names };
    else files['meta.json'].pages.unshift(...names);
  }
  return files;
}

const sourcesFile = path.join(outRoot, 'SOURCES.json');
const record = existsSync(sourcesFile)
  ? JSON.parse(await readFile(sourcesFile, 'utf8'))
  : { repository: profile.repository, commit, pages: {} };
if (record.commit !== commit) throw new Error(`${sourcesFile} records ${record.commit}; import from one commit at a time`);

for (const page of pages) {
  const from = path.join(source, profile.contentRoot, `${page}.mdx`);
  const original = await readFile(from, 'utf8');
  const target = path.join(outRoot, `${page}.mdx`);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, profile.adapt(original));
  record.pages[page] = {
    path: path.posix.join(profile.contentRoot, `${page}.mdx`),
    sha256: createHash('sha256').update(original).digest('hex'),
  };
  console.log(`imported ${profile.repository}@${commit.slice(0, 12)}:${record.pages[page].path}`);
}

for (const [file, meta] of Object.entries(await profile.navigation(Object.keys(record.pages)))) {
  await mkdir(path.dirname(path.join(outRoot, file)), { recursive: true });
  await writeFile(path.join(outRoot, file), JSON.stringify(meta, null, 2) + '\n');
}
record.pages = Object.fromEntries(Object.entries(record.pages).sort());
await writeFile(sourcesFile, JSON.stringify(record, null, 2) + '\n');
