import type { SearchClient } from 'fumadocs-core/search/client';
import { staticClient } from 'fumadocs-core/search/client/orama-static';
import { PROJECTS, PROJECT_IDS, type ProjectId } from './projects.mjs';

const pages = staticClient({ from: '/api/search-pages.json', search: { boost: { title: 8, keywords: 2 }, tolerance: 0, limit: 40 } });
const sections = staticClient({ from: '/api/search.json', search: { groupBy: { properties: ['page_id'], maxResult: 3 }, limit: 90 } });

const projectOf = (url: string) => PROJECT_IDS.find(id => url === PROJECTS[id].docsBase || url.startsWith(`${PROJECTS[id].docsBase}/`) || url.startsWith(`${PROJECTS[id].docsBase}#`));
const inProject = (url: string, project: ProjectId | null) => !project || projectOf(url) === project;

/** Page matches first, each followed by its section matches; optionally one project only. */
export function createSearchClient(project: ProjectId | null): SearchClient {
  return {
    deps: [project],
    async search(query: string) {
      if (!query.trim()) return [];
      const [pageResults, sectionResults] = await Promise.all([pages.search(query), sections.search(query)]);
      const scopedPages = pageResults.filter(result => inProject(result.url, project));
      const scopedSections = sectionResults.filter(result => inProject(result.url, project));
      const promoted = new Set(scopedPages.map(result => result.url));
      const ordered = scopedPages.flatMap(page => [page,
        ...scopedSections.filter(result => result.type !== 'page' && result.url.split('#')[0] === page.url),
      ]);
      ordered.push(...scopedSections.filter(result => !promoted.has(result.url.split('#')[0])));
      const seen = new Set<string>();
      return ordered.filter(result => {
        if (seen.has(result.url)) return false;
        seen.add(result.url);
        return true;
      }).slice(0, 20).map(result => {
        // Label every result, including heading and text matches, with its project.
        const id = projectOf(result.url);
        return id ? { ...result, breadcrumbs: [PROJECTS[id].name] } : result;
      });
    },
  };
}
