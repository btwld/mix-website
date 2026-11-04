import { legacyRedirects, dashboardRedirect } from '../../lib/legacy-routes.mjs';

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
      { source: '/__site.json', headers: [{ key: 'Cache-Control', value: 'no-store' }] },
    ],
    redirects: [...legacyRedirects, dashboardRedirect].map(({ source, destination, permanent }) => ({ source, destination, type: permanent ? 308 : 307 })),
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
