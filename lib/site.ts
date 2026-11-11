import type { Metadata } from 'next';
import { defineDocsConfig, createPageMetadata, type DocsConfig } from '@concepta/docs-theme';
import site from '@/.generated/site-inputs.json';
import { PROJECTS, PROJECT_IDS, type ProjectId } from './projects.mjs';

export const SITE_NAME = 'Flutter Mix';
export const SITE_DESCRIPTION = 'Mix, Remix, and Naked UI: styling, components, and headless widgets for Flutter.';
export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? (process.env.SITE_INDEXING === 'index' ? 'https://fluttermix.com' : 'http://localhost:3000');
/** Only the production backend sets SITE_INDEXING=index; every other build is noindex. */
export const indexing = process.env.SITE_INDEXING === 'index';

const allProjects = PROJECT_IDS.map(id => ({
  id, name: PROJECTS[id].name, description: PROJECTS[id].description, docsUrl: `${PROJECTS[id].docsBase}/`,
}));

/** Source links point at the commit the page was built from where one is pinned. */
function repository(id: ProjectId) {
  const { url, contentPath } = PROJECTS[id].repository;
  const branch = id === 'remix' ? site.inputs['remix-docs'].commit : id === 'naked-ui' ? site.inputs['naked-ui-docs'].commit : site.source.commit ?? process.env.SITE_SOURCE_REF ?? 'main';
  return { url, contentPath, branch };
}

export function projectConfig(id: ProjectId): DocsConfig {
  const project = PROJECTS[id];
  return defineDocsConfig({
    organization: { name: 'Concepta', homeUrl: 'https://concepta.dev' },
    site: { title: SITE_NAME, description: SITE_DESCRIPTION, url: siteUrl, docsPath: project.overviewPath.replace(/\/$/, '') as `/${string}` },
    project: {
      id, name: project.name, description: project.description, docsUrl: `${project.docsBase}/`, repository: repository(id),
      ...(id === 'remix' ? { logo: { light: '/remix/assets/logo_light.png', dark: '/remix/assets/logo_dark.png', width: 108, height: 30 } } : {}),
    },
    projects: allProjects,
    socialLinks: id === 'remix' ? [
      { label: 'Component catalog', url: PROJECTS.remix.catalogPath, placement: 'menu' },
      { label: 'Fortal design system', url: PROJECTS.remix.fortalPath, placement: 'menu' },
    ] : [],
  });
}

/** Nonproduction pages omit canonical/OG URLs instead of publishing a production identity. */
export function pageMetadata(id: ProjectId, input: { title: string; description?: string; path: string }) {
  const metadata = createPageMetadata(projectConfig(id), input);
  if (!indexing) {
    metadata.alternates = undefined;
    if (metadata.openGraph) metadata.openGraph = { ...metadata.openGraph, url: undefined };
  }
  return metadata;
}

/** Landings share the same environment policy as documentation pages. */
export function landingMetadata({ path, title, description }: { path: string; title?: string; description: string }): Metadata {
  const socialTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  return {
    ...(title ? { title } : {}),
    description,
    alternates: indexing ? { canonical: path } : undefined,
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      title: socialTitle,
      description,
      url: indexing ? path : undefined,
    },
    twitter: { card: 'summary', title: socialTitle, description },
  };
}
