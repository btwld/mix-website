import { getConceptaMDXComponents } from '@concepta/docs-theme/mdx';
import { Steps } from 'fumadocs-ui/components/steps';
import { Callout as FumadocsCallout } from 'fumadocs-ui/components/callout';
import type { MDXComponents } from 'mdx/types';
import type { ComponentProps, ReactNode } from 'react';
import type { ProjectId } from '@/lib/projects.mjs';
import site from '@/.generated/site-inputs.json';
import { FlutterPreview as MixFlutterPreview } from './previews/mix/FlutterPreview';
import { CatalogSearch } from './previews/remix/catalog-search';
import { FlutterPreview as RemixFlutterPreview } from './previews/remix/flutter-preview';

// Existing content uses these names. Fumadocs still owns the code blocks,
// highlighting, copy controls, and callout presentation.
function CodeGroup({ title, children }: { title?: string; defaultLanguage?: string; children: ReactNode }) {
  return <section aria-label={title}>{title ? <p className="font-medium">{title}</p> : null}{children}</section>;
}

// Nextra callout types (Mix content) mapped onto Fumadocs' set.
const CALLOUT_TYPES: Record<string, ComponentProps<typeof FumadocsCallout>['type']> = {
  default: 'info', info: 'info', important: 'info', warning: 'warn', error: 'error',
};
function Callout({ type = 'default', ...props }: Omit<ComponentProps<typeof FumadocsCallout>, 'type'> & { type?: string }) {
  return <FumadocsCallout type={CALLOUT_TYPES[type] ?? 'info'} {...props} />;
}

// Each project keeps its own preview integration under the shared name its
// content already uses: Mix mounts views into one shared Flutter engine;
// Remix embeds its Widgetbook catalog in an iframe.
// Resolve the bundle on the server for each route, rather than relying on a
// retained tab's old client-module default after a new release.
function MixPreview(props: ComponentProps<typeof MixFlutterPreview>) {
  return <MixFlutterPreview {...props} basePath={props.basePath ?? site.mix.previewsBase}
    sourceBasePath={props.sourceBasePath ?? site.mix.sourcesBase} />;
}
const PREVIEW_ADAPTERS = {
  mix: { FlutterPreview: MixPreview },
  remix: { FlutterPreview: RemixFlutterPreview, CatalogSearch },
  'naked-ui': {},
} satisfies Record<ProjectId, MDXComponents>;

export function getMDXComponents(project: ProjectId, overrides?: MDXComponents) {
  return getConceptaMDXComponents({
    CodeGroup,
    Steps,
    Callout,
    Info: ({ children }: { children: ReactNode }) => <FumadocsCallout type="info">{children}</FumadocsCallout>,
    Note: ({ children }: { children: ReactNode }) => <FumadocsCallout type="info">{children}</FumadocsCallout>,
    Warning: ({ children }: { children: ReactNode }) => <FumadocsCallout type="warn">{children}</FumadocsCallout>,
    ...PREVIEW_ADAPTERS[project],
    ...overrides,
  });
}
