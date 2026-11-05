import { FlutterSnippet } from '@/components/previews/mix/FlutterSnippet';

export type LockedPreviewSource = { sourcePath: string; snippetRegion: string | null };

/** Shared presentation for source fetched from the compiled preview's bundle. */
export function LockedSnippet({ source, maxHeight }: { source: LockedPreviewSource; maxHeight: number }) {
  return <FlutterSnippet
    sourcePath={source.sourcePath}
    region={source.snippetRegion ?? undefined}
    showMeta={false}
    maxHeight={maxHeight}
    surfaceClassName=""
    codeClassName="lx-code-pad"
    loadingClassName="lx-code-pad"
    errorClassName="lx-code-pad"
  />;
}
