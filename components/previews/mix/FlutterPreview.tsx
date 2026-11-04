"use client";

import React, { useEffect, useState } from "react";

import { FlutterMultiView } from "./FlutterMultiView";
import { FlutterSnippet } from "./FlutterSnippet";
import {
  type PreviewManifestEntry,
  findPreviewManifestEntry,
} from "./flutter/preview-manifest";
import { MIX_PREVIEWS_BASE, MIX_SOURCES_BASE } from "./bundle";
import { acceptMixBundle } from './bundle-identity.mjs';

type PreviewMode = "preview" | "code" | "both";
type ManifestResolution =
  | { request: string; state: "loading" }
  | { request: string; state: "ready"; entry: PreviewManifestEntry }
  | { request: string; state: "error"; error: string };

interface FlutterPreviewProps {
  /** Preview ID registered in PreviewRegistry */
  previewId: string;
  /** Initial mode shown */
  defaultMode?: PreviewMode;
  /** Flutter preview height */
  height?: number;
  /** Maximum code block height */
  codeMaxHeight?: number;
  /** Preview bundle base path */
  basePath?: string;
  /** Source bundle base path */
  sourceBasePath?: string;
  /** Show border around preview */
  bordered?: boolean;
  /** Fallback to full file when region does not exist */
  fallbackToFullFile?: boolean;
}

export function FlutterPreview({
  previewId,
  defaultMode = "preview",
  height = 360,
  codeMaxHeight = 420,
  basePath = MIX_PREVIEWS_BASE,
  sourceBasePath = MIX_SOURCES_BASE,
  bordered = true,
  fallbackToFullFile = true,
}: FlutterPreviewProps) {
  const request = JSON.stringify([previewId, basePath, sourceBasePath]);
  const [resolved, setResolved] = useState<ManifestResolution>({ request, state: "loading" });
  // Hide the previous entry during render, before any child passive effect can
  // pair it with new props. Resolution and its request identity stay atomic.
  const current = resolved.request === request ? resolved : null;
  const entry = current?.state === "ready" ? current.entry : null;
  const [sourceOpen, setSourceOpen] = useState(false);
  const showPreview = defaultMode === "preview" || defaultMode === "both";
  const showCode = defaultMode === "code" || defaultMode === "both";

  useEffect(() => {
    let isMounted = true;

    const loadEntry = async () => {
      // A retained engine must never be paired with a new manifest or snippet.
      if (!acceptMixBundle(window, basePath)) return;
      setResolved({ request, state: "loading" });

      try {
        const manifestEntry = await findPreviewManifestEntry(previewId, basePath);
        if (!isMounted) return;

        if (!manifestEntry) {
          throw new Error(`Unknown previewId: ${previewId}`);
        }

        setResolved({ request, state: "ready", entry: manifestEntry });
      } catch (error) {
        if (!isMounted) return;
        setResolved({ request, state: "error", error: error instanceof Error ? error.message : "Unknown manifest error" });
      }
    };

    loadEntry();

    return () => {
      isMounted = false;
    };
  }, [basePath, previewId, sourceBasePath, request]);

  return (
    <div
      className="my-8 not-prose"
      data-testid="flutter-preview"
      data-preview-id={previewId}
    >
      {(!current || current.state === "loading") && (
        <div className="rounded-lg border border-white/10 bg-[#1a1a2e] px-4 py-3 text-sm text-zinc-400">
          Resolving preview metadata...
        </div>
      )}

      {current?.state === "error" && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {current.error}
        </div>
      )}

      {entry && (
        <>
          {showPreview && entry.renderable !== false && (
            <FlutterMultiView
              key={`preview-${previewId}`}
              previewId={previewId}
              basePath={basePath}
              height={height}
              bordered={bordered}
              lazyLoad={false}
              className={showCode ? "mb-3" : ""}
            />
          )}

          {showPreview && entry.renderable === false && (
            <div className="mb-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
              This preview is snippet-only and cannot be rendered interactively.
            </div>
          )}

          {showCode && (
            <FlutterSnippet
              sourcePath={entry.sourcePath}
              region={entry.snippetRegion ?? undefined}
              basePath={sourceBasePath}
              maxHeight={codeMaxHeight}
              fallbackToFullFile={fallbackToFullFile}
            />
          )}
          {!showCode && (
            <details className="mt-3" open={sourceOpen} onToggle={event => setSourceOpen(event.currentTarget.open)}>
              <summary className="cursor-pointer py-3 text-sm font-medium">View Dart source</summary>
              {sourceOpen && <FlutterSnippet sourcePath={entry.sourcePath} region={entry.snippetRegion ?? undefined}
                basePath={sourceBasePath} maxHeight={codeMaxHeight} fallbackToFullFile={fallbackToFullFile} />}
            </details>
          )}
        </>
      )}
    </div>
  );
}

export default FlutterPreview;
