import type { ReactNode } from 'react';
import { ShowcaseNavigation } from '@/components/v2/navigation';

/** One server-rendered header for the showcase and its source explorer. */
export default function ShowcaseLayout({ children }: { children: ReactNode }) {
  return <div className="site-shell">
    <ShowcaseNavigation />
    <main className="site-main">{children}</main>
  </div>;
}
