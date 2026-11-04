// Project routing shared by the Next app (remark plugin, layouts) and the
// site-input prebuild (scope filtering, pending redirects). Plain ESM so both
// TypeScript and Node scripts import the same rules.

/** @typedef {'mix' | 'remix' | 'naked-ui'} ProjectId */

export const PROJECTS = /** @type {const} */ ({
  mix: {
    id: 'mix',
    name: 'Mix',
    description: 'Styling system for Flutter: utility-first styles, tokens, variants, and animation.',
    overviewPath: '/mix/',
    docsBase: '/mix/docs',
    // Mix MDX lives in this repository and is written with final URLs.
    upstreamLinks: false,
    legacyDocsBase: 'https://concepta.dev/documentation/mix',
    legacyTrailingSlash: false,
    repository: { url: 'https://github.com/btwld/mix-website', contentPath: 'content/mix' },
    codeRepository: 'https://github.com/btwld/mix',
  },
  remix: {
    id: 'remix',
    name: 'Remix',
    description: 'Flutter components built on Mix and Naked UI, with the Fortal design system.',
    overviewPath: '/remix/',
    docsBase: '/remix/docs',
    // btwld/remix authors links relative to its own /remix GitHub Pages mount.
    upstreamLinks: true,
    assetsBase: '/remix/assets',
    catalogPath: '/remix/catalog/',
    legacyDocsBase: 'https://btwld.github.io/remix',
    legacyTrailingSlash: true,
    repository: { url: 'https://github.com/btwld/remix', contentPath: 'docs' },
    codeRepository: 'https://github.com/btwld/remix',
  },
  'naked-ui': {
    id: 'naked-ui',
    name: 'Naked UI',
    description: 'Headless Flutter widgets: behavior, semantics, and interaction state without styling.',
    overviewPath: '/naked-ui/',
    docsBase: '/naked-ui/docs',
    // Staged here with final URLs until btwld/remix has a Naked UI docs folder.
    upstreamLinks: false,
    legacyDocsBase: 'https://docs.page/btwld/naked_ui',
    legacyTrailingSlash: false,
    repository: { url: 'https://github.com/btwld/mix-website', contentPath: 'content/naked-ui' },
    codeRepository: 'https://github.com/btwld/remix/tree/main/packages/naked_ui',
  },
});

export const PROJECT_IDS = /** @type {ProjectId[]} */ (Object.keys(PROJECTS));

function splitSuffix(url) {
  const index = url.search(/[?#]/);
  return index === -1 ? [url, ''] : [url.slice(0, index), url.slice(index)];
}

/**
 * Map a root-relative URL authored upstream to its route on this site.
 * Leaves external, relative, and already-final URLs untouched.
 */
export function rewriteUpstreamUrl(projectId, url) {
  const project = PROJECTS[projectId];
  if (!project?.upstreamLinks || typeof url !== 'string' || !url.startsWith('/') || url.startsWith('//')) return url;
  const [pathname, suffix] = splitSuffix(url);
  if (pathname === '/mix' || pathname.startsWith('/mix/') || pathname === '/remix' || pathname.startsWith('/remix/') || pathname === '/naked-ui' || pathname.startsWith('/naked-ui/')) return url;
  if (projectId === 'remix' && (pathname === '/dashboard' || pathname.startsWith('/dashboard/'))) return '/remix' + pathname + suffix;
  if (project.assetsBase && pathname.startsWith('/assets/')) return project.assetsBase + pathname.slice('/assets'.length) + suffix;
  if (project.catalogPath && (pathname === '/catalog' || pathname.startsWith('/catalog/'))) {
    return project.catalogPath + pathname.replace(/^\/catalog\/?/, '') + suffix;
  }
  const trimmed = pathname.replace(/\/+$/, '');
  return `${project.docsBase}${trimmed}/${suffix}`;
}

/** Docs page slug (`components/button`, '' for the index) for a site path inside a project's docs. */
export function docsSlugFor(projectId, sitePath) {
  const base = PROJECTS[projectId].docsBase;
  const [pathname] = splitSuffix(sitePath);
  if (pathname !== base && !pathname.startsWith(`${base}/`)) return null;
  return pathname.slice(base.length).replace(/^\/+|\/+$/g, '');
}

/** Where a not-yet-migrated docs page is served today. */
export function legacyDocsUrl(projectId, slug) {
  const project = PROJECTS[projectId];
  const url = slug ? `${project.legacyDocsBase}/${slug}` : project.legacyDocsBase;
  return project.legacyTrailingSlash ? `${url}/` : url;
}
