import { createSourceUrl } from '@concepta/docs-theme';
import { Card, Cards } from 'fumadocs-ui/components/card';
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from 'fumadocs-ui/layouts/docs/page';
import { createRelativeLink } from 'fumadocs-ui/mdx';
import { slug as headingSlug } from 'github-slugger';
import { flattenTree } from 'fumadocs-core/page-tree';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ContentLink, getMDXComponents } from '@/components/mdx';
import { PROJECTS, type ProjectId } from './projects.mjs';
import { projectConfig, pageMetadata } from './site';
import { sources } from './source';

type Params = { params: Promise<{ slug?: string[] }> };

/** Docs index when the project has no index page yet: its published pages. */
function DocsIndex({ project, slug = [] }: { project: ProjectId; slug?: string[] }) {
  const pages = folderPages(project, slug);
  return <DocsPage>
    <header className="concepta-docs-page-header">
      <DocsTitle>{indexTitle(project, slug)}</DocsTitle>
      <DocsDescription>{PROJECTS[project].description}</DocsDescription>
    </header>
    <DocsBody>
      <Cards>{pages.map(page => <Card key={page.url} href={`${page.url}/`} title={page.data.title} description={page.data.description} />)}</Cards>
    </DocsBody>
  </DocsPage>;
}

function folderPages(project: ProjectId, slug: string[]) {
  const source = sources[project];
  const order = new Map(flattenTree(source.getPageTree().children).map((page, index) => [page.url, index]));
  return source.getPages()
    .filter(page => page.slugs.length > slug.length && slug.every((part, index) => page.slugs[index] === part))
    .sort((a, b) => (order.get(a.url) ?? Infinity) - (order.get(b.url) ?? Infinity));
}
function indexTitle(project: ProjectId, slug: string[]) {
  return slug.length ? slug.at(-1)!.replace(/(^|-)(\w)/g, (_, _separator, letter) => ` ${letter.toUpperCase()}`).trim() : `${PROJECTS[project].name} documentation`;
}

export function createDocsRoute(project: ProjectId) {
  const source = sources[project];
  const config = projectConfig(project);

  async function Page({ params }: Params) {
    const { slug = [] } = await params;
    const page = source.getPage(slug);
    if (!page) {
      if (slug.length === 0 || folderPages(project, slug).length) return <DocsIndex project={project} slug={slug} />;
      notFound();
    }
    const MDX = page.data.body;
    return <DocsPage toc={page.data.toc} full={page.data.full}>
      <header className="concepta-docs-page-header">
        <DocsTitle id={headingSlug(page.data.title)}>{page.data.title}</DocsTitle>
        <DocsDescription>{page.data.description}</DocsDescription>
      </header>
      <DocsBody><MDX components={getMDXComponents(project, { a: createRelativeLink(source, page, ContentLink) })} /></DocsBody>
      <a href={createSourceUrl(config, page.path)} className="concepta-docs-source-link">View page source on GitHub</a>
    </DocsPage>;
  }

  function generateStaticParams() {
    const params = new Map<string, { slug: string[] }>(source.generateParams().map(({ slug }) => [slug.join('/'), { slug }]));
    params.set('', { slug: [] });
    for (const page of source.getPages()) {
      for (let length = 1; length < page.slugs.length; length++) {
        const slug = page.slugs.slice(0, length);
        if (!params.has(slug.join('/'))) params.set(slug.join('/'), { slug });
      }
    }
    return [...params.values()];
  }

  async function generateMetadata({ params }: Params): Promise<Metadata> {
    const { slug = [] } = await params;
    const page = source.getPage(slug);
    if (!page) {
      if (slug.length === 0 || folderPages(project, slug).length) return pageMetadata(project, { title: indexTitle(project, slug), description: PROJECTS[project].description, path: `${PROJECTS[project].docsBase}/${slug.length ? `${slug.join('/')}/` : ''}` });
      notFound();
    }
    return pageMetadata(project, { title: page.data.title, description: page.data.description, path: `${page.url}/` });
  }

  return { Page, generateStaticParams, generateMetadata };
}
