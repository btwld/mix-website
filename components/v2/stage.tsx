'use client';

import { useEffect, useRef, useState } from 'react';

const BASE = '/v2-flutter';

type Patch = Record<string, unknown>;

declare global {
  interface Window {
    __mixShowcase?: { apply(json: string): void };
    __mixShowcaseReady?: () => void;
    __mixShowcaseEvent?: (json: string) => void;
    __mixShowcaseHost?: HTMLElement;
  }
}

/** One Flutter app in one view. Every chapter talks to this same instance. */
export function useShowcase(onEvent: (event: Patch) => void) {
  const [ready, setReady] = useState(false);
  const [missing, setMissing] = useState(false);
  const eventRef = useRef(onEvent);
  eventRef.current = onEvent;

  const mount = (host: HTMLElement) => {
    window.__mixShowcaseReady = () => setReady(true);
    window.__mixShowcaseEvent = json => eventRef.current(JSON.parse(json));
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
    script.onload = () => window._flutter?.loader.load({
      config: { entrypointBaseUrl: `${BASE}/`, canvasKitBaseUrl: `${BASE}/canvaskit/` },
      onEntrypointLoaded: async initializer => {
        const engine = await initializer.initializeEngine({ hostElement: host, assetBase: `${BASE}/` });
        await engine.runApp();
      },
    });
    document.body.appendChild(script);
  };

  const send = (patch: Patch) => window.__mixShowcase?.apply(JSON.stringify(patch));
  return { ready, missing, mount, send };
}

export function Stage({ mount, ready, missing }: { mount: (host: HTMLElement) => void; ready: boolean; missing: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => { if (host.current) mount(host.current); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return <div className="v2-stage" data-ready={ready} role="region" aria-label="Live Launchpad example, a Flutter app running in this page">
    <div className="v2-host" ref={host} />
    {missing && <p className="v2-missing">The live Flutter app is not published to this environment yet.</p>}
    {/* The real app, captured from this build, holds the place while it starts. */}
    <picture className="v2-poster" aria-hidden="true">
      <source media="(max-width: 62rem)" srcSet={`${BASE}/poster-compact.png`} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`${BASE}/poster-wide.png`} alt="" />
    </picture>
  </div>;
}
