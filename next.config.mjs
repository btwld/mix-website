import { readFileSync } from 'node:fs';
import { createMDX } from 'fumadocs-mdx/next';
import { PROJECTS } from './lib/projects.mjs';

// Written by scripts/site-inputs/sync.mjs, which every dev/build runs first.
const pendingRedirects = JSON.parse(readFileSync(new URL('./.generated/pending-redirects.json', import.meta.url), 'utf8'));
const indexing = process.env.SITE_INDEXING === 'index';
const catalog = PROJECTS.remix.catalogPath;

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Matches the GitHub Pages URLs Remix already publishes.
  trailingSlash: true,
  images: { unoptimized: true },
  async headers() {
    return [
      // Every backend except production stays out of search indexes.
      ...(indexing ? [] : [{ source: '/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] }]),
      // Content-addressed Mix builds never change at a given URL.
      { source: '/previews/mix/:build/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] },
      // The catalog keeps fixed file names under its own base href, so
      // browsers revalidate it on every load instead of mixing builds.
      { source: `${catalog}:path*`, headers: [{ key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' }] },
    ];
  },
  async rewrites() {
    return {
      // Public files have no directory indexes; serve the catalog's own page.
      beforeFiles: [{ source: catalog, destination: `${catalog}index.html` }],
    };
  },
  async redirects() {
    // Temporary until each page migrates: links resolve to its current home.
    return pendingRedirects.map(({ source, destination }) => ({ source: `${source}/`, destination, permanent: false }));
  },
};

export default createMDX()(config);
