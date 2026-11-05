#!/usr/bin/env node
// Usage: node scripts/site-inputs/pack.mjs <stage-dir> <output.tar.gz>
// Packs a producer's staging directory and prints its digest as JSON.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { packDirectory, sha256 } from './tar.mjs';
import { validateSiteInputMetadata } from './lock.mjs';

const [stage, output] = process.argv.slice(2);
if (!stage || !output) {
  console.error('Usage: pack.mjs <stage-dir> <output.tar.gz>');
  process.exit(2);
}
const metadata = JSON.parse(await readFile(path.join(stage, 'site-input.json'), 'utf8'));
validateSiteInputMetadata(metadata);
const { archive, files } = await packDirectory(stage);
await mkdir(path.dirname(path.resolve(output)), { recursive: true });
await writeFile(output, archive);
console.log(JSON.stringify({
  name: metadata.name,
  file: path.basename(output),
  sha256: sha256(archive),
  size: archive.length,
  files: files.length,
  source: metadata.source,
}, null, 2));
