import { legacyRedirects, dashboardRedirect } from '../../lib/legacy-routes.mjs';

// Next catch-alls allow zero segments and repeat '*' in destinations. Hosting
// captures use ':path*' only in the source and ':path' in the destination.
// Spell out empty-tail routes: production Hosting does not match the emulator's
// interpretation of a trailing slash after the catch-all.
export function hostingRedirects(routes) {
  return routes.flatMap(({ source, destination, permanent }) => {
    const type = permanent ? 308 : 307;
    const tail = /\/:([A-Za-z0-9_]+)\*\/$/.exec(source);
    if (!tail) return [{ source, destination, type }];
    const prefix = source.slice(0, tail.index);
    const capture = `:${tail[1]}*/`;
    return [
      { source: prefix, destination: destination.replace(capture, ''), type },
      { source: `${prefix}/`, destination: destination.replace(capture, ''), type },
      { source: `${prefix}/:${tail[1]}*`, destination: destination.replace(capture, `:${tail[1]}`), type },
    ];
  });
}

/** Trusted routing policy, shared by the emulator and privileged deployment. */
export function hostingConfig(publicPath, site) {
  return {
    ...(site ? { site } : {}),
    public: publicPath,
    ignore: ['firebase.json', '**/.*', '**/node_modules/**'],
    trailingSlash: true,
    headers: [
      { source: '**', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] },
      { source: '/previews/mix/**', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] },
      { source: '/remix/catalog/**', headers: [{ key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' }] },
      { source: '**/*.wasm', headers: [{ key: 'Content-Type', value: 'application/wasm' }] },
      { source: '/v2-flutter/**', headers: [{ key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' }] },
      { source: '/__site.json', headers: [{ key: 'Cache-Control', value: 'no-store' }] },
    ],
    redirects: hostingRedirects([...legacyRedirects, dashboardRedirect]),
  };
}

/** Firebase Hosting REST uses glob/location/statusCode instead of CLI names. */
export function hostingVersionConfig() {
  const c = hostingConfig('unused');
  return {
    trailingSlashBehavior: c.trailingSlash ? 'ADD' : 'REMOVE',
    headers: c.headers.map(row => ({ glob: row.source, headers: Object.fromEntries(row.headers.map(h => [h.key, h.value])) })),
    redirects: c.redirects.map(row => ({ glob: row.source, location: row.destination, statusCode: row.type })),
  };
}
