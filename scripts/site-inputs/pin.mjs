#!/usr/bin/env node
// Record a site-input archive in sources.lock.json and seed the local cache.
//
// Usage: node scripts/site-inputs/pin.mjs <archive.tar.gz> [--url <release-asset-url>]
//
// The archive's own site-input.json names the input and its source commit.
// Without --url, the commit-addressed release coordinates are used. Pin only
// archives that are (or will be, before merge) published at that URL: the
// prebuild downloads from it and fails if the bytes differ.
import { mkdir, readFile, writeFile, copyFile } from 'node:fs/promises';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { releaseCoordinates, validateLock, validateSiteInputMetadata } from './lock.mjs';
import { readArchive, sha256 } from './tar.mjs';
import { paths } from './sync-lib.mjs';

const { values, positionals } = parseArgs({ options: { url: { type: 'string' } }, allowPositionals: true });
const [archivePath] = positionals;
if (!archivePath) {
  console.error('Usage: pin.mjs <archive.tar.gz> [--url <release-asset-url>]');
  process.exit(2);
}

const root = process.cwd();
const p = paths(root);
const data = await readFile(archivePath);
const metadataEntry = readArchive(data).find(entry => entry.path === 'site-input.json');
if (!metadataEntry) throw new Error('Archive has no site-input.json');
const metadata = validateSiteInputMetadata(JSON.parse(metadataEntry.data.toString('utf8')));
const digest = sha256(data);
const url = values.url ?? releaseCoordinates(metadata.name, metadata.source.commit).url;

let lock;
try {
  lock = JSON.parse(await readFile(p.lock, 'utf8'));
} catch {
  lock = { version: 1, inputs: {} };
}
lock.inputs[metadata.name] = {
  source: { repository: metadata.source.repository, commit: metadata.source.commit },
  artifact: { url, sha256: digest, size: data.length },
  toolchain: metadata.toolchain ?? undefined,
  producer: metadata.producer ?? undefined,
};
lock.inputs = Object.fromEntries(Object.entries(lock.inputs).sort(([a], [b]) => a.localeCompare(b)));
try {
  validateLock(lock);
} catch (error) {
  // A partially pinned lock is expected while adding inputs one at a time.
  if (!/missing input/.test(error.message)) throw error;
}
await writeFile(p.lock, JSON.stringify(lock, null, 2) + '\n');
await mkdir(p.cache, { recursive: true });
await copyFile(archivePath, path.join(p.cache, `${digest}.tar.gz`));
console.log(`pinned ${metadata.name} ${metadata.source.repository}@${metadata.source.commit.slice(0, 12)} sha256 ${digest}`);
