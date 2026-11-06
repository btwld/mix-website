'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowRight } from '@/components/landing/icons';
import { LandingButton } from '@/components/landing/ui';
import type { ShowcaseCode } from '@/lib/showcase-source';
import { Stage, useShowcase } from './stage';

const LOOKS = [
  { id: 'midnight', name: 'Midnight', swatch: ['#0d0b14', '#8b5cf6'] },
  { id: 'paper', name: 'Paper', swatch: ['#f3ede1', '#b03a23'] },
  { id: 'pop', name: 'Pop', swatch: ['#ffd83d', '#2540ff'] },
  { id: 'cyber', name: 'Cyber', swatch: ['#04120b', '#2bff88'] },
];

const SCREENS = [
  { id: 'tasks', name: 'Task list', note: 'Add, complete, filter and reset. Handles the empty state.' },
  { id: 'team', name: 'Team access', note: 'Invite with validation, change a role, remove a person.' },
  { id: 'settings', name: 'Settings', note: 'A real form, and its Accent and Corners controls rewrite this app’s tokens as you drag.' },
];

const WIDGETS = [
  ['Button', 'button'], ['Icon button', 'icon_button'], ['Checkbox', 'checkbox'], ['Slider', 'slider'],
  ['Switch', 'switch'], ['Segmented control', 'segmented_control'], ['Avatar', 'avatar'], ['Badge', 'badge'],
];

/** Scrolling through the first chapter walks the app through every look. */
const TOUR_LOOKS = ['paper', 'pop', 'cyber', 'midnight'];

/** Options under review. The switch below the stage flips between them live. */
const SUBJECTS = [
  { id: 'deck', name: 'Cards' },
  { id: 'single', name: 'Single card' },
  { id: 'phone', name: 'Phone' },
  { id: 'app', name: 'Full app' },
];

const BLOCKS = [
  { id: 'player', name: 'Now playing', note: 'Transport, a live timeline and a keyframed equalizer.' },
  { id: 'today', name: 'Today', note: 'A simple list with hover and press states.' },
  { id: 'spending', name: 'Spending', note: 'A stat and a chart that springs between ranges.' },
  { id: 'appearance', name: 'Make it yours', note: 'Accent, corners and shadows rewrite this page’s tokens as you drag.' },
  { id: 'team', name: 'Team', note: 'Avatars, secondary text and an invite toggle.' },
];

type Chapter = 'hero' | 'looks' | 'states' | 'adapt' | 'motion' | 'remix' | 'naked' | 'blocks';

/** What the live app should show for a chapter, given the subject under review. */
function stateFor(chapter: Chapter, subject: string, block: string) {
  const isApp = subject === 'app';
  const base: Record<string, unknown> = { subject, xray: false, naked: false, phone: false, highlight: null };
  switch (chapter) {
    case 'adapt': return { ...base, phone: true };
    case 'motion': return { ...base, play: isApp ? 'complete' : 'music', ...(isApp && { screen: 'tasks' }) };
    case 'remix': return { ...base, xray: true, ...(isApp && { screen: 'tasks' }) };
    case 'naked': return { ...base, naked: true };
    case 'blocks': return isApp ? base : { ...base, subject: 'deck', highlight: block };
    default: return base;
  }
}

const LAYER: Record<Chapter, 'mix' | 'remix' | 'naked' | 'blocks'> = {
  hero: 'mix', looks: 'mix', states: 'mix', adapt: 'mix', motion: 'mix', remix: 'remix', naked: 'naked', blocks: 'blocks',
};

/** One step per chapter, grouped by project, so the bar shows real progress. */
const STEPS: { id: Chapter; group: string; name: string }[] = [
  { id: 'looks', group: 'Mix', name: 'Tokens' },
  { id: 'states', group: 'Mix', name: 'Variants' },
  { id: 'adapt', group: 'Mix', name: 'Context' },
  { id: 'motion', group: 'Mix', name: 'Animation' },
  { id: 'remix', group: 'Remix', name: 'Widgets' },
  { id: 'naked', group: 'Naked UI', name: 'Behavior' },
  { id: 'blocks', group: 'Blocks', name: 'Blocks' },
];

function Code({ entry }: { entry: ShowcaseCode[string] }) {
  return <figure className="v2-code">
    <figcaption>Excerpt · {entry.file}</figcaption>
    <div dangerouslySetInnerHTML={{ __html: entry.html }} />
  </figure>;
}

function Section({ id, active, tag, title, doc, children }: {
  id: Chapter; active: Chapter; tag: string; title: string; doc: { href: string; label: string }; children: ReactNode;
}) {
  return <section className="v2-chapter" id={`v2-${id}`} data-chapter={id} data-active={active === id} data-layer={LAYER[id]}>
    <div className="v2-chapter-body">
      <p className="v2-tag">{tag}</p>
      <h2>{title}</h2>
      {children}
      <Link className="v2-link" href={doc.href}>{doc.label} <ArrowRight /></Link>
    </div>
  </section>;
}

