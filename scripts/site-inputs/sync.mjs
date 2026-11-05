#!/usr/bin/env node
// Website prebuild: fetch, verify, and stage the inputs pinned in sources.lock.json.
// Runs before every `next dev`/`next build`, including inside Firebase App Hosting.
//   --offline (or SITE_INPUTS_OFFLINE=1): use only the local cache; never download.
//   SITE_INPUTS_CACHE=<dir>: cache location (default .site-inputs/cache).
import { syncSiteInputs } from './sync-lib.mjs';

const offline = process.argv.includes('--offline') || process.env.SITE_INPUTS_OFFLINE === '1';
try {
  await syncSiteInputs({ root: process.cwd(), offline });
} catch (error) {
  console.error(`\nsite inputs: ${error.message}`);
  process.exit(1);
}
