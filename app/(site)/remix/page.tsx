import type { Metadata } from 'next';
import { LegacyCatalogRedirect } from '@/components/legacy-catalog-redirect';
import { ProjectCard } from '@/components/project-card';
import { PROJECTS } from '@/lib/projects.mjs';

export const metadata: Metadata = { title: 'Remix', description: PROJECTS['remix'].description, alternates: { canonical: PROJECTS['remix'].overviewPath } };

export default function Overview() {
  return <main className="site-home">
    <LegacyCatalogRedirect />
    <ProjectCard id="remix" heading="h1" />
  </main>;
}
