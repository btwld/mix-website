'use client';

import { useEffect, useRef, useState } from 'react';
import { Pause, Play } from './icons';

/**
 * The restored hero backdrop: the pinned Concepta motion plate under a scrim,
 * with the topographic grid over it. Provenance for both files is recorded in
 * `public/assets/SOURCES.json`.
 *
 * Readers who ask for reduced motion get the poster frame only, and everyone
 * can pause. The poster carries the whole image, so the video is decoration.
 */
export function HeroMedia() {
  const video = useRef<HTMLVideoElement>(null);
  // Rendered only once the client knows whether motion is wanted, so a
  // reduced-motion reader never downloads or briefly sees the video.
  const [motion, setMotion] = useState(false);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setMotion(!query.matches);
    sync();
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);

  const toggle = async () => {
    const element = video.current;
    if (!element) return;
    if (element.paused) {
      try { await element.play(); } catch { setPlaying(false); }
    } else {
      element.pause();
    }
  };

  return <>
    <div className="lx-band-media" aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/assets/concepta-hero-poster.jpg" alt="" width={1280} height={720} />
      {motion && <video ref={video} autoPlay loop muted playsInline preload="metadata"
        poster="/assets/concepta-hero-poster.jpg" tabIndex={-1}
        onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}>
        <source src="/assets/concepta-hero.mp4" type="video/mp4" />
      </video>}
      <div className="lx-band-scrim" />
      <div className="lx-band-grid" />
    </div>
    {motion && <button type="button" className="lx-motion-toggle" onClick={toggle}
      aria-pressed={playing} aria-label="Background motion">
      {playing ? <Pause /> : <Play />}
    </button>}
  </>;
}
