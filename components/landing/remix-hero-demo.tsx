'use client';

import { useId, useRef, useState } from 'react';
import { REMIX_HERO_STYLES } from '@/lib/landing-previews.mjs';
import { FlutterMultiView } from '@/components/previews/mix/FlutterMultiView';
import { LockedSnippet, type LockedPreviewSource } from './locked-snippet';
import { WindowBar } from './ui';

type Locked = Record<string, LockedPreviewSource>;

/**
 * One RemixButton, three real Mix styles, each a real compiled Flutter app.
 * Every style mounts once into the page-global engine and cross-fades, so
 * switching is instant and never reloads Flutter.
 *
 * The original kept a copy of each style's Dart in this file with a comment
 * asking the two to be kept in sync. Instead both panes read the preview's own
 * `style` docregion from the locked bundle, so the code shown is the code that
 * was compiled.
 */
export function RemixHeroDemo({ locked, previewsBase, sourcesBase }: { locked: Locked; previewsBase: string; sourcesBase: string }) {
  const id = useId();
  const [active, setActive] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const current = REMIX_HERO_STYLES[active];

  // Tabs are a single stop in the page tab order; arrows move between them.
  const onKeyDown = (event: React.KeyboardEvent) => {
    const last = REMIX_HERO_STYLES.length - 1;
    const next = { ArrowLeft: active === 0 ? last : active - 1, ArrowRight: active === last ? 0 : active + 1, Home: 0, End: last }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    setActive(next);
    tabs.current[next]?.focus();
  };

  return <div className="lx-window">
    <WindowBar>
      <div className="lx-segmented" role="tablist" aria-label="Button style" onKeyDown={onKeyDown}>
        {REMIX_HERO_STYLES.map((style, index) => <button
          key={style.key}
          ref={element => { tabs.current[index] = element; }}
          type="button"
          role="tab"
          id={`${id}-tab-${style.key}`}
          aria-selected={index === active}
          aria-controls={`${id}-panel`}
          tabIndex={index === active ? 0 : -1}
          className="lx-seg"
          onClick={() => setActive(index)}
        >{style.name}</button>)}
      </div>
    </WindowBar>

    <div className="lx-window-body" id={`${id}-panel`} role="tabpanel" aria-labelledby={`${id}-tab-${current.key}`}>
      <div className="lx-window-code">
        {REMIX_HERO_STYLES.map((style, index) => <div key={style.key} className="lx-code" hidden={index !== active}>
          <LockedSnippet source={locked[style.previewId]} basePath={sourcesBase} maxHeight={260} />
        </div>)}
      </div>

      <div className={`lx-live lx-live-${current.key}`}>
        <span className="lx-live-label">Live render · Flutter</span>
        <div className="lx-live-stack">
          {/* Flutter's view host is tabbable, and neither aria-hidden nor a
              zero opacity takes it out of the tab order: Tab would walk into
              the two styles the reader cannot see. `inert` removes the whole
              subtree from focus and the accessibility tree while the layer
              stays mounted, so the cross-fade is unaffected. */}
          {REMIX_HERO_STYLES.map((style, index) => <div
            key={style.key}
            className="lx-live-layer"
            data-active={index === active}
            aria-hidden={index !== active}
            inert={index !== active}
          >
            <FlutterMultiView previewId={style.previewId} basePath={previewsBase} height={140} bordered={false} transparent lazyLoad={false} />
          </div>)}
        </div>
      </div>
    </div>
  </div>;
}
