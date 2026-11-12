#!/usr/bin/env node
// Refresh packages/fortal_site from the Fortal site's source repository.
//
// Usage: node scripts/migrate/sync-fortal-site.mjs <source checkout> [<commit>]
//
// Copies only what is committed at <commit> (default HEAD) under
// apps/fortal_landing, never the working tree, and replaces the package with
// it. The package is otherwise unchanged: the website adapts it only through
// the producer's build flags (scripts/site-inputs/produce/fortal-site.sh).
// The source repository and commit are recorded in packages/fortal_site/SOURCES.json.
// Commit the result, then rebuild and pin the fortal-site input.
import { execFileSync } from 'node:child_process';
import { mkdtemp, readdir, readFile, rm, writeFile, cp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const SOURCE_PATH = 'apps/fortal_landing';
const PACKAGE = path.resolve('packages/fortal_site');
// Never part of the app, even if committed by mistake: local evidence, build
// output, and the source repository's working notes (the package carries its
// own README, written below).
const EXCLUDED = /^(?:\.context|\.dart_tool|\.fvm|build|captures?|screenshots?|shots|README\.md|SHOWCASE-PLAN\.md)(?:\/|$)/;

const readme = licences => `# Fortal site

The Fortal showcase served at \`/remix/examples/fortal/\`: a browsable, slide-by-slide site for
Fortal, the design system built with Remix, made from real Fortal components.

This package is copied from its source repository; \`SOURCES.json\` records the
repository and commit. Do not edit it here. Refresh it with
\`node scripts/migrate/sync-fortal-site.mjs <source checkout> [<commit>]\`, then
publish and pin the \`fortal-site\` site input
(\`scripts/site-inputs/produce/fortal-site.sh\`).

${licences}
`;

const [checkout, ref = 'HEAD'] = process.argv.slice(2);
if (!checkout) {
  console.error('Usage: sync-fortal-site.mjs <source checkout> [<commit>]');
  process.exit(2);
}
const git = (...args) => execFileSync('git', ['-C', path.resolve(checkout), ...args], { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
const commit = git('rev-parse', '--verify', `${ref}^{commit}`).trim();
const remote = git('remote', 'get-url', 'origin').trim();
const repository = /github\.com[:/]([^/]+\/[^/]+?)(?:\.git)?$/.exec(remote)?.[1];
if (!repository) throw new Error(`Cannot read owner/name from the origin remote ${remote}`);

let licences;
const temporary = await mkdtemp(path.join(tmpdir(), 'fortal-site-'));
try {
  const archive = execFileSync('git', ['-C', path.resolve(checkout), 'archive', commit, SOURCE_PATH], { maxBuffer: 256 * 1024 * 1024 });
  execFileSync('tar', ['-x', '-C', temporary], { input: archive });
  const from = path.join(temporary, SOURCE_PATH);
  // The source README is working notes and stays out; only its licence section,
  // which credits every font, image and shader the app ships, is carried over.
  const notes = await readFile(path.join(from, 'README.md'), 'utf8');
  const section = /^## Licences\n[\s\S]*?(?=^## |(?![\s\S]))/m.exec(notes)?.[0];
  if (!section) throw new Error('The source README has no "## Licences" section to carry over.');
  licences = section.trimEnd();
  await rm(PACKAGE, { recursive: true, force: true });
  await cp(from, PACKAGE, { recursive: true, filter: file => !EXCLUDED.test(path.relative(from, file)) });
} finally {
  await rm(temporary, { recursive: true, force: true });
}

const files = (await readdir(PACKAGE, { recursive: true, withFileTypes: true })).filter(entry => entry.isFile()).length;
await writeFile(path.join(PACKAGE, 'SOURCES.json'), JSON.stringify({ repository, commit, path: SOURCE_PATH }, null, 2) + '\n');
await writeFile(path.join(PACKAGE, 'README.md'), readme(licences));
console.log(`synced ${files} files from ${repository}@${commit.slice(0, 12)}:${SOURCE_PATH}`);
