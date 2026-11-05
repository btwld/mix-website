import { createBaseLayoutOptions } from '@concepta/docs-theme';
import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { PROJECTS, type ProjectId } from './projects.mjs';
import { projectConfig } from './site';

/** A project's docs layout: its own wordmark and a menu to the other projects. */
export function projectLayoutOptions(id: ProjectId): BaseLayoutProps {
  const options = createBaseLayoutOptions(projectConfig(id));
  // The theme links the content repository; readers want the project's own.
  options.githubUrl = PROJECTS[id].codeRepository;
  // Dark is the only site theme, so the sidebar and mobile bar offer no switch.
  options.themeSwitch = { ...options.themeSwitch, enabled: false };
  // The Remix catalog is a separate Flutter app, even on this origin.
  options.links = options.links?.map(link =>
    'url' in link && link.url === PROJECTS.remix.catalogPath ? { ...link, external: true } : link,
  );
  return options;
}
