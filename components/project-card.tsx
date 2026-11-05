import Link from 'next/link';
import { PROJECTS, type ProjectId } from '@/lib/projects.mjs';

/** A short entry point; the documentation index owns the full page listing. */
export function ProjectCard({ id }: { id: ProjectId }) {
  const project = PROJECTS[id];
  return <section className={`site-project project-${id}`} aria-labelledby={`project-${id}`}>
    <h3 id={`project-${id}`}><span className="lx-project-dot" aria-hidden="true" />{project.name}</h3>
    <p>{project.description}</p>
    <ul>
      <li><Link href={project.overviewPath}>Overview</Link></li>
      <li><Link href={project.startPath}>Get started</Link></li>
      {project.startPath !== `${project.docsBase}/` && <li><Link href={`${project.docsBase}/`}>Documentation</Link></li>}
      {id === 'remix' && <li><a href={PROJECTS.remix.catalogPath}>Component catalog</a></li>}
    </ul>
  </section>;
}
