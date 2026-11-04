import assert from 'node:assert/strict';
import { test } from 'node:test';

test('production indexes docs while keeping Flutter apps/data out of search', async () => {
  const previous = process.env.SITE_INDEXING;
  process.env.SITE_INDEXING = 'index';
  try {
    const { default: config } = await import('../../next.config.mjs?production-policy');
    const headers = await config.headers();
    assert.ok(!headers.some(row => row.source === '/:path*'));
    for (const source of ['/previews/mix/:build/:path*', '/remix/catalog/:path*', '/__site.json', '/api/:path*']) {
      assert.ok(headers.find(row => row.source === source)?.headers.some(header => header.key === 'X-Robots-Tag' && header.value.includes('noindex')), source);
    }
  } finally {
    if (previous === undefined) delete process.env.SITE_INDEXING; else process.env.SITE_INDEXING = previous;
  }
});
