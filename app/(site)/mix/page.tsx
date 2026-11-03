import type { Metadata } from 'next';
import { ProjectCard } from '@/components/project-card';
import { PROJECTS } from '@/lib/projects.mjs';

export const metadata: Metadata = { title: 'Mix', description: PROJECTS['mix'].description, alternates: { canonical: PROJECTS['mix'].overviewPath } };

export default function Overview() {
  return <main className="site-home">
    <ProjectCard id="mix" heading="h1" />
  </main>;
}
