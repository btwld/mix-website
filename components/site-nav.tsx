'use client';

import { useSearchContext } from 'fumadocs-ui/contexts/search';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Close, Menu, Search } from '@/components/landing/icons';
import { PROJECTS, PROJECT_IDS } from '@/lib/projects.mjs';

function ProjectLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname() ?? '/';
  const here = pathname.endsWith('/') ? pathname : `${pathname}/`;
  return <ul>
    {PROJECT_IDS.map(id => {
      const href = PROJECTS[id].overviewPath;
      return <li key={id}>
        {/* The project scope supplies the accent of its own active link. */}
        <Link className={`project-${id}`} href={href} onClick={onNavigate}
          data-active={here.startsWith(href) || undefined} aria-current={here === href ? 'page' : undefined}>
          {PROJECTS[id].name}
        </Link>
      </li>;
    })}
  </ul>;
}

/**
 * The compact floating navigation of the original landings, carrying only the
 * actions this site supports: home, the three projects and shared search.
 *
 * The phone menu is a native disclosure, so it still opens without JavaScript.
 */
export function SiteNav({ title }: { title: string }) {
  const { setOpenSearch } = useSearchContext();
  const menu = useRef<HTMLDetailsElement>(null);
  // Known only in the browser. Absent until then, rather than wrong on first paint.
  const [shortcut, setShortcut] = useState<string | null>(null);

  useEffect(() => {
    setShortcut(/Mac|iPhone|iPad/.test(navigator.platform) ? '⌘ K' : 'Ctrl K');
    const onPointerDown = (event: PointerEvent) => {
      if (menu.current?.open && !menu.current.contains(event.target as Node)) menu.current.open = false;
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || !menu.current?.open) return;
      menu.current.open = false;
      menu.current.querySelector('summary')?.focus();
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  return <header className="site-nav">
    <nav className="site-nav-bar" aria-label="Main">
      <Link className="site-nav-brand" href="/">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/icon_logo.svg" alt="" width={95} height={105} />
        {title}
      </Link>
      <div className="site-nav-links"><ProjectLinks /></div>
      <button type="button" className="site-nav-search" aria-label="Search" aria-haspopup="dialog" onClick={() => {
        if (menu.current) menu.current.open = false;
        setOpenSearch(true);
      }}>
        <Search />
        <span className="site-nav-search-label">Search</span>
        {shortcut && <kbd aria-hidden="true">{shortcut}</kbd>}
      </button>
      <details className="site-nav-menu" ref={menu}>
        <summary aria-label="Menu"><Menu /><Close /></summary>
        <div className="site-nav-panel">
          <ProjectLinks onNavigate={() => { if (menu.current) menu.current.open = false; }} />
        </div>
      </details>
    </nav>
  </header>;
}
