import { createBaseLayoutOptions } from '@concepta/docs-theme';
import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { PROJECTS, PROJECT_IDS, type ProjectId } from './projects.mjs';
import { SITE_NAME, projectConfig } from './site';

/** Shared navigation: the site name, then every project's overview. */
export function siteLayoutOptions(): BaseLayoutProps {
  return {
    nav: { title: SITE_NAME, url: '/' },
    links: PROJECT_IDS.map(id => ({ type: 'main' as const, text: PROJECTS[id].name, url: PROJECTS[id].overviewPath, active: 'nested-url' as const })),
  };
}

/** A project's docs layout: its own wordmark and a menu to the other projects. */
export function projectLayoutOptions(id: ProjectId): BaseLayoutProps {
  const options = createBaseLayoutOptions(projectConfig(id));
  // The theme links the content repository; readers want the project's own.
  options.githubUrl = PROJECTS[id].codeRepository;
  // The Remix catalog is a separate Flutter app, even on this origin.
  options.links = options.links?.map(link =>
    'url' in link && link.url === PROJECTS.remix.catalogPath ? { ...link, external: true } : link,
  );
  return options;
}
