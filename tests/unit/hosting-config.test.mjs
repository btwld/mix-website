import assert from 'node:assert/strict';
import { test } from 'node:test';
import { hostingRedirects, hostingConfig, hostingVersionConfig } from '../../scripts/deploy/hosting-config.mjs';

test('Hosting catch-alls cover the empty tail and use Hosting destination captures', () => {
  const routes = hostingRedirects([{ source: '/remix/dashboard/:path*/', destination: 'https://btwld.github.io/remix/dashboard/:path*/', permanent: false }]);
  for (const source of ['/remix/dashboard', '/remix/dashboard/']) {
    assert.deepEqual(routes.find(row => row.source === source), { source, destination: 'https://btwld.github.io/remix/dashboard/', type: 307 });
  }
  const wildcard = routes.find(row => row.source === '/remix/dashboard/:path*');
  assert.equal(wildcard.destination, 'https://btwld.github.io/remix/dashboard/:path');
  for (const tail of ['index.html', 'assets/main.js', 'nested/']) {
    assert.equal(wildcard.destination.replace(':path', tail), `https://btwld.github.io/remix/dashboard/${tail}`);
  }
});

test('CLI and REST preserve ordered exact redirects and normalize all catch-alls', () => {
  const cli = hostingConfig('out');
  const rest = hostingVersionConfig();
  assert.deepEqual(rest.redirects, cli.redirects.map(({ source, destination, type }) => ({ glob: source, location: destination, statusCode: type })));
  for (const prefix of ['/documentation/mix', '/documentation/remix', '/remix/dashboard']) {
    assert.ok(cli.redirects.some(row => row.source === prefix + '/'));
    assert.ok(cli.redirects.some(row => row.source === prefix + '/:path*'));
  }
  assert.ok(cli.redirects.every(row => !row.destination.includes(':path*') && !row.source.includes(':path*/')));
  assert.deepEqual(hostingRedirects([{source:'/old/',destination:'/new/',permanent:true}]), [{source:'/old/',destination:'/new/',type:308}]);
});

// Mutable Flutter URLs must revalidate when the source panels change.
test('showcase assets revalidate on both Hosting deployment paths', () => {
  const cli = hostingConfig('out').headers.find(row => row.source === '/v2-flutter/**');
  assert.deepEqual(cli.headers, [{ key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' }]);
  const rest = hostingVersionConfig().headers.find(row => row.glob === '/v2-flutter/**');
  assert.equal(rest.headers['Cache-Control'], 'public, max-age=0, must-revalidate');
});
