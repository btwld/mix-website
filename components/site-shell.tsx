import type { ReactNode } from 'react';
import { SiteNav } from './site-nav';

/** Landings and the not-found page: floating navigation over one main landmark. */
export function SiteShell({ children }: { children: ReactNode }) {
  return <div className="site-shell">
    <SiteNav title="Mix" />
    <main className="site-main">{children}</main>
  </div>;
}
