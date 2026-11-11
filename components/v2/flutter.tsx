'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { acceptMixBundle } from '@/components/previews/mix/bundle-identity.mjs';

const BASE = '/v2-flutter';

type Message = Record<string, unknown>;
export type ShowcaseEvent = { demo: string; type: string; value: unknown };
type Listener = (event: ShowcaseEvent) => void;
type App = { addView(options: { hostElement: HTMLElement; initialData: { demo: string } }): number; removeView(id: number): void };

/**
 * The page shows eight examples but keeps only a few Flutter views. Each view
 * is created once and then pointed at whichever example is nearest the reader,
 * and its element moves into that example's place.
 *
 * Two engine behaviors make this the reliable shape. A browser keeps a limited
 * number of WebGL contexts, and the engine never releases a removed view's, so
 * views cannot be created and destroyed as the reader scrolls. And where the
 * engine draws every view through one shared surface, all views take the size
 * of the newest one, so every view here is the same size and each place shows
 * the part of it that it needs (see `.v2-view-canvas`).
 */
const POOL = 4;
type Slot = { element: HTMLElement; demo: string; setMounted(mounted: boolean): void };
type Pooled = { id: number; element: HTMLDivElement; slot: Slot | null };
type Engine = { app: App; pool: Pooled[] };

// The engine survives client-side navigation, so its reported values must too.
// A remounted page subscribes again without asking Flutter to change selection.
const latestEvents = new Map<string, Map<string, ShowcaseEvent>>();

declare global {
  interface Window {
    /** Set before the bundle loads; the app reads it to know it is embedded. */
    __mixShowcaseHost?: { onReady(): void; onEvent(json: string): void };
    /** Set by the app once it can take messages. */
    __mixShowcase?: { apply(json: string): void };
    /** The engine and its views outlive the page component, so a return visit reuses them. */
    __mixShowcaseEngine?: Promise<Engine>;
  }
}

function startEngine(): Promise<Engine> {
  window.__mixShowcaseEngine ??= new Promise<Engine>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `${BASE}/flutter_bootstrap.js`;
    script.onerror = () => reject(new Error('The Flutter bundle is missing.'));
    script.onload = () => {
      const loader = window._flutter?.loader;
      if (!loader) return reject(new Error('The Flutter loader did not start.'));
      Promise.resolve(loader.load({
        config: { entrypointBaseUrl: `${BASE}/`, canvasKitBaseUrl: `${BASE}/canvaskit/` },
        onEntrypointLoaded: async initializer => {
          try {
            const engine = await initializer.initializeEngine({ multiViewEnabled: true, assetBase: `${BASE}/` });
            resolve({ app: await engine.runApp() as unknown as App, pool: [] });
          } catch (error) { reject(error); }
        },
      })).catch(reject);
    };
    document.body.appendChild(script);
  });
  return window.__mixShowcaseEngine;
}

const ShowcaseContext = createContext<{
  status: 'loading' | 'ready' | 'failed';
  /** Whether the app has announced that it accepts messages. */
  connected: boolean;
  send(message: Message): void;
  subscribe(demo: string, listener: Listener): () => void;
  register(slot: Slot): () => void;
  /** Places the views again, after the page shows or hides an example. */
  refresh(): void;
} | null>(null);

export function useShowcase() {
  const context = useContext(ShowcaseContext);
  if (!context) throw new Error('useShowcase needs a ShowcaseProvider');
  return context;
}

