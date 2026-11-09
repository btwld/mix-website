'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { acceptMixBundle } from '@/components/previews/mix/bundle-identity.mjs';

const BASE = '/v2-flutter';

type Patch = Record<string, unknown>;

declare global {
  interface Window {
    __mixShowcase?: { apply(json: string): void };
    __mixShowcaseReady?: () => void;
    __mixShowcaseHost?: HTMLElement;
  }
}

/** One Flutter app in one view. Every chapter talks to this same instance. */
export function useShowcase() {
  const [ready, setReady] = useState(false);
  const [missing, setMissing] = useState(false);

  const mount = (host: HTMLElement) => {
    // One page can only hold one Flutter bundle. The docs previews use a different
    // one, so moving between them client-side reloads into a clean page.
    if (!acceptMixBundle(window, BASE)) return;
    window.__mixShowcaseReady = () => { setReady(true); setMissing(false); };
    if (window.__mixShowcaseHost) {
      // The engine belongs to its first host; a client-side return needs a new one.
      if (window.__mixShowcaseHost !== host) location.reload();
      return;
    }
    window.__mixShowcaseHost = host;
    const script = document.createElement('script');
    script.src = `${BASE}/flutter_bootstrap.js`;
    // The bundle is a local build until it has its own published site input.
    script.onerror = () => setMissing(true);
    script.onload = () => {
      if (!window._flutter) { setMissing(true); return; }
      Promise.resolve(window._flutter.loader.load({
      config: { entrypointBaseUrl: `${BASE}/`, canvasKitBaseUrl: `${BASE}/canvaskit/` },
      onEntrypointLoaded: async initializer => {
        try {
          const engine = await initializer.initializeEngine({ hostElement: host, assetBase: `${BASE}/` });
          await engine.runApp();
        } catch { setMissing(true); }
      },
      })).catch(() => setMissing(true));
    };
    document.body.appendChild(script);
  };

  useEffect(() => {
    if (ready || missing) return;
    const timeout = setTimeout(() => setMissing(true), 30000);
    return () => clearTimeout(timeout);
  }, [ready, missing]);

  const send = (patch: Patch) => window.__mixShowcase?.apply(JSON.stringify(patch));
  return { ready, missing, mount, send };
}

/**
 * `hidden` keeps the running app mounted while a phone reader has moved it out
 * of view; `inert` keeps keyboard focus out of the part they cannot see.
 */
export function Stage({ mount, ready, missing, hidden = false }: { mount: (host: HTMLElement) => void; ready: boolean; missing: boolean; hidden?: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => { if (host.current) mount(host.current); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return <div className="v2-stage" id="v2-stage" data-ready={ready} role="region" aria-label="Live Flutter card showcase" inert={hidden}>
    <div className="v2-host" ref={host} />
    {missing && <div className="v2-missing" role="status">
      <strong>The live preview couldn’t load.</strong>
      <p>You can still explore the showcase source, or try loading the interactive demo again.</p>
      <div className="v2-missing-actions"><Link href="/v2/source/">Explore the source</Link><button type="button" onClick={() => location.reload()}>Try again</button></div>
    </div>}
    {/* Card outlines hold the place while Flutter starts. They need no image
        from the Flutter build, which the site does not produce. */}
    <div className="v2-poster" aria-hidden="true" hidden={missing}>
      {['player', 'spending', 'appearance', 'today', 'team'].map(card => <i key={card} data-card={card} />)}
    </div>
    {!ready && !missing && <p className="v2-loading" role="status">Loading interactive showcase…</p>}
  </div>;
}
