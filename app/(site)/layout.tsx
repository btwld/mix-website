import { HomeLayout } from 'fumadocs-ui/layouts/home';
import type { ReactNode } from 'react';
import { siteLayoutOptions } from '@/lib/layout';

export default function SiteLayout({ children }: { children: ReactNode }) {
  return <HomeLayout {...siteLayoutOptions()}>{children}</HomeLayout>;
}
