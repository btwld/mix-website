'use client';

import Link from 'next/link';
import { Children, Fragment, createContext, useContext, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { ArrowRight, Check, Copy } from '@/components/landing/icons';
import { isFlutterAppPath } from '@/lib/projects.mjs';
import type { Excerpt } from '@/lib/showcase-source';
import { FlutterView, useShowcase } from './flutter';

export const THEMES = [
  { id: 'midnight', name: 'Midnight', canvas: '#0d0b14', primary: '#8b5cf6' },
  { id: 'paper', name: 'Paper', canvas: '#f3ede1', primary: '#b03a23' },
  { id: 'pop', name: 'Pop', canvas: '#ffd83d', primary: '#2540ff' },
  { id: 'terminal', name: 'Terminal', canvas: '#04120b', primary: '#2bff88' },
] as const;
export type ThemeId = (typeof THEMES)[number]['id'];

export const ThemeContext = createContext<{ theme: ThemeId; setTheme(theme: ThemeId): void }>({ theme: 'midnight', setTheme: () => {} });
export const useTheme = () => useContext(ThemeContext);

/** One choice from a few, as native radios: arrow keys and labels come free. */
export function Segmented<T extends string>({ label, value, options, onChange, hideLabel = false }: {
  label: string; value: T; options: readonly { id: NoInfer<T>; name: ReactNode }[]; onChange: (value: NoInfer<T>) => void; hideLabel?: boolean;
}) {
  const name = useId();
  return <fieldset className="v2-segmented">
    <legend className={hideLabel ? 'v2-sr' : undefined}>{label}</legend>
    <div>{options.map(option => <label key={option.id} data-checked={option.id === value}>
      <input type="radio" name={name} value={option.id} checked={option.id === value} onChange={() => onChange(option.id)} />
      <span>{option.name}</span>
    </label>)}</div>
  </fieldset>;
}

/** The theme the Tokens example shows. Only that example follows it. */
export function ThemePicker({ label = 'Theme', names = false }: { label?: string; names?: boolean }) {
  const { theme, setTheme } = useTheme();
  const name = useId();
  return <fieldset className="v2-themes" data-names={names}>
    <legend>{label}</legend>
    <div>{THEMES.map(item => <label key={item.id} data-checked={item.id === theme} title={item.name}>
      <input type="radio" name={name} value={item.id} checked={item.id === theme} onChange={() => setTheme(item.id)} />
      <i style={{ background: `linear-gradient(135deg, ${item.canvas} 50%, ${item.primary} 50%)` }} />
      <span className={names ? undefined : 'v2-sr'}>{item.name}</span>
    </label>)}</div>
  </fieldset>;
}

/** A live Flutter view with the controls that drive it. `tag` labels the first one on the page as live Flutter. */
export function Preview({ demo, label, hint, tag = false, children, className }: { demo: string; label: string; hint?: ReactNode; tag?: boolean; children?: ReactNode; className?: string }) {
  return <div className={`v2-preview${className ? ` ${className}` : ''}`}>
    {tag && <div className="v2-preview-bar"><span className="v2-live"><i />Live Flutter</span></div>}
    <FlutterView demo={demo} label={label} />
    {hint && <p className="v2-preview-hint">{hint}</p>}
    {Children.toArray(children).length > 0 && <div className="v2-preview-controls">{children}</div>}
  </div>;
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [status, setStatus] = useState<'idle' | 'copied' | 'error'>('idle');
  useEffect(() => {
    if (status === 'idle') return;
    const timer = setTimeout(() => setStatus('idle'), 2000);
    return () => clearTimeout(timer);
  }, [status]);
  return <>
    <button type="button" className="v2-copy" aria-label={label} onClick={async () => {
      try { await navigator.clipboard.writeText(text); setStatus('copied'); } catch { setStatus('error'); }
    }}>{status === 'copied' ? <Check /> : <Copy />}<span>{status === 'copied' ? 'Copied' : 'Copy'}</span></button>
    <span className="v2-sr" role="status">{status === 'copied' ? 'Copied.' : status === 'error' ? 'Copying failed. Select the code instead.' : ''}</span>
  </>;
}

export type Segment = { excerpt: Excerpt; title?: ReactNode };

/** The file a bench's code panel shows, shared with the bench's own tab bar. */
const BenchContext = createContext<{ file: number; setFile(index: number): void } | null>(null);

/** The file names a bench offers, from its excerpts. */
export const fileNames = (...excerpts: Excerpt[]) => excerpts.map(excerpt => excerpt.file.split('/').pop()!);

/**
 * A code panel beside its live example. Where the two cannot sit side by side,
 * they share one tab bar instead, the example first, as in a component gallery.
 */
export function Bench({ files, id, children }: { files: string[]; id?: string; children: ReactNode }) {
  const [file, setFile] = useState(0);
  const [preview, setPreview] = useState(true);
  const { refresh } = useShowcase();
  const name = useId();
  const key = files.join('\n');
  useEffect(() => { setFile(0); }, [key]);
  const show = (example: boolean, index = file) => { setPreview(example); setFile(index); refresh(); };
  return <BenchContext.Provider value={{ file, setFile }}>
    <div className="v2-bench" data-layout="split" data-show={preview ? 'preview' : 'code'} id={id}>
      <fieldset className="v2-bench-tabs">
        <legend className="v2-sr">Show</legend>
        <label data-checked={preview}>
          <input type="radio" name={name} checked={preview} onChange={() => show(true)} /><span>Preview</span>
        </label>
        {files.map((label, index) => <label key={label} data-checked={!preview && file === index}>
          <input type="radio" name={name} checked={!preview && file === index} onChange={() => show(false, index)} /><span>{label}</span>
        </label>)}
      </fieldset>
      {children}
    </div>
  </BenchContext.Provider>;
}

const rangeLabel = (excerpt: Excerpt) => excerpt.whole
  ? `complete file · ${excerpt.total} lines`
  : `excerpt · ${excerpt.ranges.length > 1 ? 'lines' : excerpt.ranges[0].start === excerpt.ranges[0].end ? 'line' : 'lines'} ${excerpt.ranges.map(range => range.start === range.end ? `${range.start}` : `${range.start}–${range.end}`).join(', ')} of ${excerpt.total}`;

/**
 * Source shown as it is in the file: real line numbers, a stated range, and a
 * link to the whole file. `active` names the marks to point at; `dim` quiets
 * the other lines while a momentary state is being shown.
 */
/** Lines a phone shows before offering the rest. Wider screens show everything. */
const FOLD = 26;

function CodeBlock({ segment, active, dim, heading }: { segment: Segment; active: readonly string[]; dim: boolean; heading?: ReactNode }) {
  const { excerpt } = segment;
  const [open, setOpen] = useState(false);
  const hash = excerpt.whole ? '' : `#${excerpt.ranges.map(range => `L${range.start}-L${range.end}`).join(',')}`;
  const on = excerpt.lines.map(line => line.marks.some(mark => active.includes(mark)));
  const lastLit = on.lastIndexOf(true);
  const fold = Math.max(FOLD, lastLit + 3);
  const long = excerpt.lines.length > fold + 8;
  // On wide screens a long file scrolls inside its panel. When a control
  // lights a line that is out of view there, scroll the panel to it, never the
  // page. A file opens at its top.
  const pre = useRef<HTMLPreElement>(null);
  const lit = on.join();
  const opened = useRef(false);
  useEffect(() => {
    if (!opened.current) { opened.current = true; return; }
    const box = pre.current;
    const line = box?.querySelector<HTMLElement>('.v2-line[data-on]');
    if (!box || !line || box.scrollHeight <= box.clientHeight + 1) return;
    const top = line.offsetTop - box.offsetTop;
    if (top >= box.scrollTop && top + line.offsetHeight <= box.scrollTop + box.clientHeight) return;
    const smooth = !matchMedia('(prefers-reduced-motion: reduce)').matches;
    box.scrollTo({ top: Math.max(0, top - box.clientHeight / 3), behavior: smooth ? 'smooth' : 'auto' });
  }, [lit]);
  const file = <span className="v2-code-file">
    <Link href={`/v2/source/?file=${excerpt.file}${hash}`} title="Open the complete file">lib/{excerpt.file}</Link>
    <span>{rangeLabel(excerpt)}</span>
  </span>;
  const copy = <CopyButton text={excerpt.raw} label={`Copy ${excerpt.whole ? 'file' : 'excerpt'} from ${excerpt.file}`} />;
  return <figure data-dim={dim && on.some(Boolean)} data-long={long || undefined} data-open={open || undefined}>
    {/* With tabs, the header reads like an editor: file tabs, then the open file's path. */}
    {heading ? <figcaption data-tabs>{heading}{copy}{file}</figcaption> : <figcaption>
      <span className="v2-code-about">
        {segment.title && <strong>{segment.title}</strong>}
        {file}
      </span>
      {copy}
    </figcaption>}
    {/* Long lines scroll sideways on wide screens, so the block takes keyboard focus. */}
    <pre ref={pre} tabIndex={0} aria-label={`Dart from ${excerpt.file}`}><code>{excerpt.lines.map((line, row) => {
      // Indentation is its own span: on a narrow screen CSS replaces it with
      // padding, so a wrapped line continues under its own start.
      const text = line.tokens.map(token => token.text).join('');
      const indent = text.match(/^ */)![0].length;
      let skip = indent;
      return <span className="v2-line" key={row} data-on={on[row] || undefined} data-elided={line.n === null || undefined} data-folded={row >= fold || undefined} style={{ '--indent': indent } as React.CSSProperties}>
        <span className="v2-ln" aria-hidden="true">{line.n ?? '⋯'}</span>
        <span className="v2-lc">{text ? <>
          {indent > 0 && <span className="v2-indent">{' '.repeat(indent)}</span>}
          {line.tokens.map((token, column) => {
            const cut = Math.min(skip, token.text.length);
            skip -= cut;
            const rest = token.text.slice(cut);
            if (!rest) return null;
            // A chain may wrap before a dot rather than in the middle of a name.
            // Strings and comments keep their dots.
            const prose = /^\s*(['"]|\/\/)/.test(token.text);
            const parts = prose ? [rest] : rest.split(/(?<![0-9])(?=\.[A-Za-z_$])/);
            return <span key={column} style={{ color: token.color, fontStyle: token.italic ? 'italic' : undefined }}>{parts.map((part, index) => <Fragment key={index}>{part.startsWith('.') && <wbr />}{part}</Fragment>)}</span>;
          })}
        </> : '\n'}</span>
      </span>;
    })}</code></pre>
    {long && <button type="button" className="v2-code-more" aria-expanded={open} onClick={() => setOpen(value => !value)}>
      {open ? 'Show fewer lines' : `Show all ${excerpt.lines.length} lines`}
    </button>}
  </figure>;
}

/**
 * Source shown as it is in the file: real line numbers, a stated range, and a
 * link to the whole file. `active` names the marks to point at; `dim` quiets
 * the other lines while a momentary state is being shown.
 *
 * With `tabs`, the segments are files shown one at a time, like editor tabs
 * named by file. A tab whose hidden lines are lit carries a dot. Pass `tab`
 * and `onTab` when the page should open a file itself.
 */
export function Code({ segments, active = [], dim = false, tone, tabs = false, tab, onTab }: { segments: Segment[]; active?: readonly string[]; dim?: boolean; tone?: 'mix' | 'naked' | 'remix'; tabs?: boolean; tab?: number; onTab?: (index: number) => void }) {
  const [own, setOwn] = useState(0);
  const bench = useContext(BenchContext);
  const current = tab ?? bench?.file ?? own;
  const setCurrent = onTab ?? bench?.setFile ?? setOwn;
  const name = useId();
  if (!tabs) return <div className="v2-code" data-tone={tone}>
    {segments.map((segment, index) => <CodeBlock key={`${segment.excerpt.file}:${segment.excerpt.ranges[0]?.start}:${index}`} segment={segment} active={active} dim={dim} />)}
  </div>;
  const shown = Math.min(current, segments.length - 1);
  const lit = segments.map(segment => segment.excerpt.lines.some(line => line.marks.some(mark => active.includes(mark))));
  const picker = <fieldset className="v2-code-tabs">
    <legend className="v2-sr">Open file</legend>
    {segments.map((segment, index) => <label key={index} data-checked={index === shown} data-lit={(lit[index] && index !== shown) || undefined}>
      <input type="radio" name={name} checked={index === shown} onChange={() => setCurrent(index)} />
      <span>{segment.excerpt.file.split('/').pop()}</span>
      {lit[index] && index !== shown && <span className="v2-sr">, has highlighted lines</span>}
    </label>)}
  </fieldset>;
  return <div className="v2-code" data-tone={tone}>
    <CodeBlock key={shown} segment={segments[shown]} active={active} dim={dim} heading={picker} />
  </div>;
}

export function Notes({ children }: { children: ReactNode }) {
  return <ul className="v2-notes">{children}</ul>;
}

export function DocLink({ href, children }: { href: string; children: ReactNode }) {
  // A Flutter app on this origin is a published file, not a page to prefetch.
  if (isFlutterAppPath(href)) return <a className="v2-doc" href={href}>{children}<ArrowRight /></a>;
  return <Link className="v2-doc" href={href}>{children}<ArrowRight /></Link>;
}

/** A section's heading block. `step` numbers the Mix examples. */
export function Heading({ id, kicker, title, children, level = 3 }: { id: string; kicker: ReactNode; title: ReactNode; children: ReactNode; level?: 2 | 3 }) {
  const Tag = level === 2 ? 'h2' : 'h3';
  return <header className="v2-heading" data-level={level}>
    <p className="v2-kicker">{kicker}</p>
    <Tag id={`${id}-title`}>{title}</Tag>
    <div className="v2-lede">{children}</div>
  </header>;
}
