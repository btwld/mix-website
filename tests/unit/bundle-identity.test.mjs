import assert from 'node:assert/strict';
import { test } from 'node:test';
import { acceptMixBundle } from '../../components/previews/mix/bundle-identity.mjs';

test('same bundle reuses page identity across replacement chunks; another bundle reloads before loading data', async () => {
  let reloads = 0;
  const page = { location: { href: 'https://example.test/mix/docs/', reload: () => reloads++ } };
  assert.equal(acceptMixBundle(page, '/previews/mix/a'), true);
  const replacement = await import('../../components/previews/mix/bundle-identity.mjs?replacement-chunk');
  assert.equal(replacement.acceptMixBundle(page, '/previews/mix/a/'), true);
  assert.equal(reloads, 0);
  assert.equal(replacement.acceptMixBundle(page, '/previews/mix/b/'), false);
  assert.equal(reloads, 1);
  assert.equal(page.__MIX_FLUTTER_BUNDLE__, 'https://example.test/previews/mix/a/');
});
