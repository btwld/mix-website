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
    <figcaption><span>{entry.runnable ? 'Runnable example from ' : 'App excerpt from '}{entry.parts.map((part, index) => <span key={`${part.file}:${part.start}`}>
      {index > 0 && ' · '}<Link href={`/v2/source/?file=${part.file}#L${part.start}-L${part.end}`}>{part.file}, lines {part.start}–{part.end}</Link>
    </span>)}</span><button type="button" aria-label="Copy Dart excerpt" onClick={async () => {
      try { await navigator.clipboard.writeText(entry.raw); setStatus('copied'); }
      catch { setStatus('error'); }
    }}>{status === 'copied' ? <Check /> : <Copy />}</button></figcaption>
    {/* Long lines scroll sideways, so the excerpt must take keyboard focus. */}
    <div tabIndex={0} role="region" aria-label="Dart excerpt" dangerouslySetInnerHTML={{ __html: entry.html }} />
    <p className="v2-code-uses">{entry.runnable ? 'Complete file, including imports and main(). ' : 'Part of the showcase, not a standalone file. '}Uses {entry.uses.length ? entry.uses.map((group, index) => <span key={group.file}>
      {index > 0 && ' · '}{group.definitions.map((definition, index) => <span key={definition.name}>
        {index > 0 && ', '}<Link href={`/v2/source/?file=${definition.file}#L${definition.line}`}><code>{definition.name}</code></Link>
      </span>)} from {group.file}
    </span>) : 'no other showcase declarations.'}</p>
    <span className="v2-copy-status" role="status">{status === 'copied' ? 'Copied.' : status === 'error' ? 'Select the code to copy it.' : ''}</span>
  </figure>;
}

/** The tour can fold code away; the feature browser always keeps it visible. */
export function CodeExample({ entry, collapsible = false }: { entry: ShowcaseCode[string]; collapsible?: boolean }) {
  const excerpt = <Excerpt key={entry.raw} entry={entry} />;
  return collapsible ? <details className="v2-code">
    <summary>See the Dart <span aria-hidden="true">+</span></summary>
    {excerpt}
  </details> : <div className="v2-code v2-code-expanded">{excerpt}</div>;
}
