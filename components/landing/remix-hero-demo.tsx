'use client';

import { useId, useState } from 'react';
import { REMIX_HERO_STYLES } from '@/lib/landing-previews.mjs';
import { FlutterMultiView } from '@/components/previews/mix/FlutterMultiView';
import { FlutterSnippet } from '@/components/previews/mix/FlutterSnippet';

type Locked = Record<string, { sourcePath: string; snippetRegion: string | null }>;

/**
 * One RemixButton, three real Mix styles, each a real compiled Flutter app.
 *
 * Only the selected style is mounted. Flutter's multi-view embedding paints
 * every view onto one shared rasterizer surface, so three views stacked at the
 * same position are composited side by side and the visible one is drawn
 * outside its own host. Swapping the view keeps the page-global engine and
 * costs one addView, where overlapping them renders the hero broken.
 *
 * The original kept a copy of each style's Dart in this file with a comment
 * asking the two to be kept in sync. Instead both panes read the preview's own
 * `style` docregion from the locked bundle, so the code shown is the code that
 * was compiled.
 */
export function RemixHeroDemo({ locked }: { locked: Locked }) {
  const id = useId();
  const [active, setActive] = useState(0);
  const current = REMIX_HERO_STYLES[active];

  return <div className="lx-window">
    <div className="lx-window-bar">
      <div className="lx-dots" aria-hidden="true"><span /><span /><span /></div>
      <div className="lx-segmented" role="tablist" aria-label="Button style">
        {REMIX_HERO_STYLES.map((style, index) => <button
          key={style.key}
          type="button"
          role="tab"
          id={`${id}-tab-${style.key}`}
          aria-selected={index === active}
          aria-controls={`${id}-panel`}
          className="lx-seg"
          onClick={() => setActive(index)}
        >{style.name}</button>)}
      </div>
    </div>

    <div className="lx-window-body" id={`${id}-panel`} role="tabpanel" aria-labelledby={`${id}-tab-${current.key}`}>
      <div className="lx-window-code">
        {REMIX_HERO_STYLES.map((style, index) => <div key={style.key} className="lx-code" hidden={index !== active}>
          <FlutterSnippet
            sourcePath={locked[style.previewId].sourcePath}
            region={locked[style.previewId].snippetRegion ?? undefined}
            showMeta={false}
            maxHeight={260}
            surfaceClassName=""
            codeClassName="lx-code-pad"
            loadingClassName="lx-code-pad"
            errorClassName="lx-code-pad"
          />
        </div>)}
      </div>

      <div className={`lx-live lx-live-${current.key}`}>
        <span className="lx-live-label">Live render · Flutter</span>
        <div className="lx-live-stack">
          <FlutterMultiView key={current.previewId} previewId={current.previewId} height={140} bordered={false} transparent lazyLoad={false} />
        </div>
      </div>
    </div>
  </div>;
}
