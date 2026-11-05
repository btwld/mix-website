import type { MetadataRoute } from 'next';
import { PROJECT_IDS, PROJECTS } from '@/lib/projects.mjs';
import { sources } from '@/lib/source';
import { indexing, siteUrl } from '@/lib/site';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  if (!indexing) return [];
  const routes = new Set(['/', ...PROJECT_IDS.flatMap(id => [PROJECTS[id].overviewPath, `${PROJECTS[id].docsBase}/`, ...sources[id].getPages().map(page => `${page.url}/`)])]);
  for (const id of PROJECT_IDS) {
    for (const page of sources[id].getPages()) {
      for (let length = 1; length < page.slugs.length; length++) routes.add(`${PROJECTS[id].docsBase}/${page.slugs.slice(0, length).join('/')}/`);
    }
  }
  // Embedded Flutter apps, search data, assets and old redirect aliases are not
  // separate docs pages. Every listed page is an actual generated site route.
  return [...routes].sort().map(route => ({ url: new URL(route, siteUrl).href }));
}
