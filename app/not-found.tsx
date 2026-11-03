import Link from 'next/link';
import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { SearchButton } from '@/components/search-button';
import { siteLayoutOptions } from '@/lib/layout';
import { PROJECTS, PROJECT_IDS } from '@/lib/projects.mjs';

export default function NotFound() {
  return <HomeLayout {...siteLayoutOptions()}>
    <main className="site-home">
      <h1>Page not found</h1>
      <p>We couldn’t find a page at this address. Search the documentation, or start from a project overview.</p>
      <div className="mt-6"><SearchButton /></div>
      <ul className="mt-6 grid gap-2">
        {PROJECT_IDS.map(id => <li key={id}><Link className="underline underline-offset-4" href={PROJECTS[id].overviewPath}>{PROJECTS[id].name}</Link></li>)}
      </ul>
    </main>
  </HomeLayout>;
}
