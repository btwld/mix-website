import Link from 'next/link';
import { PROJECTS, type ProjectId } from '@/lib/projects.mjs';
import { sources } from '@/lib/source';

/** A project's summary with links into its published docs pages. */
export function ProjectCard({ id, heading: Heading = 'h2' }: { id: ProjectId; heading?: 'h1' | 'h2' }) {
  const project = PROJECTS[id];
  const pages = sources[id].getPages();
  return <section className={`site-project project-${id}`} aria-labelledby={`project-${id}`}>
    <Heading id={`project-${id}`}>{project.name}</Heading>
    <p>{project.description}</p>
    <ul>
      {Heading === 'h2' && <li><Link href={project.overviewPath}>Overview</Link></li>}
      {pages.map(page => <li key={page.url}><Link href={`${page.url}/`}>{page.data.title}</Link></li>)}
      {id === 'remix' && <li><a href={PROJECTS.remix.catalogPath}>Component catalog</a></li>}
    </ul>
  </section>;
}
