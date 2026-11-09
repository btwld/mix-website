'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Check, Copy } from '@/components/landing/icons';
import type { ShowcaseCode } from '@/lib/showcase-source';

function Excerpt({ entry }: { entry: ShowcaseCode[string] }) {
  const [status, setStatus] = useState<'idle' | 'copied' | 'error'>('idle');
  useEffect(() => {
    if (status !== 'copied') return;
    const timer = setTimeout(() => setStatus('idle'), 2000);
    return () => clearTimeout(timer);
  }, [status]);

  return <figure>
    <figcaption><span>App excerpt from {entry.parts.map((part, index) => {
      // Segments of one file read as one list of ranges: tokens.dart, lines 8–9, 270–272.
      const continues = index > 0 && entry.parts[index - 1].file === part.file;
      const lines = part.start === part.end ? `${part.start}` : `${part.start}–${part.end}`;
      return <span key={`${part.file}:${part.start}`}>
        {index > 0 && (continues ? ', ' : ' · ')}<Link href={`/v2/source/?file=${part.file}#L${part.start}-L${part.end}`}>{continues ? lines : `${part.file}, ${part.start === part.end ? 'line' : 'lines'} ${lines}`}</Link>
      </span>;
    })}</span><button type="button" aria-label="Copy Dart excerpt" onClick={async () => {
      try { await navigator.clipboard.writeText(entry.raw); setStatus('copied'); }
      catch { setStatus('error'); }
    }}>{status === 'copied' ? <Check /> : <Copy />}</button></figcaption>
    {/* Long lines scroll sideways, so the excerpt must take keyboard focus. */}
    <div tabIndex={0} role="region" aria-label="Dart excerpt" dangerouslySetInnerHTML={{ __html: entry.html }} />
    <p className="v2-code-uses">Uses {entry.uses.length ? entry.uses.map((group, index) => <span key={group.file}>
      {index > 0 && ' · '}{group.definitions.map((definition, index) => <span key={definition.name}>
        {index > 0 && ', '}<Link href={`/v2/source/?file=${definition.file}#L${definition.line}`}><code>{definition.name}</code></Link>
      </span>)} from {group.file}
    </span>) : 'no other showcase declarations.'}</p>
    <span className="v2-copy-status" role="status">{status === 'copied' ? 'Copied.' : status === 'error' ? 'Select the code to copy it.' : ''}</span>
  </figure>;
}

/** Tour lessons can reveal code on demand or open it from the topic index. */
export function CodeExample({ entry, collapsible = false, initiallyOpen = false, onOpen }: { entry: ShowcaseCode[string]; collapsible?: boolean; initiallyOpen?: boolean; onOpen?: () => void }) {
  const excerpt = <Excerpt key={entry.raw} entry={entry} />;
  return collapsible ? <details className="v2-code" open={initiallyOpen} onToggle={event => { if (event.currentTarget.open) onOpen?.(); }}>
    <summary>See the Dart <span aria-hidden="true">+</span></summary>
    {excerpt}
  </details> : <div className="v2-code v2-code-expanded">{excerpt}</div>;
}
