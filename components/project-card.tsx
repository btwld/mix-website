import Link from 'next/link';
import { PROJECTS, type ProjectId } from '@/lib/projects.mjs';

/** A short entry point; the documentation index owns the full page listing. */
export function ProjectCard({ id, heading: Heading = 'h2' }: { id: ProjectId; heading?: 'h1' | 'h2' }) {
  const project = PROJECTS[id];
  return <section className={`site-project project-${id}`} aria-labelledby={`project-${id}`}>
    <Heading id={`project-${id}`}>{project.name}</Heading>
    <p>{project.description}</p>
    <ul>
      {Heading === 'h2' && <li><Link href={project.overviewPath}>Overview</Link></li>}
      <li><Link href={project.startPath}>Get started</Link></li>
      {project.startPath !== `${project.docsBase}/` && <li><Link href={`${project.docsBase}/`}>Documentation</Link></li>}
      {Heading === 'h1' && <li><a href={project.codeRepository}>Source on GitHub</a></li>}
      {id === 'remix' && <li><a href={PROJECTS.remix.catalogPath}>Component catalog</a></li>}
    </ul>
  </section>;
}
