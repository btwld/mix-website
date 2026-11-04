import { loader } from 'fumadocs-core/source';
import { pageSchema } from 'fumadocs-core/source/schema';
import { applyMdxPreset } from 'fumadocs-mdx/config';
import { defineDocs } from 'fumadocs-mdx/macro';
import { z } from 'zod';
import type { ProjectId } from './projects.mjs';
import { remarkProjectLinks } from './remark-project-links.mjs';

const schema = pageSchema.extend({ keywords: z.array(z.string()).default([]) });
// Carried from btwld/remix: the Primer defaults clear AA on Concepta's card
// surfaces, where GitHub's legacy themes do not.
const rehypeCodeOptions = { themes: { light: 'github-light-default', dark: 'github-dark-default' } } as const;

// Mix MDX is authored here with final URLs.
const mixDocs = defineDocs({
  dir: 'content/mix',
  docs: { files: ['**/*.mdx'], schema, postprocess: { includeProcessedMarkdown: true }, mdxOptions: applyMdxPreset({ rehypeCodeOptions, remarkPlugins: plugins => [[remarkProjectLinks, { project: 'mix' }], ...plugins] }) },
  meta: { files: ['**/meta.json'] },
});
const nakedUiDocs = defineDocs({
  dir: '.generated/content/naked-ui',
  docs: { files: ['**/*.mdx'], schema, postprocess: { includeProcessedMarkdown: true }, mdxOptions: applyMdxPreset({ rehypeCodeOptions, remarkPlugins: plugins => [[remarkProjectLinks, { project: 'naked-ui' }], ...plugins] }) },
  meta: { files: ['**/meta.json'] },
});
// Remix MDX comes from the pinned btwld/remix snapshot, staged by the prebuild.
const remixDocs = defineDocs({
  dir: '.generated/content/remix',
  docs: {
    files: ['**/*.mdx'],
    schema,
    postprocess: { includeProcessedMarkdown: true },
    mdxOptions: applyMdxPreset({ rehypeCodeOptions, remarkPlugins: plugins => [[remarkProjectLinks, { project: 'remix' }], ...plugins] }),
  },
  meta: { files: ['**/meta.json'] },
});

export const sources = {
  mix: loader({ baseUrl: '/mix/docs', source: mixDocs.toFumadocsSource() }),
  remix: loader({ baseUrl: '/remix/docs', source: remixDocs.toFumadocsSource() }),
  'naked-ui': loader({ baseUrl: '/naked-ui/docs', source: nakedUiDocs.toFumadocsSource() }),
} satisfies Record<ProjectId, unknown>;
