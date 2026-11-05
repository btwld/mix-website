#!/usr/bin/env node
// Generate locally for emulator parity. Privileged deployment uses its own
// protected-default-branch policy, never configuration from the PR artifact.
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { hostingConfig } from '../deploy/hosting-config.mjs';
await mkdir('.generated', { recursive: true });
await writeFile('.generated/firebase.preview.json', JSON.stringify({ hosting: hostingConfig(path.relative(path.resolve('.generated'), path.resolve(process.env.STATIC_PREVIEW_OUT ?? 'out'))) }, null, 2) + '\n');
console.log('Prepared a noindex Firebase Hosting preview configuration; not deployed.');
