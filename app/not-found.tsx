import Link from 'next/link';
import { SearchButton } from '@/components/search-button';
import { SiteShell } from '@/components/site-shell';
import { PROJECTS, PROJECT_IDS } from '@/lib/projects.mjs';

export default function NotFound() {
  return <SiteShell>
    <div className="site-home">
      <h1>Page not found</h1>
      <p>We couldn’t find a page at this address. Search the documentation, or start from a project overview.</p>
      <div className="mt-6"><SearchButton /></div>
      <ul className="mt-6 grid gap-2">
        {PROJECT_IDS.map(id => <li key={id}><Link className="underline underline-offset-4" href={PROJECTS[id].overviewPath}>{PROJECTS[id].name}</Link></li>)}
      </ul>
    </div>
  </SiteShell>;
}
