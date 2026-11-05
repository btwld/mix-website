import { REMIX_BENTO } from '@/lib/landing-previews.mjs';
import { FlutterMultiView } from '@/components/previews/mix/FlutterMultiView';

/**
 * Real, running Flutter components — never a screenshot. Flutter multi-views
 * share one fixed rasterizer surface, so each live view is capped to a centred
 * box that fits while the tile keeps its own height around it.
 */
export function RemixBento() {
  return <div className="lx-bento lx-reveal">
    {REMIX_BENTO.map(tile => <div key={tile.previewId} className={`lx-tile${tile.span === 2 ? ' lx-tile-wide' : ''}`}>
      <div className="lx-tile-stage" style={{ height: tile.height }}>
        <div className="lx-tile-view">
          <FlutterMultiView previewId={tile.previewId} height={Math.min(tile.height, 200)} bordered={false} transparent lazyLoad />
        </div>
      </div>
      <p className="lx-tile-cap">{tile.label}</p>
    </div>)}
  </div>;
}
