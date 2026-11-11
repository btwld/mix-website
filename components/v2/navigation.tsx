'use client';

import Link from 'next/link';
import { useSearchContext } from 'fumadocs-ui/contexts/search';
import { useEffect, useRef } from 'react';
import { ArrowRight, Search } from '@/components/landing/icons';

const libraries = [
  { name: 'Mix', detail: 'Styling', href: '/mix/docs/' },
  { name: 'Naked UI', detail: 'Behavior', href: '/naked-ui/docs/' },
  { name: 'Remix', detail: 'Components', href: '/remix/docs/' },
];
const sections = [
  { name: 'Mix', href: '/#mix' },
  { name: 'Naked UI', href: '/#naked' },
  { name: 'Remix', href: '/#remix' },
];

/** One header for the page and its source browser. Section links are plain anchors. */
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
      <Link className="v2-brand" href="/" aria-label="Mix home">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/icon_logo.svg" alt="" width={22} height={25} />
        <span>Mix</span>
      </Link>
      <div className="v2-nav-links">
        {sections.map(section => <a key={section.href} href={section.href}>{section.name}</a>)}
      </div>
      <div className="v2-nav-actions">
        <a className="v2-nav-start" href="/#start">Get started</a>
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
