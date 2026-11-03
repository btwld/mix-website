import type { ReactNode } from 'react';
import { ProjectDocsLayout } from '@/lib/docs-layout';

export default function Layout({ children }: { children: ReactNode }) {
  return <ProjectDocsLayout project="mix">
    {children}
  </ProjectDocsLayout>;
}
