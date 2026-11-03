import { ProjectCard } from '@/components/project-card';
import { SITE_DESCRIPTION } from '@/lib/site';
import { PROJECT_IDS } from '@/lib/projects.mjs';

export default function Home() {
  return <main className="site-home">
    <h1>Build Flutter interfaces with Mix, Remix, and Naked UI</h1>
    <p>{SITE_DESCRIPTION} Each project keeps its own docs; search and navigation span all three.</p>
    <div className="site-projects">
      {PROJECT_IDS.map(id => <ProjectCard key={id} id={id} />)}
    </div>
  </main>;
}
