import type { ReactNode } from 'react';
import { SITE_NAME } from '@/lib/site';
import { SiteNav } from './site-nav';

/** Landings and the not-found page: floating navigation over one main landmark. */
export function SiteShell({ children }: { children: ReactNode }) {
  return <div className="site-shell">
    <SiteNav title={SITE_NAME} />
    <main className="site-main">{children}</main>
  </div>;
}
