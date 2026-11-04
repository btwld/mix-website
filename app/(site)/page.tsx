import { ProjectCard } from '@/components/project-card';
import type { Metadata } from 'next';
import { SITE_DESCRIPTION, canonicalMetadata } from '@/lib/site';
import { PROJECT_IDS } from '@/lib/projects.mjs';

export const metadata: Metadata = { ...canonicalMetadata('/') };

export default function Home() {
  return <main className="site-home">
    <h1>Build Flutter interfaces with Mix, Remix, and Naked UI</h1>
    <p>{SITE_DESCRIPTION} Each project keeps its own docs; search and navigation span all three.</p>
    <div className="site-projects">
      {PROJECT_IDS.map(id => <ProjectCard key={id} id={id} />)}
    </div>
  </main>;
}