function Steps({ active, onStep }: { active: Chapter; onStep: (chapter: Chapter) => void }) {
  const current = STEPS.findIndex(step => step.id === active);
  return <nav className="v2-steps" aria-label="Tour steps">
    {STEPS.map((step, index) => {
      const opensGroup = index === 0 || STEPS[index - 1].group !== step.group;
      return <a
        key={step.id}
        className="v2-step"
        href={`#v2-${step.id}`}
        title={step.name}
        data-step={step.id}
        data-state={index === current ? 'current' : index < current ? 'done' : 'next'}
        data-group-on={current >= 0 && STEPS[current].group === step.group}
        aria-current={index === current ? 'step' : undefined}
        aria-label={`Step ${index + 1} of ${STEPS.length}: ${step.group}, ${step.name}`}
        onClick={event => { event.preventDefault(); onStep(step.id); }}
      ><span>{opensGroup ? step.group : ''}</span><i /></a>;
    })}
  </nav>;
}

export function Tour({ code }: { code: ShowcaseCode }) {
  const [active, setActive] = useState<Chapter>('hero');
  const [look, setLook] = useState('midnight');
  const [screen, setScreen] = useState('tasks');
  const [subject, setSubject] = useState('deck');
  const [block, setBlock] = useState('player');
  const root = useRef<HTMLDivElement>(null);
  const picked = useRef(false);
  const { ready, missing, mount, send } = useShowcase(event => {
    if (typeof event.screen === 'string') setScreen(event.screen);
  });

  useEffect(() => {
    const compact = matchMedia('(max-width: 62rem)').matches;
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) setActive((entry.target as HTMLElement).dataset.chapter as Chapter);
    }, { rootMargin: compact ? '-74% 0px -22% 0px' : '-46% 0px -46% 0px' });
    root.current?.querySelectorAll('[data-chapter]').forEach(element => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const requested = new URLSearchParams(location.search).get('subject');
    if (SUBJECTS.some(item => item.id === requested)) setSubject(requested!);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const { play, ...state } = stateFor(active, subject, block);
    send({ ...state, reduceMotion, ...(!reduceMotion && play ? { play } : {}) });
  }, [active, ready, subject, block]); // eslint-disable-line react-hooks/exhaustive-deps

  // The address always names the chapter on screen, so a copied link lands there.
  useEffect(() => {
    if (!ready) return;
    const hash = active === 'hero' ? '' : `#v2-${active}`;
    if (location.hash !== hash) history.replaceState(history.state, '', `${location.pathname}${location.search}${hash}`);
  }, [active, ready]);

  // A chip click hands control to the reader until they leave the chapter.
  useEffect(() => {
    if (active !== 'looks') { picked.current = false; return; }
    if (!ready || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const chapter = root.current?.querySelector<HTMLElement>('[data-chapter="looks"]');
    if (!chapter) return;
    const follow = () => {
      if (picked.current) return;
      const { top, height } = chapter.getBoundingClientRect();
      const progress = Math.min(0.999, Math.max(0, -top / (height - innerHeight)));
      const next = TOUR_LOOKS[Math.floor(progress * TOUR_LOOKS.length)];
      setLook(current => { if (current !== next) send({ look: next }); return next; });
    };
    follow();
    addEventListener('scroll', follow, { passive: true });
    return () => removeEventListener('scroll', follow);
  }, [active, ready]); // eslint-disable-line react-hooks/exhaustive-deps

  const chooseLook = (id: string) => { picked.current = true; setLook(id); send({ look: id }); };
  const chooseScreen = (id: string) => { setScreen(id); send({ screen: id }); };
  const layer = LAYER[active];

  /** Jumps straight there: gliding past each chapter would flash every state. */
  const goTo = (chapter: Chapter) => {
    const target = root.current?.querySelector<HTMLElement>(`[data-chapter="${chapter}"]`);
    if (!target) return;
    const { top, height } = target.getBoundingClientRect();
    const compact = matchMedia('(max-width: 62rem)').matches;
    const stage = root.current!.querySelector('.v2-stage-column')!.getBoundingClientRect();
    const offset = compact ? stage.height + 84 : chapter === 'looks' ? 0 : innerHeight / 2 - height / 2;
    scrollTo({ top: scrollY + top - offset, behavior: 'instant' });
  };

  return <div className="lx project-mix v2" data-layer={layer} ref={root}>
    <label className="v2-prototype">
      <span>Prototype</span>
      <select value={subject} onChange={event => setSubject(event.target.value)} aria-label="Choose what the stage shows">
        {SUBJECTS.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
      </select>
    </label>
    <div className="v2-tour">
      <header className="v2-hero" data-chapter="hero">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/icon_logo.svg" alt="Mix" width={58} height={64} />
        <h1>An Expressive Styling System for Flutter</h1>
        <p className="v2-lead">Effortlessly style your widgets and build design systems.</p>
        <div className="v2-cta">
          <LandingButton href="/mix/docs/overview/getting-started/" arrow>Get started</LandingButton>
          <LandingButton href="/mix/docs/" variant="secondary">Read the docs</LandingButton>
        </div>
        <p className="v2-hint"><strong>That’s real Flutter</strong>, running in this page. Try it, then scroll: we’ll take it apart.</p>
      </header>

      <div className="v2-stage-column">
        <Stage mount={mount} ready={ready} missing={missing} />
        <Steps active={active} onStep={goTo} />
      </div>

      <div className="v2-rail">
        <Section id="looks" active={active} doc={{ href: "/mix/docs/guides/design-token/", label: "Design tokens guide" }} tag="Mix · Tokens" title="One app. Any look.">
          <p>Keep scrolling. Every screen reads the same tokens, so changing their values changes color, shape, type and depth at once. No widget knows which look is on.</p>
          <div className="v2-chips" role="group" aria-label="Choose a look">
            {LOOKS.map(item => <button key={item.id} type="button" aria-pressed={look === item.id} onClick={() => chooseLook(item.id)}>
              <span className="v2-swatch" style={{ background: `linear-gradient(135deg, ${item.swatch[0]} 50%, ${item.swatch[1]} 50%)` }} />{item.name}
            </button>)}
          </div>
          <Code entry={code[look]} />
        </Section>

        <Section id="states" active={active} doc={{ href: "/mix/docs/guides/dynamic-styling/", label: "Variants guide" }} tag="Mix · Variants" title="States are styles.">
          <p>Hover or press a row. There’s no listener and no conditional: each state is part of the style.</p>
          <Code entry={code.states} />
        </Section>

        <Section id="adapt" active={active} doc={{ href: "/mix/docs/guides/dynamic-styling/", label: "Context variants guide" }} tag="Mix · Context" title={subject === 'phone' ? 'Same app, wider screen.' : 'Same app, narrower screen.'}>
          <p>It just reflowed. There’s no second layout file: the same widgets respond to the width they’re given, and a breakpoint style tightens the spacing.</p>
          <Code entry={code.adapt} />
        </Section>

        <Section id="motion" active={active} doc={{ href: "/mix/docs/guides/animations/", label: "Animation guide" }} tag="Mix · Animation" title="Motion lives in the style.">
          <p>Every look change you saw animates because each style ends in <code>.animate()</code>. The equalizer goes further: its bounce is a keyframe timeline inside the style, with no controller.</p>
          <Code entry={code.motion} />
        </Section>

        <Section id="remix" active={active} doc={{ href: "/remix/docs/guides/styling-components/", label: "Styling components guide" }} tag="Remix" title="Build your interfaces with widgets you can make your own.">
          <p>Everything outlined is a Remix widget. The behavior comes with it; the appearance is the Mix style you just saw. Remix doesn’t bring a theme of its own.</p>
          <ul className="v2-widgets">
            {WIDGETS.map(([name, slug]) => <li key={slug}><Link href={`/remix/docs/components/${slug}/`}>{name}</Link></li>)}
          </ul>
        </Section>

        <Section id="naked" active={active} doc={{ href: "/naked-ui/docs/", label: "Naked UI documentation" }} tag="Naked UI" title="Underneath, it’s just behavior.">
          <p>Styling off, same layout. The Today rows and the player controls are now Naked UI’s widgets with nothing added. Hover or press a row and watch its state. On a keyboard, click one, then use Tab and Space.</p>
          <Code entry={code.naked} />
        </Section>

        <Section id="blocks" active={active} doc={{ href: "/remix/docs/open-code/", label: "Editable recipes guide" }} tag="Blocks" title={subject === 'app' ? 'Start from a screen, not a blank page.' : 'Every card is a block.'}>
          <p>{subject === 'app' ? 'Each screen in this app is a complete block with its own state, validation and reset. Try one.' : 'Each one is a small, finished piece with its own state. Pick one.'}</p>
          <div className="v2-blocks" role="group" aria-label="Choose a block">
            {subject === 'app'
              ? SCREENS.map(item => <button key={item.id} type="button" aria-pressed={screen === item.id} onClick={() => chooseScreen(item.id)}>
                <strong>{item.name}</strong><span>{item.note}</span>
              </button>)
              : BLOCKS.map(item => <button key={item.id} type="button" aria-pressed={block === item.id} onClick={() => setBlock(item.id)}>
                <strong>{item.name}</strong><span>{item.note}</span>
              </button>)}
          </div>
        </Section>
      </div>
    </div>

    <section className="v2-end" aria-labelledby="v2-start">
      <h2 id="v2-start">Start at the layer you need.</h2>
      <div className="v2-end-grid">
        <article>
          <h3>Mix</h3><p>Style anything, build a design system.</p>
          <code>flutter pub add mix</code>
          <Link className="v2-link" href="/mix/docs/overview/getting-started/">Get started <ArrowRight /></Link>
        </article>
        <article>
          <h3>Remix</h3><p>Finished widgets you style with Mix.</p>
          <code>flutter pub add remix</code>
          <Link className="v2-link" href="/remix/docs/getting-started/">Get started <ArrowRight /></Link>
        </article>
        <article>
          <h3>Naked UI</h3><p>Behavior only. Every pixel is yours.</p>
          <code>flutter pub add naked_ui</code>
          <Link className="v2-link" href="/naked-ui/docs/">Get started <ArrowRight /></Link>
        </article>
      </div>
    </section>
  </div>;
}
