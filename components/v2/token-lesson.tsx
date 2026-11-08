'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight } from '@/components/landing/icons';
import type { ShowcaseCode } from '@/lib/showcase-source';
import { CodeExample } from './code-example';

const STEPS = [
  { id: 'declare', name: '1. Declare', instruction: 'Name the design decisions once. These token keys are shared by all four looks.' },
  { id: 'provide', name: '2. Provide', instruction: 'Each look supplies values through MixScope. Choose another look to compare its values.' },
  { id: 'use', name: '3. Use', instruction: 'Reference tokens in a style, then attach the style to a widget. Mix reads the values from that widget’s scope.' },
] as const;

/** The lesson describes the same tokens and widgets visible in the live app. */
export function TokenLesson({ code, look, looks, onLook, open = false, onOpen }: {
  code: ShowcaseCode; look: string; looks: { id: string; name: string; swatch: string[] }[]; onLook: (look: string) => void; open?: boolean; onOpen: () => void;
}) {
  const [selected, setSelected] = useState<(typeof STEPS)[number]['id']>('declare');
  const step = STEPS.find(item => item.id === selected)!;
  const entry = code[selected === 'provide' ? `token-provide-${look}` : `token-${selected}`];
  return <div className="v2-feature-panel" data-feature="tokens">
    <details className="v2-code v2-token-lesson" open={open} onToggle={event => { if (event.currentTarget.open) onOpen(); }}>
      <summary>See the Dart <span aria-hidden="true">+</span></summary>
      <div className="v2-token-steps" role="group" aria-label="Token steps">
        {STEPS.map(item => <button type="button" key={item.id} aria-pressed={selected === item.id}
          aria-controls="v2-token-code" onClick={() => setSelected(item.id)}>{item.name}</button>)}
      </div>
      <p className="v2-note">{step.instruction}</p>
      {selected === 'provide' && <div className="v2-motion-looks v2-token-looks" role="group" aria-label="Compare token values">
        {looks.map(item => <button type="button" key={item.id} aria-pressed={look === item.id} onClick={() => onLook(item.id)}>
          <span className="v2-swatch" style={{ background: `linear-gradient(135deg, ${item.swatch[0]} 50%, ${item.swatch[1]} 50%)` }} />{item.name}
        </button>)}
      </div>}
      <div id="v2-token-code"><CodeExample entry={entry} /></div>
      <details className="v2-integration-note">
        <summary>Scopes and custom tokens</summary>
        <p>A plain nested MixScope replaces its parent’s token set. Use <Link href="/mix/docs/guides/design-token/#mixscope">MixScope.inherit</Link> for a partial override.</p>
        <p>The showcase’s shape and shadow tokens are <Link href="/v2/source/?file=tokens.dart">app-defined adapters</Link>, not built-in Mix APIs.</p>
      </details>
      <Link className="v2-link" href="/v2/source/?file=token_example.dart">Run the token starter <ArrowRight /></Link>
    </details>
  </div>;
}
