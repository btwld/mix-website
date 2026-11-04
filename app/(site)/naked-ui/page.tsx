import type { Metadata } from 'next';
import { ProjectCard } from '@/components/project-card';
import { canonicalMetadata } from '@/lib/site';
import { PROJECTS } from '@/lib/projects.mjs';

export const metadata: Metadata = { title: 'Naked UI', description: PROJECTS['naked-ui'].description, ...canonicalMetadata(PROJECTS['naked-ui'].overviewPath) };

export default function Overview() {
  return <main className="site-home">
    <ProjectCard id="naked-ui" heading="h1" />
  </main>;
}
