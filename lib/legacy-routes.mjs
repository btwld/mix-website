// Prepared same-origin compatibility routes. Activating redirects on Concepta,
// GitHub Pages or docs.page requires changes at those origins during cutover.
import { readFileSync } from 'node:fs';
const inventory = JSON.parse(readFileSync(new URL('../docs/migration/legacy-urls.json', import.meta.url), 'utf8'));
const history = JSON.parse(readFileSync(new URL('../docs/migration/historical-paths.json', import.meta.url), 'utf8'));
const routes = new Map();
const trailing = value => value === '/' ? value : value.replace(/\/+$/, '') + '/';
for (const row of inventory) {
  const old = new URL(row.oldUrl);
  if (!['fluttermix.com', 'www.fluttermix.com'].includes(old.hostname)) continue;
  if (!row.destination?.startsWith('/') || row.destination.includes(':') || old.pathname.includes(':') || old.hash) continue;
  const from = trailing(old.pathname);
  const to = row.destination;
  if (from !== to && !from.startsWith('/previews/')) routes.set(from, to);
}
for (const row of history.paths) {
  if (row.classification === 'redirected' && row.destination && trailing(row.oldPath) !== row.destination) routes.set(trailing(row.oldPath), row.destination);
}
for (const [prefix, target] of [['mix', 'mix'], ['remix', 'remix']]) {
  routes.set(`/documentation/${prefix}/:path*/`, `/${target}/docs/:path*/`);
}
routes.set('/documentation/remix/components/', '/remix/docs/components/');
routes.set('/naked_ui/', '/naked-ui/');

export const legacyRedirects = [...routes].map(([source, destination]) => ({ source, destination, permanent: true }));
// Keep the live, maintained dashboard reachable while its own compiled input
// remains on the original host. This does not retire or copy its deployment.
// The examples' index, until the other presets' examples join Fortal's.
export const examplesRedirect = { source: '/remix/examples/', destination: '/remix/examples/fortal/', permanent: false };
export const dashboardRedirect = { source: '/remix/dashboard/:path*/', destination: 'https://btwld.github.io/remix/dashboard/:path*/', permanent: false };
