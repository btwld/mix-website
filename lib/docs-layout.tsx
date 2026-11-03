import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import type { ReactNode } from 'react';
import { projectLayoutOptions } from './layout';
import type { ProjectId } from './projects.mjs';
import { sources } from './source';

/** Each project gets its own sidebar tree and accent; navigation is shared. */
export function ProjectDocsLayout({ project, children }: { project: ProjectId; children: ReactNode }) {
  return <div className={`project-${project} flex flex-1 flex-col`}>
    <DocsLayout tree={sources[project].getPageTree()} {...projectLayoutOptions(project)}>{children}</DocsLayout>
  </div>;
}
