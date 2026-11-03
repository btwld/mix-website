// The locked Mix preview build (scripts/site-inputs/sync.mjs). Its directory
// is named by the archive digest, so the engine, manifest, and sources a page
// loads always come from one build.
import site from '@/.generated/site-inputs.json';

export const MIX_PREVIEWS_BASE: string = site.mix.previewsBase;
export const MIX_SOURCES_BASE: string = site.mix.sourcesBase;
