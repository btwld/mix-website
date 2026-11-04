import { readFileSync } from 'node:fs';
import { createMDX } from 'fumadocs-mdx/next';
import { legacyRedirects, dashboardRedirect } from './lib/legacy-routes.mjs';
import { PROJECTS } from './lib/projects.mjs';

const staticPreview = process.env.SITE_BUILD_TARGET === 'static-preview';
const indexing = process.env.SITE_INDEXING === 'index';
const catalog = PROJECTS.remix.catalogPath;

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  // Starting the site must not generate an untracked authoring instruction file.
  agentRules: false,
  output: staticPreview ? 'export' : undefined,
  distDir: process.env.SITE_DIST_DIR ?? '.next',
  poweredByHeader: false,
  // Matches the GitHub Pages URLs Remix already publishes.
  trailingSlash: true,
  images: { unoptimized: true },
  async headers() {
    if (staticPreview) return [];
    return [
      // Every backend except production stays out of search indexes.
      ...(indexing ? [] : [{ source: '/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] }]),
      // Content-addressed Mix builds never change at a given URL.
      { source: '/previews/mix/:build/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }, { key: 'X-Robots-Tag', value: 'noindex, nofollow' }] },
      // The catalog keeps fixed file names under its own base href, so
      // browsers revalidate it on every load instead of mixing builds.
      { source: `${catalog}:path*`, headers: [{ key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' }, { key: 'X-Robots-Tag', value: 'noindex, nofollow' }] },
      { source: '/__site.json', headers: [{ key: 'Cache-Control', value: 'no-store' }, { key: 'X-Robots-Tag', value: 'noindex, nofollow' }] },
      { source: '/api/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] },
    ];
  },
  async rewrites() {
    if (staticPreview) return [];
    return {
      // Public files have no directory indexes; serve the catalog's own page.
      beforeFiles: [{ source: catalog, destination: `${catalog}index.html` }],
    };
  },
  async redirects() {
    if (staticPreview) return [];
    // Compatibility aliases plus any deliberately scoped-out docs links.
    // Read here, not at module load: Firebase's Next.js adapter loads this
    // config before it runs the build script that writes the file.
    const pendingRedirects = JSON.parse(readFileSync(new URL('./.generated/pending-redirects.json', import.meta.url), 'utf8'));
    return [...legacyRedirects, dashboardRedirect, ...pendingRedirects.map(({ source, destination }) => ({ source: `${source}/`, destination, permanent: false }))];
  },
};

// Next warns about these keys on export even when they return empty arrays.
// The static host implements the same policy from scripts/deploy/hosting-config.
if (staticPreview) {
  delete config.headers;
  delete config.rewrites;
  delete config.redirects;
}

export default createMDX()(config);
