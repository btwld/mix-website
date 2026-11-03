import { createPageMetadata, createSourceUrl } from '@concepta/docs-theme';
import { Card, Cards } from 'fumadocs-ui/components/card';
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from 'fumadocs-ui/layouts/docs/page';
import { createRelativeLink } from 'fumadocs-ui/mdx';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getMDXComponents } from '@/components/mdx';
import { PROJECTS, type ProjectId } from './projects.mjs';
import { projectConfig } from './site';
import { sources } from './source';

type Params = { params: Promise<{ slug?: string[] }> };

/** Docs index when the project has no index page yet: its published pages. */
function DocsIndex({ project }: { project: ProjectId }) {
  const pages = sources[project].getPages();
  return <DocsPage>
    <header className="concepta-docs-page-header">
      <DocsTitle>{PROJECTS[project].name} documentation</DocsTitle>
      <DocsDescription>{PROJECTS[project].description}</DocsDescription>
    </header>
    <DocsBody>
      <Cards>{pages.map(page => <Card key={page.url} href={`${page.url}/`} title={page.data.title} description={page.data.description} />)}</Cards>
    </DocsBody>
  </DocsPage>;
}

export function createDocsRoute(project: ProjectId) {
  const source = sources[project];
  const config = projectConfig(project);
  const hasIndex = () => Boolean(source.getPage([]));

  async function Page({ params }: Params) {
    const { slug = [] } = await params;
    const page = source.getPage(slug);
    if (!page) {
      if (slug.length === 0) return <DocsIndex project={project} />;
      notFound();
    }
    const MDX = page.data.body;
    return <DocsPage toc={page.data.toc} full={page.data.full}>
      <header className="concepta-docs-page-header">
        <DocsTitle>{page.data.title}</DocsTitle>
        <DocsDescription>{page.data.description}</DocsDescription>
      </header>
      <DocsBody><MDX components={getMDXComponents(project, { a: createRelativeLink(source, page) })} /></DocsBody>
      <a href={createSourceUrl(config, page.path)} className="concepta-docs-source-link">View page source on GitHub</a>
    </DocsPage>;
  }

  function generateStaticParams() {
    const params = source.generateParams();
    return hasIndex() ? params : [...params, { slug: [] }];
  }

  async function generateMetadata({ params }: Params): Promise<Metadata> {
    const { slug = [] } = await params;
    const page = source.getPage(slug);
    if (!page) {
      if (slug.length === 0) return { title: `${PROJECTS[project].name} documentation`, description: PROJECTS[project].description };
      notFound();
    }
    return createPageMetadata(config, { title: page.data.title, description: page.data.description, path: `${page.url}/` });
  }

  return { Page, generateStaticParams, generateMetadata };
}