/** Owns the engine, its views, and the two-way channel between the page and the app. */
export function ShowcaseProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'failed'>('loading');
  const [connected, setConnected] = useState(false);
  const engine = useRef<Engine | null>(null);
  const listeners = useRef(new Map<string, Set<Listener>>());
  const slots = useRef(new Set<Slot>());
  const frame = useRef(0);
  // Messages sent before the app connects are replayed in order once it does.
  const pending = useRef<Message[]>([]);

  const send = useCallback((message: Message) => {
    if (window.__mixShowcase) window.__mixShowcase.apply(JSON.stringify(message));
    else pending.current.push(message);
  }, []);

  /** Points a view at a place. It stays hidden until the app has drawn the new example. */
  const point = useCallback((view: Pooled, slot: Slot) => {
    view.slot?.setMounted(false);
    view.slot = slot;
    view.element.style.visibility = 'hidden';
    slot.element.appendChild(view.element);
    send({ assign: { view: view.id, demo: slot.demo } });
  }, [send]);

  /** Gives the views to the places nearest the middle of the screen. */
  const arrange = useCallback(() => {
    frame.current = 0;
    const current = engine.current;
    if (!current) return;
    const middle = innerHeight / 2;
    const ranked = [...slots.current].map(slot => {
      const { top, bottom, height } = slot.element.getBoundingClientRect();
      return { slot, hidden: height === 0, distance: top > middle ? top - middle : bottom < middle ? middle - bottom : 0 };
    }).filter(item => !item.hidden).sort((a, b) => a.distance - b.distance);
    const wanted = ranked.slice(0, POOL).filter(item => item.distance < innerHeight * 1.5).map(item => item.slot);
    for (const slot of wanted) {
      if (current.pool.some(view => view.slot === slot)) continue;
      // Prefer an idle view, then a new one, then the one farthest from the reader.
      let view = current.pool.find(item => !item.slot || !slots.current.has(item.slot));
      if (!view && current.pool.length < POOL) {
        const element = document.createElement('div');
        element.className = 'v2-view-canvas';
        slot.element.appendChild(element);
        view = { id: current.app.addView({ hostElement: element, initialData: { demo: slot.demo } }), element, slot: null };
        current.pool.push(view);
      }
      view ??= current.pool.filter(item => !wanted.includes(item.slot!)).sort((a, b) =>
        ranked.findIndex(item => item.slot === b.slot) - ranked.findIndex(item => item.slot === a.slot))[0];
      if (view) point(view, slot);
    }
  }, [point]);
  const schedule = useCallback(() => { frame.current ||= requestAnimationFrame(arrange); }, [arrange]);

  useEffect(() => {
    // One page holds one Flutter bundle. The docs previews use another, so
    // arriving from them client-side reloads into a clean page.
    if (!acceptMixBundle(window, BASE)) return;
    let live = true;
    window.__mixShowcaseHost = {
      onReady: () => {
        if (!live) return;
        for (const message of pending.current.splice(0)) window.__mixShowcase?.apply(JSON.stringify(message));
        setConnected(true);
      },
      onEvent: json => {
        const event = JSON.parse(json) as ShowcaseEvent;
        if (event.type === 'assigned') {
          const view = engine.current?.pool.find(item => item.id === event.value);
          if (view?.slot?.demo === event.demo) { view.element.style.visibility = ''; view.slot.setMounted(true); }
          return;
        }
        const events = latestEvents.get(event.demo) ?? new Map<string, ShowcaseEvent>();
        events.set(event.type, event);
        latestEvents.set(event.demo, events);
        listeners.current.get(event.demo)?.forEach(listener => listener(event));
      },
    };
    const timeout = setTimeout(() => { if (live) setStatus(current => current === 'loading' ? 'failed' : current); }, 30000);
    startEngine().then(
      started => {
        if (!live) return;
        engine.current = started;
        // Views from an earlier visit are idle until they are pointed somewhere again.
        started.pool.forEach(view => { view.slot = null; });
        if (window.__mixShowcase) window.__mixShowcaseHost?.onReady();
        setStatus('ready');
        schedule();
      },
      () => { if (live) setStatus('failed'); },
    );
    addEventListener('scroll', schedule, { passive: true });
    addEventListener('resize', schedule);
    return () => {
      live = false;
      clearTimeout(timeout);
      removeEventListener('scroll', schedule);
      removeEventListener('resize', schedule);
      cancelAnimationFrame(frame.current);
      frame.current = 0;
      // Keep the views, off the page, for the next visit.
      engine.current?.pool.forEach(view => { view.slot = null; view.element.remove(); });
    };
  }, [schedule]);

  const subscribe = useCallback((demo: string, listener: Listener) => {
    const set = listeners.current.get(demo) ?? new Set<Listener>();
    listeners.current.set(demo, set);
    set.add(listener);
    latestEvents.get(demo)?.forEach(listener);
    return () => { set.delete(listener); };
  }, []);

  const register = useCallback((slot: Slot) => {
    slots.current.add(slot);
    schedule();
    return () => {
      slots.current.delete(slot);
      const view = engine.current?.pool.find(item => item.slot === slot);
      if (view) { view.slot = null; view.element.remove(); }
      schedule();
    };
  }, [schedule]);

  const value = useMemo(() => ({ status, connected, send, subscribe, register, refresh: schedule }), [status, connected, send, subscribe, register, schedule]);
  return <ShowcaseContext.Provider value={value}>{children}</ShowcaseContext.Provider>;
}

/** Sends a demo's control values whenever they change, and once on connect. */
export function useDemoControls(demo: string, values: Record<string, unknown>) {
  const { send, connected } = useShowcase();
  const json = JSON.stringify(values);
  useEffect(() => { send({ demo, set: JSON.parse(json) }); }, [demo, json, send, connected]);
}

/** Calls `handler` for each event of one type from one demo. */
export function useDemoListener<T>(demo: string, type: string, handler: (value: T) => void) {
  const { subscribe } = useShowcase();
  const latest = useRef(handler);
  useEffect(() => { latest.current = handler; });
  useEffect(() => subscribe(demo, event => { if (event.type === type) latest.current(event.value as T); }), [demo, type, subscribe]);
}

/** The latest value of one event type from one demo. */
export function useDemoEvent<T>(demo: string, type: string, initial: T): T {
  const [value, setValue] = useState(initial);
  useDemoListener<T>(demo, type, setValue);
  return value;
}

/**
 * The place for one live example. A Flutter view moves in while this is among
 * the places nearest the reader. The app keeps each example's values, so an
 * example that scrolls away and back resumes with them.
 */
export function FlutterView({ demo, label, className }: { demo: string; label: string; className?: string }) {
  const { status, register } = useShowcase();
  const place = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const element = place.current;
    if (!element) return;
    return register({ element, demo, setMounted });
  }, [register, demo]);

  return <div className={`v2-view${className ? ` ${className}` : ''}`} data-demo={demo} data-state={status === 'failed' ? 'failed' : mounted ? 'ready' : 'loading'}>
    <div className="v2-view-host" ref={place} role="application" aria-label={label} />
    {status === 'failed' && <div className="v2-view-status" role="status">
      <strong>The live example didn’t load.</strong>
      <span>The code shown with it is still the code it runs.</span>
      <button type="button" onClick={() => location.reload()}>Try again</button>
    </div>}
    {status !== 'failed' && !mounted && <div className="v2-view-status" aria-hidden="true"><i /></div>}
    <noscript><div className="v2-view-status v2-view-noscript">The live example needs JavaScript. The code shown with it is the code it runs.</div></noscript>
  </div>;
}
