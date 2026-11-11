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
import { mkdtemp, readdir, rm, writeFile, cp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const SOURCE_PATH = 'apps/fortal_landing';
const PACKAGE = path.resolve('packages/fortal_site');
// Never part of the app, even if committed by mistake: local evidence and build output.
const EXCLUDED = /^(?:\.context|\.dart_tool|\.fvm|build|captures?|screenshots?|shots)(?:\/|$)/;

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

const temporary = await mkdtemp(path.join(tmpdir(), 'fortal-site-'));
try {
  const archive = execFileSync('git', ['-C', path.resolve(checkout), 'archive', commit, SOURCE_PATH], { maxBuffer: 256 * 1024 * 1024 });
  execFileSync('tar', ['-x', '-C', temporary], { input: archive });
  const from = path.join(temporary, SOURCE_PATH);
  await rm(PACKAGE, { recursive: true, force: true });
  await cp(from, PACKAGE, { recursive: true, filter: file => !EXCLUDED.test(path.relative(from, file)) });
} finally {
  await rm(temporary, { recursive: true, force: true });
}

const files = (await readdir(PACKAGE, { recursive: true, withFileTypes: true })).filter(entry => entry.isFile()).length;
await writeFile(path.join(PACKAGE, 'SOURCES.json'), JSON.stringify({ repository, commit, path: SOURCE_PATH }, null, 2) + '\n');
console.log(`synced ${files} files from ${repository}@${commit.slice(0, 12)}:${SOURCE_PATH}`);
