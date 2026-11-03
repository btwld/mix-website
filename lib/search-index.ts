import { initAdvancedSearch, initSimpleSearch } from 'fumadocs-core/search/server';
import { PROJECTS, PROJECT_IDS } from './projects.mjs';
import { sources } from './source';

// One index across the three projects. Every record carries its project name
// as the first breadcrumb, which the search dialog shows as the result label.
const pages = PROJECT_IDS.flatMap(project => sources[project].getPages().map(page => ({ project, page })));

// Page discovery comes before section matches, so a long guide cannot bury
// the page whose name the reader entered (carried from btwld/remix).
export const pageSearch = initSimpleSearch({
  indexes: pages.map(({ project, page }) => ({
    title: page.data.title,
    description: page.data.description,
    keywords: page.data.keywords.join(' '),
    content: '',
    url: page.url,
    breadcrumbs: [PROJECTS[project].name],
  })),
  search: { boost: { title: 8, keywords: 2 }, tolerance: 0 },
});

export const sectionSearch = initAdvancedSearch({
  indexes: pages.map(({ project, page }) => ({
    id: page.url,
    title: page.data.title,
    description: page.data.description,
    url: page.url,
    tag: project,
    breadcrumbs: [PROJECTS[project].name],
    structuredData: page.data.structuredData,
  })),
  search: { groupBy: { properties: ['page_id'], maxResult: 3 } },
});
