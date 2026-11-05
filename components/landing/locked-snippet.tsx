import { FlutterSnippet } from '@/components/previews/mix/FlutterSnippet';

export type LockedPreviewSource = { sourcePath: string; snippetRegion: string | null };

/** Shared presentation for source fetched from the compiled preview's bundle. */
export function LockedSnippet({ source, basePath, maxHeight }: { source: LockedPreviewSource; basePath: string; maxHeight: number }) {
  return <FlutterSnippet
    sourcePath={source.sourcePath}
    basePath={basePath}
    region={source.snippetRegion ?? undefined}
    showMeta={false}
    maxHeight={maxHeight}
    surfaceClassName=""
    codeClassName="lx-code-pad"
    loadingClassName="lx-code-pad"
    errorClassName="lx-code-pad"
  />;
}
