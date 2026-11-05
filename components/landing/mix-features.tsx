import Link from 'next/link';
import site from '@/.generated/site-inputs.json';
import { MIX_FEATURES } from '@/lib/landing-previews.mjs';
import { FlutterMultiView } from '@/components/previews/mix/FlutterMultiView';
import { ArrowRight } from './icons';
import { LockedSnippet, type LockedPreviewSource } from './locked-snippet';

const LOCKED: Record<string, LockedPreviewSource> = site.mix.landingPreviews;

/**
 * The restored feature showcase: each card pairs the real compiled widget with
 * the exact Dart that produced it. Both halves come from the one digest-pinned
 * Mix bundle, so the snippet can never describe a different build than the
 * widget beside it.
 */
export function MixFeatures({ only }: { only?: readonly string[] }) {
  const features = only ? MIX_FEATURES.filter(feature => only.includes(feature.previewId)) : MIX_FEATURES;
  return <div className={`lx-features lx-reveal${only ? ' lx-features-compact' : ''}`}>
    {features.map(feature => {
      const locked = LOCKED[feature.previewId];
      const wide = feature.span === 2 && !only;
      return <div key={feature.previewId} className={`lx-feature${wide ? ' lx-feature-wide' : ''}`}>
        <div className="lx-feature-body">
          <div className="lx-feature-text">
            <div className="lx-feature-head">
              <h3>{feature.title}</h3>
              <p>{feature.body}</p>
              <Link className="lx-inline-link" href={feature.href}>{feature.linkLabel}<ArrowRight /></Link>
            </div>
            <div className="lx-feature-code">
              <div className="lx-code">
                <LockedSnippet source={locked} basePath={site.mix.sourcesBase} maxHeight={wide ? 280 : 220} />
              </div>
            </div>
          </div>
          <div className="lx-feature-stage">
            <div className="lx-feature-view">
              <FlutterMultiView previewId={feature.previewId} basePath={site.mix.previewsBase} height={200} bordered={false} transparent lazyLoad />
            </div>
          </div>
        </div>
      </div>;
    })}
  </div>;
}
