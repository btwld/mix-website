'use client';

import Link from 'next/link';
import { useSearchContext } from 'fumadocs-ui/contexts/search';
import { useEffect, useRef } from 'react';
import { ArrowRight, Search } from '@/components/landing/icons';

const libraries = [
  { name: 'Mix', detail: 'Styles and themes', href: '/mix/docs/' },
  { name: 'Remix', detail: 'Components and open code', href: '/remix/docs/' },
  { name: 'Naked UI', detail: 'Interaction primitives', href: '/naked-ui/docs/' },
];

/** The showcase has one navigation hierarchy, separate from its live controls. */
export function ShowcaseNavigation() {
  const docs = useRef<HTMLDetailsElement>(null);
  const { setOpenSearch } = useSearchContext();

  useEffect(() => {
    const outside = (event: PointerEvent) => {
      if (docs.current?.open && !docs.current.contains(event.target as Node)) docs.current.open = false;
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && docs.current?.open) {
        docs.current.open = false;
        docs.current.querySelector('summary')?.focus();
      }
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', escape);
    };
  }, []);

  return <header className="v2-nav">
    <a className="v2-skip" href="#v2-content">Skip to content</a>
    <nav className="v2-nav-inner" aria-label="Main">
      <Link className="v2-brand" href="/v2/" aria-label="Mix showcase home">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/icon_logo.svg" alt="" width={24} height={27} />
        <span>Mix</span>
      </Link>
      <div className="v2-nav-links">
        <Link href="/v2/">Showcase</Link>
        {/* Native fragments keep working after the tour updates its reading position. */}
        <a href="/v2/#v2-features" aria-label="Features & code">Features<span className="v2-nav-code-label">&nbsp;&amp; code</span></a>
        <a className="v2-nav-libraries" href="/v2/#v2-start">Libraries</a>
      </div>
      <div className="v2-nav-actions">
        <details className="v2-docs-menu" ref={docs}>
          <summary aria-label="Documentation">Docs <span aria-hidden="true">⌄</span></summary>
          <div className="v2-docs-panel">
            {libraries.map(library => <Link key={library.name} href={library.href} onClick={() => { if (docs.current) docs.current.open = false; }}>
              <span><strong>{library.name}</strong><small>{library.detail}</small></span><ArrowRight />
            </Link>)}
          </div>
        </details>
        <button className="v2-search" type="button" aria-label="Search documentation" aria-haspopup="dialog" onClick={() => {
          if (docs.current) docs.current.open = false;
          setOpenSearch(true);
        }}><Search /></button>
      </div>
    </nav>
  </header>;
}
