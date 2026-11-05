import type { ReactNode } from 'react';
import { LegacyCatalogRedirect } from '@/components/legacy-catalog-redirect';
import { ProjectDocsLayout } from '@/lib/docs-layout';

export default function Layout({ children }: { children: ReactNode }) {
  return <ProjectDocsLayout project="remix">
      <LegacyCatalogRedirect />
    {children}
  </ProjectDocsLayout>;
}
