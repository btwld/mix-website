'use client';

import { useEffect, useRef, useState } from 'react';
import { sourceRanges } from '@/lib/showcase-lines';

export type SourceFile = { id: string; path: string; description: string; raw: string; html: string };

/** All files are supplied at build time, including on static preview hosts. */
export function SourceBrowser({ files, github, pinned }: { files: SourceFile[]; github: string; pinned: boolean }) {
  const [selected, setSelected] = useState(files[0].id);
  const [hash, setHash] = useState('');
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const pendingCopy = useRef(0);
  const viewer = useRef<HTMLDivElement>(null);
  const file = files.find(entry => entry.id === selected) ?? files[0];
  const ranges = sourceRanges(hash, file.raw.split('\n').length);
  const githubHash = pinned && ranges.length ? `#${ranges.map(([start, end]) => `L${start}${end === start ? '' : `-L${end}`}`).join(',')}` : '';

  useEffect(() => {
    const readLocation = () => {
      const requested = new URLSearchParams(location.search).get('file');
      setSelected(files.some(entry => entry.id === requested) ? requested! : files[0].id);
      setHash(location.hash);
      setCopyState('idle');
      pendingCopy.current += 1;
    };
    readLocation();
    addEventListener('popstate', readLocation);
    addEventListener('hashchange', readLocation);
    return () => {
      removeEventListener('popstate', readLocation);
      removeEventListener('hashchange', readLocation);
    };
  }, [files]);

  useEffect(() => {
    const region = viewer.current;
    if (!region) return;
    const ranges = sourceRanges(hash, file.raw.split('\n').length);
    region.querySelectorAll<HTMLElement>('.line').forEach(line => {
      const number = Number(line.dataset.line);
      line.classList.toggle('v2-source-highlight', ranges.some(([start, end]) => number >= start && number <= end));
    });
    const first = ranges.length ? region.querySelector<HTMLElement>(`#L${ranges[0][0]}`) : null;
    if (!first) { region.scrollTop = 0; region.scrollLeft = 0; return; }
    const behavior = matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
    const top = region.scrollTop + first.getBoundingClientRect().top - region.getBoundingClientRect().top - 24;
    region.scrollTo({ top, left: 0, behavior });
    scrollTo({ top: scrollY + region.getBoundingClientRect().top - 112, behavior });
  }, [file, hash]);

  useEffect(() => {
    if (copyState !== 'copied') return;
    const timeout = setTimeout(() => setCopyState('idle'), 2200);
    return () => clearTimeout(timeout);
  }, [copyState]);

  const choose = (id: string) => {
    setSelected(id);
    setHash('');
    setCopyState('idle');
    pendingCopy.current += 1;
    const url = new URL(location.href);
    url.searchParams.set('file', id);
    history.pushState(history.state, '', `${url.pathname}${url.search}`);
  };

  const copy = async () => {
    const request = ++pendingCopy.current;
    try {
      await navigator.clipboard.writeText(file.raw);
      if (request === pendingCopy.current) setCopyState('copied');
    } catch {
      if (request === pendingCopy.current) setCopyState('failed');
    }
  };

  return <section className="v2-source-browser" aria-label="Showcase source files">
    <div className="v2-source-toolbar">
      <div className="v2-source-picker">
        <label htmlFor="v2-source-file">Source file</label>
        <select id="v2-source-file" value={file.id} onChange={event => choose(event.target.value)}>
          {files.map(entry => <option value={entry.id} key={entry.id}>{entry.path}</option>)}
        </select>
      </div>
      <button type="button" className="v2-source-copy" onClick={copy} aria-label={`Copy ${file.path}`}>
        {copyState === 'copied' ? 'Copied' : 'Copy file'}
      </button>
    </div>
    <div className="v2-source-file-summary">
      <p>{file.description}</p>
      <span>Complete file · {file.raw.trimEnd().split('\n').length.toLocaleString('en-US')} lines</span>
      <a href={`${github}/${file.path}${githubHash}`}>View on GitHub</a>
    </div>
    <div ref={viewer} className="v2-source-code" tabIndex={0} role="region" aria-label={`${file.path} source code`} dangerouslySetInnerHTML={{ __html: file.html }} />
    <p className="v2-source-copy-status" role="status" aria-live="polite">
      {copyState === 'copied' ? `${file.path} copied.` : copyState === 'failed' ? 'Couldn’t copy. Select the code and copy it manually.' : ''}
    </p>
    <noscript><p className="v2-source-no-script">Enable JavaScript to switch files and copy code.</p></noscript>
  </section>;
}
