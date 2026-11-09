'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { ShowcaseCode } from '@/lib/showcase-source';
import { CodeExample } from './code-example';

const STEPS = [
  { id: 'declare', name: '1. Declare', instruction: 'Declare two keys with Mix’s built-in ColorToken type. Every look reuses these keys.' },
  { id: 'provide', name: '2. Provide', instruction: 'Each look supplies values through MixScope. Choose another look to compare its values.' },
  { id: 'use', name: '3. Use', instruction: 'Reference the token in a style, then attach the style to a widget. The Box reads $canvas from the nearest MixScope; .animate(motion) eases each change.' },
] as const;

/**
 * The first loop is the smallest real path through the running app: built-in
 * color tokens only. The app's complete setup stays one step deeper.
 */
export function TokenLesson({ code, look, looks, onLook, open = false, onOpen }: {
  code: ShowcaseCode; look: string; looks: { id: string; name: string; swatch: string[] }[]; onLook: (look: string) => void; open?: boolean; onOpen: () => void;
}) {
  const [selected, setSelected] = useState<(typeof STEPS)[number]['id']>('declare');
  // The complete setup renders once asked for, so the first loop is the only code until then.
  const [depth, setDepth] = useState(false);
  const step = STEPS.find(item => item.id === selected)!;
  const entry = code[selected === 'provide' ? `token-provide-${look}` : `token-${selected}`];
  return <div className="v2-feature-panel" data-feature="tokens">
    <details className="v2-code v2-token-lesson" open={open} onToggle={event => { if (event.currentTarget.open) onOpen(); }}>
      <summary>See the Dart <span aria-hidden="true">+</span></summary>
      <p className="v2-note v2-token-starter">Prefer one runnable file? <Link href="/v2/source/?file=token_example.dart">Run the token starter</Link>: built-in token types, two value sets, no showcase helpers.</p>
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
      {entry.raw.includes('// ···') && <p className="v2-note"><code>{'// ···'}</code> marks app lines left out of this excerpt. The source links show every line.</p>}
      <details className="v2-integration-note v2-token-app" onToggle={event => { if (event.currentTarget.open) setDepth(true); }}>
        <summary>How this showcase handles type, shape, and shadow</summary>
        <p>The app declares seven more color tokens the same way. It also provides text styles and two app-defined token types, ShapeToken and LiftToken. Those two are <Link href="/v2/source/?file=tokens.dart">showcase adapters</Link>, not built-in Mix APIs. The cards use them with <code>.animate(motion)</code> and a breakpoint.</p>
        <p>A plain nested MixScope replaces its parent’s token set. Use <Link href="/mix/docs/guides/design-token/#mixscope">MixScope.inherit</Link> for a partial override.</p>
        {depth && <CodeExample entry={code['token-app']} />}
      </details>
    </details>
  </div>;
}
