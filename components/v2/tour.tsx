'use client';

import Link from 'next/link';
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowRight } from '@/components/landing/icons';
import { CopyCommand } from '@/components/landing/copy-command';
import type { ShowcaseCode, ShowcasePackage } from '@/lib/showcase-source';
import { Stage, useShowcase } from './stage';
import { CodeExample } from './code-example';
import { Features, FeatureLesson, FEATURES, motionDocs, type FeaturePreview, type MotionMode } from './features';
import { TokenLesson } from './token-lesson';

const LOOKS = [
  { id: 'midnight', name: 'Midnight', swatch: ['#0d0b14', '#8b5cf6'] },
  { id: 'paper', name: 'Paper', swatch: ['#f3ede1', '#b03a23'] },
  { id: 'pop', name: 'Pop', swatch: ['#ffd83d', '#2540ff'] },
  { id: 'cyber', name: 'Cyber', swatch: ['#04120b', '#2bff88'] },
];
const TOUR_LOOKS = ['paper', 'pop', 'cyber', 'midnight'];
const PRESETS = [
  { name: 'Your styles', preset: 'custom', presetMode: 'light' },
  { name: 'Fortal light', preset: 'fortal', presetMode: 'light' },
  { name: 'Fortal dark', preset: 'fortal', presetMode: 'dark' },
] as const;
const WIDGETS = [
  ['Button', 'button'], ['Icon button', 'icon_button'], ['Checkbox', 'checkbox'],
  ['Slider', 'slider'], ['Switch', 'switch'], ['Segmented control', 'segmented_control'],
  ['Avatar', 'avatar'], ['Badge', 'badge'],
  ['Dialog', 'dialog'], ['Text field', 'textfield'], ['Toast', 'toast'],
];
const REMIX_GROUPS = [
  ['Overlays', 'components/dialog'],
  ['Navigation', 'components/tabs'],
  ['Feedback', 'components/progress'],
  ['Layout', 'components/accordion'],
  ['Data display', 'components/data_table'],
  ['Agent surfaces', 'agent/composer'],
];
const BLOCKS = [
  { id: 'player', name: 'Now playing', note: 'Play, pause, skip, and seek through a simulated track.' },
  { id: 'today', name: 'Today', note: 'Check off a task. Its state stays with you through every look.' },
  { id: 'spending', name: 'Spending', note: 'Compare two weeks and explore the daily totals.' },
  { id: 'appearance', name: 'Make it yours', note: 'Change the accent, corners, and shadows across the interface.' },
  { id: 'team', name: 'Team', note: 'Try an invite interaction with local sample data.' },
];
const MOTION: { id: MotionMode; name: string; description: string }[] = [
  { id: 'transitions', name: 'Transitions', description: 'A new look changes the target values. One .animate() call lets the cards’ surface and shape flow into place.' },
  { id: 'springs', name: 'Springs', description: 'The same animation API can use spring motion. Spending’s bars settle into their new heights when the data changes.' },
  { id: 'keyframes', name: 'Keyframes', description: 'For a repeating sequence, define a timeline. The player’s equalizer moves through height keyframes, all within its style.' },
];

type Chapter = 'hero' | 'looks' | 'states' | 'adapt' | 'motion' | 'remix' | 'naked' | 'blocks';
const LAYER: Record<Chapter, 'mix' | 'remix' | 'naked' | 'blocks'> = {
  hero: 'mix', looks: 'mix', states: 'mix', adapt: 'mix', motion: 'mix', remix: 'remix', naked: 'naked', blocks: 'blocks',
};
const STEPS: { id: Chapter; group: string; name: string; short: string }[] = [
  { id: 'looks', group: 'Mix', name: 'Design tokens', short: 'Looks' },
  { id: 'states', group: 'Mix', name: 'Interaction states', short: 'States' },
  { id: 'adapt', group: 'Mix', name: 'Responsive layout', short: 'Layout' },
  { id: 'motion', group: 'Mix', name: 'Animation', short: 'Motion' },
  { id: 'remix', group: 'Remix', name: 'Composable components', short: 'Remix' },
  { id: 'naked', group: 'Naked UI', name: 'Headless behavior', short: 'Naked UI' },
  { id: 'blocks', group: 'Examples', name: 'Explore the cards', short: 'Examples' },
];

const COMPACT = '(max-width: 62rem)';

/** Phones and tablets pin the demo above the reading column unless the screen is short. */
function pinsStage() {
  return matchMedia(COMPACT).matches && innerHeight > 600;
}

/** Where the pinned demo rests, from its real sticky offset and height. */
function pinnedBottom(column: HTMLElement | null | undefined) {
  if (!column) return 0;
  const top = parseFloat(getComputedStyle(column).top);
  return (Number.isFinite(top) ? top : 0) + column.getBoundingClientRect().height;
}

/** The line a chapter crosses to become active: just below the visible demo on phones. */
function readingLine(column: HTMLElement | null | undefined) {
  if (!pinsStage()) return innerHeight * .5;
  return Math.min(innerHeight - 40, (column?.getBoundingClientRect().bottom ?? 0) + 64);
}

function stateFor(chapter: Chapter, block: string, motion: MotionMode, compact: boolean, focus: string | null) {
  const base: Record<string, unknown> = { xray: false, naked: false, phone: false, highlight: null };
  switch (chapter) {
    case 'states': return { ...base, highlight: 'today' };
    case 'adapt': return { ...base, phone: true };
    case 'motion': return { ...base, highlight: motion === 'springs' ? 'spending' : motion === 'keyframes' ? 'player' : null };
    case 'remix': return { ...base, xray: true, highlight: focus ?? (compact ? 'today' : null) };
    case 'naked': return { ...base, naked: true, highlight: focus };
    case 'blocks': return { ...base, highlight: block };
    default: return base;
  }
}

function Section({ id, active, tag, title, doc, children }: {
  id: Chapter; active: Chapter; tag: string; title: string; doc: { href: string; label: string }; children: ReactNode;
}) {
  return <section className="v2-chapter" id={`v2-${id}`} data-chapter={id} data-active={active === id} data-layer={LAYER[id]} aria-labelledby={`v2-title-${id}`}>
    <div className="v2-chapter-body">
      <p className="v2-tag">{tag}</p>
      <h2 id={`v2-title-${id}`} tabIndex={-1}>{title}</h2>
      {children}
      <Link className="v2-link" href={doc.href}>{doc.label} <ArrowRight /></Link>
    </div>
  </section>;
}

/** A prerelease pin, such as 1.0.0-beta.17, is read as maturity without naming the beta. */
function Library({ role, version }: { role: string; version: string }) {
  return <p className="v2-library-role">{role} · <span className="v2-maturity">{version.includes('-') ? 'Prerelease' : 'Stable release'}</span></p>;
}

/** Shown on phones while code is open, or while the demo is out of view. */
function PreviewToggle({ hidden, visible, onToggle }: { hidden: boolean; visible: boolean; onToggle: () => void }) {
  if (!visible && !hidden) return null;
  return <button className="v2-preview-toggle" type="button" aria-controls="v2-stage" aria-expanded={!hidden} onClick={onToggle}>
    {hidden ? 'Show preview' : 'Hide preview'}
  </button>;
}

function Steps({ active, onStep }: { active: Chapter; onStep: (chapter: Chapter) => void }) {
  const current = STEPS.findIndex(step => step.id === active);
  return <nav className="v2-steps" aria-label="Showcase chapters">
    {STEPS.map((step, index) => <a key={step.id} className="v2-step" href={`#v2-${step.id}`}
      title={`${step.group}: ${step.name}`} data-step={step.id}
      data-state={index === current ? 'current' : index < current ? 'done' : 'next'}
      aria-current={index === current ? 'step' : undefined}
      aria-label={`${step.group}: ${step.name}`}
      onClick={event => { event.preventDefault(); onStep(step.id); }}>
      <i /><span>{step.short}</span>
    </a>)}
  </nav>;
}

export function Tour({ code, packages }: { code: ShowcaseCode; packages: ShowcasePackage }) {
  const [active, setActive] = useState<Chapter>('hero');
  const [look, setLook] = useState('midnight');
  const [block, setBlock] = useState('player');
  // An explicit preview keeps its chapter's mode, including bare Naked widgets.
  // Normal chapter navigation clears it and restores the responsive defaults.
  const [chapterFocus, setChapterFocus] = useState<{ chapter: Chapter; block: string } | null>(null);
  const [motion, setMotion] = useState<MotionMode>('transitions');
  const [preset, setPreset] = useState<(typeof PRESETS)[number]>(PRESETS[0]);
  const [lesson, setLesson] = useState<{ id: string; chapter: Chapter; request: number } | null>(null);
  const lessonRequest = useRef(0);
  const [anchorRequest, setAnchorRequest] = useState<{ chapter: Chapter; focusHeading: boolean } | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const picked = useRef(false);
  const { ready, missing, mount, send } = useShowcase();
  // On phones, reading code moves the pinned demo up out of view. It stays
  // mounted and keeps its state; the reader can bring it back at any time.
  const [previewHidden, setPreviewHidden] = useState(false);
  const [codeOpen, setCodeOpen] = useState(false);
  const hidden = useRef(false);
  // What stays in place when the demo moves: the line below it, or an element.
  const previewShift = useRef<{ below: number } | { element: Element } | null>(null);
  const column = () => root.current?.querySelector<HTMLElement>('.v2-stage-column');

  // By default, keep the first line the reader was looking at directly below the demo.
  const showPreview = useCallback((show: boolean, keep: 'reading' | 'nothing' | Element = 'reading') => {
    if (hidden.current === !show) return;
    hidden.current = !show;
    previewShift.current = !pinsStage() || keep === 'nothing' ? null
      : keep === 'reading' ? { below: column()?.getBoundingClientRect().bottom ?? 0 } : { element: keep };
    setPreviewHidden(!show);
  }, []);

  // Measure against where the demo rests once pinned. Near the top of Looks it
  // has not pinned yet, so hiding must also scroll it out of view.
  useLayoutEffect(() => {
    const shift = previewShift.current;
    previewShift.current = null;
    if (!shift) return;
    const after = pinnedBottom(column());
    const distance = 'below' in shift ? shift.below - after : shift.element.getBoundingClientRect().top - after - 12;
    if (Math.abs(distance) > 1) scrollBy({ top: distance, behavior: 'instant' });
  }, [previewHidden]);

  // Opening code on a phone moves the demo out of the way and brings that code
  // to the top; closing it brings the demo back. Topic and chapter jumps show
  // the demo through goTo instead.
  useEffect(() => {
    const rail = root.current?.querySelector('.v2-rail');
    if (!rail) return;
    const onClick = (event: Event) => {
      const summary = (event.target as Element).closest('summary');
      const details = summary?.parentElement;
      if (!(details instanceof HTMLDetailsElement) || !details.classList.contains('v2-code') || !pinsStage()) return;
      if (details.open) showPreview(true);
      else showPreview(false, summary!);
    };
    rail.addEventListener('click', onClick, true);
    return () => rail.removeEventListener('click', onClick, true);
  }, [showPreview]);

  // The toggle is offered while the active chapter has code open.
  useEffect(() => {
    const rail = root.current?.querySelector('.v2-rail');
    if (!rail) return;
    const update = () => setCodeOpen(Boolean(rail.querySelector(`[data-chapter="${active}"] details.v2-code[open]`)));
    update();
    rail.addEventListener('toggle', update, true);
    return () => rail.removeEventListener('toggle', update, true);
  }, [active]);

  // The demo must not stay hidden, and inert, where it is visible anyway: on a
  // screen that does not pin it, or above the point where it pins.
  useEffect(() => {
    if (!previewHidden) return;
    const restore = () => {
      const top = column()?.getBoundingClientRect().top ?? 0;
      const navigation = document.querySelector('.v2-nav')?.getBoundingClientRect().bottom ?? 0;
      if (!pinsStage() || top >= navigation) showPreview(true, 'nothing');
    };
    addEventListener('resize', restore);
    addEventListener('scroll', restore, { passive: true });
    return () => { removeEventListener('resize', restore); removeEventListener('scroll', restore); };
  }, [previewHidden, showPreview]);

  const goTo = useCallback((chapter: Chapter, focus?: string, feature?: string, focusHeading = false) => {
    const target = root.current?.querySelector<HTMLElement>(`[data-chapter="${chapter}"]`);
    if (!target) return;
    // A chapter or topic jump is a request to see that demo state.
    showPreview(true, 'nothing');
    setChapterFocus(focus ? { chapter, block: focus } : null);
    setLesson(feature ? { id: feature, chapter, request: ++lessonRequest.current } : null);
    setActive(chapter);
    setAnchorRequest({ chapter, focusHeading });
    // Explicit navigation can reselect the active chapter after browsing Features.
    const hash = chapter === 'hero' ? '' : `#v2-${chapter}`;
    if (location.hash !== hash) history.replaceState(history.state, '', `${location.pathname}${location.search}${hash}`);
  }, [showPreview]);

  // Focus after the expanded lesson commits, then measure in the next frame.
  // In WebKit, scrolling during that layout can be undone by native scroll
  // anchoring when an earlier chapter grows. A newer request cancels this one.
  useLayoutEffect(() => {
    if (!anchorRequest) return;
    const { chapter, focusHeading } = anchorRequest;
    const target = root.current?.querySelector<HTMLElement>(`[data-chapter="${chapter}"]`);
    if (!target) return;
    if (focusHeading) target.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true });
    const frame = requestAnimationFrame(() => {
      const compact = matchMedia(COMPACT).matches;
      // Land below where the demo rests once pinned, not where it is right now.
      const offset = chapter === 'hero' ? 0 : compact ? pinsStage() ? pinnedBottom(column()) + 20 : 88 : chapter === 'looks' ? 116 : Math.max(116, innerHeight / 2 - target.offsetHeight / 2);
      scrollTo({ top: Math.max(0, scrollY + target.getBoundingClientRect().top - offset), behavior: 'instant' });
    });
    return () => cancelAnimationFrame(frame);
  }, [anchorRequest]);

  // Follow a reading line below the pinned demo on compact screens. Recalculate
  // on resize as well as scroll, so rotating a device cannot strand the chapter.
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const line = readingLine(column());
      const chapters = [...(root.current?.querySelectorAll<HTMLElement>('[data-chapter]') ?? [])].filter(item => item.offsetHeight > 0);
      let next: Chapter = 'hero';
      for (const chapter of chapters) if (chapter.getBoundingClientRect().top <= line) next = chapter.dataset.chapter as Chapter;
      setActive(next);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    const requested = location.hash.replace('#v2-', '');
    if (STEPS.some(step => step.id === requested)) goTo(requested as Chapter);
    schedule();
    addEventListener('scroll', schedule, { passive: true });
    addEventListener('resize', schedule);
    return () => { cancelAnimationFrame(frame); removeEventListener('scroll', schedule); removeEventListener('resize', schedule); };
  }, [goTo]);

  useEffect(() => {
    if (!ready) return;
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const compact = matchMedia('(max-width: 62rem)');
    const apply = () => {
      const focus = chapterFocus?.chapter === active ? chapterFocus.block : null;
      send({ ...stateFor(active, block, motion, compact.matches, focus), reduceMotion: media.matches });
    };
    apply();
    media.addEventListener('change', apply);
    compact.addEventListener('change', apply);
    return () => { media.removeEventListener('change', apply); compact.removeEventListener('change', apply); };
  }, [active, ready, block, motion, chapterFocus]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep a look picked during startup: the bridge does not exist until ready.
  // Sending only when the look changes also preserves custom accents between chapters.
  useEffect(() => {
    if (ready) send({ look });
  }, [look, ready]); // eslint-disable-line react-hooks/exhaustive-deps

  // Remember the comparison choice, but use it only in its own chapter.
  // Other chapters must demonstrate the custom styles their excerpts describe.
  useEffect(() => {
    const applied = active === 'remix' ? preset : PRESETS[0];
    if (ready) send({ preset: applied.preset, presetMode: applied.presetMode });
  }, [preset, active, ready]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!ready) return;
    const end = document.getElementById('v2-features');
    if (end && end.getBoundingClientRect().top < innerHeight / 2) return;
    const hash = active === 'hero' ? '' : `#v2-${active}`;
    if (location.hash !== hash) history.replaceState(history.state, '', `${location.pathname}${location.search}${hash}`);
  }, [active, ready]);

  useEffect(() => {
    if (active !== 'looks' || !ready) return;
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const chapter = root.current?.querySelector<HTMLElement>('[data-chapter="looks"]');
    if (!chapter) return;
    const follow = () => {
      if (picked.current || media.matches) return;
      const { top, height } = chapter.getBoundingClientRect();
      // Desktop holds the chapter while its long scroll cycles the looks. Phones
      // size it to its content and cycle while that content passes the reading line.
      const progress = Math.min(.999, Math.max(0, matchMedia(COMPACT).matches
        ? (readingLine(column()) - top) / Math.max(1, height)
        : (120 - top) / Math.max(1, height - innerHeight)));
      const next = TOUR_LOOKS[Math.floor(progress * TOUR_LOOKS.length)];
      setLook(next);
    };
    follow();
    addEventListener('scroll', follow, { passive: true });
    return () => removeEventListener('scroll', follow);
  }, [active, ready]); // eslint-disable-line react-hooks/exhaustive-deps

  // A choice stays made: scrolling back through Looks must not replace it.
  const chooseLook = (id: string) => { picked.current = true; setLook(id); };
  const previewFeature = ({ chapter, motion, block, preset, feature }: FeaturePreview) => {
    if (motion) setMotion(motion);
    if (block) setBlock(block);
    if (preset === 'custom') setPreset(PRESETS[0]);
    if (preset === 'fortal') setPreset(previous => previous.preset === 'fortal' ? previous : PRESETS[1]);
    goTo(chapter, block, feature, true);
  };
  const chapter = STEPS.find(step => step.id === active);
  const motionExample = MOTION.find(item => item.id === motion)!;
  const lessonFor = (chapter: Chapter, fallback: string) => lesson?.chapter === chapter ? lesson.id : fallback;
  const lessonKey = (chapter: Chapter) => lesson?.chapter === chapter ? lesson.request : 'default';
  const readCode = () => { picked.current = true; };
  const guideFor = (id: string) => FEATURES.find(item => item.id === id)!.docs;
  const remixLesson = lessonFor('remix', preset.preset === 'custom' ? 'remix' : 'open-code');

  return <div className="lx project-mix v2" data-layer={LAYER[active]} data-preview={previewHidden ? 'hidden' : 'shown'} ref={root} id="v2-content">
    <div className="v2-tour">
      <header className="v2-hero" data-chapter="hero">
        <h1>Flutter UI,<br />your way.</h1>
        <p className="v2-lead">One interface. Style it with Mix, compose it with Remix, or build its interactions with Naked UI.</p>
        <p className="v2-start-note">Start at the layer you need. Remix includes Mix and Naked UI.</p>
        <div className="v2-cta">
          <button className="lx-btn lx-btn-primary" type="button" onClick={() => goTo('looks')}>Explore the showcase <ArrowRight /></button>
          <a className="lx-btn lx-btn-secondary" href="#v2-features">Features &amp; code</a>
        </div>
        <div className="v2-stack" aria-label="The Flutter UI stack">
          <a href="#v2-looks" onClick={event => { event.preventDefault(); goTo('looks'); }}><strong>Mix</strong><span>Define the style</span><ArrowRight /></a>
          <a href="#v2-remix" onClick={event => { event.preventDefault(); goTo('remix'); }}><strong>Remix</strong><span>Compose the interface</span><ArrowRight /></a>
          <a href="#v2-naked" onClick={event => { event.preventDefault(); goTo('naked'); }}><strong>Naked UI</strong><span>Start with behavior</span><ArrowRight /></a>
        </div>
        <p className="v2-hint">This is real Flutter. Try the controls, then follow the same interface from styles to components and behavior.</p>
      </header>

      <div className="v2-stage-column">
        <div className="v2-stage-caption"><span>{chapter ? `${chapter.group} / ${chapter.name}` : 'Live Flutter · Demo data'}</span><span>{active === 'naked' ? 'Bare rendering' : active === 'remix' && preset.preset === 'fortal' ? `${preset.name} · Today` : LOOKS.find(item => item.id === look)?.name}</span></div>
        <Stage mount={mount} ready={ready} missing={missing} hidden={previewHidden} />
        <div className="v2-stage-bar">
          <Steps active={active} onStep={goTo} />
          <PreviewToggle hidden={previewHidden} visible={codeOpen} onToggle={() => showPreview(previewHidden)} />
        </div>
      </div>

      <div className="v2-rail">
        <Section id="looks" active={active} doc={guideFor(lessonFor('looks', 'tokens'))} tag="01 / Style with Mix" title="Start with your design.">
          <p>Each look gives the same tokens new values. Color, type, shape, and depth change together; the widgets stay the same.</p>
          <div className="v2-chips" role="group" aria-label="Choose a look">
            {LOOKS.map(item => <button key={item.id} type="button" aria-pressed={look === item.id} onClick={event => { chooseLook(item.id); showPreview(true, event.currentTarget); }}>
              <span className="v2-swatch" style={{ background: `linear-gradient(135deg, ${item.swatch[0]} 50%, ${item.swatch[1]} 50%)` }} />{item.name}
            </button>)}
          </div>
          {lessonFor('looks', 'tokens') === 'tokens'
            ? <TokenLesson key={lessonKey('looks')} code={code} look={look} looks={LOOKS} onLook={chooseLook} open={lesson?.chapter === 'looks'} onOpen={readCode} />
            : <FeatureLesson key={lessonKey('looks')} id={lessonFor('looks', 'tokens')} code={code} open onOpen={readCode} />}
        </Section>
        <Section id="states" active={active} doc={guideFor('states')} tag="Mix / Interaction states" title="Make it respond.">
          <p>The same style can describe resting, hover, and pressed states. The Today card shows how those states respond to input.</p>
          <FeatureLesson key={lessonKey('states')} id="states" code={code} open={lesson?.chapter === 'states'} />
        </Section>
        <Section id="adapt" active={active} doc={guideFor('layout')} tag="Flutter + Mix / Responsive layout" title="Fit the screen.">
          <p>Flutter’s <code>LayoutBuilder</code> switches to a compact deck. A Mix breakpoint changes shared card padding from 18 to 14 pixels.</p>
          <p className="v2-note v2-compact-note">On this screen you’re already seeing the compact deck.</p>
          <FeatureLesson key={lessonKey('adapt')} id="layout" code={code} open={lesson?.chapter === 'adapt'} />
        </Section>
        <Section id="motion" active={active} doc={{ href: motionDocs[motion], label: 'Animation guide' }} tag="Mix / Animation" title="Show what changed.">
          <div className="v2-motion-options" role="group" aria-label="Choose an animation">
            {MOTION.map(item => <button type="button" key={item.id} aria-pressed={motion === item.id} aria-controls="v2-motion-example" onClick={event => { setMotion(item.id); showPreview(true, event.currentTarget); }}>{item.name}</button>)}
          </div>
          <div id="v2-motion-example">
            <p>{motionExample.description}</p>
            {motion === 'transitions' && <div className="v2-motion-looks" role="group" aria-label="Change the animated look">
              {LOOKS.map(item => <button type="button" key={item.id} aria-label={`Animate to ${item.name}`} aria-pressed={look === item.id} onClick={event => { chooseLook(item.id); showPreview(true, event.currentTarget); }}><span className="v2-swatch" style={{ background: `linear-gradient(135deg, ${item.swatch[0]} 50%, ${item.swatch[1]} 50%)` }} />{item.name}</button>)}
            </div>}
            <FeatureLesson key={lessonKey('motion')} id={motion} code={code} open={lesson?.chapter === 'motion'} />
          </div>
        </Section>
        <Section id="remix" active={active} doc={guideFor(remixLesson)} tag="02 / Compose with Remix" title="Build with components.">
          <p>Remix pairs Naked UI behavior with Mix styles. The outlines identify the components already working in this interface.</p>
          <div className="v2-motion-options v2-preset-options" role="group" aria-label="Choose a component preset">
            {PRESETS.map(item => <button type="button" key={item.name} aria-pressed={preset.name === item.name} onClick={() => {
              setPreset(item);
              goTo('remix', 'today');
            }}>{item.name}</button>)}
          </div>
          <p className="v2-note">Start with your styles or Fortal, an optional starter design system installed as editable recipes. Only Today switches; the tasks keep their state.</p>
          <div className="v2-remix-styling">
            <FeatureLesson key={`${remixLesson}-${lessonKey('remix')}`} id={remixLesson} code={code} open={lesson?.chapter === 'remix'} />
            {preset.preset === 'fortal' && <details className="v2-integration-note">
              <summary>Fortal theme scope</summary>
              <p>FortalTheme supplies its own token set. It wraps one card here for comparison.</p>
              <p>In an app, place it above the Navigator so routes and overlays inherit the theme.</p>
              <Link className="v2-link" href="/remix/docs/fortal/#scope-placement">Fortal scope guide <ArrowRight /></Link>
            </details>}
          </div>
          <button className="v2-link" type="button" onClick={() => previewFeature({ chapter: 'remix', block: 'team', preset: 'custom', feature: 'overlays' })}>Try the invite <ArrowRight /></button>
          <p className="v2-note">Open Invite on Team for a dialog, email field, and confirmation toast. Demo only: nothing is sent.</p>
          <details className="v2-code v2-open-code">
            <summary>Install and edit the source <span aria-hidden="true">+</span></summary>
            <div className="v2-open-code-steps">
              <p className="v2-note">The optional CLI copies Fortal’s theme and component source into your Flutter package.</p>
              <ol>
                <li><h3>Add the CLI</h3><CopyCommand command={packages.cli.command} /></li>
                <li><h3>Initialize Fortal</h3><CopyCommand command="dart run remix_cli:remix init --prefix Fortal --preset fortal --ui-path lib/fortal" /></li>
                <li><h3>Install the recipes</h3>
                  {['checkbox', 'badge', 'card'].map(component => <CopyCommand key={component} command={`dart run remix_cli:remix add ${component}`} />)}
                </li>
              </ol>
              <p className="v2-note"><Link href="/v2/source/?file=remix.yaml">remix.yaml</Link> pins registry revision <a href={packages.registry.url}><code>{packages.registry.revision.slice(0, 12)}</code></a>. A fresh init can install newer recipes. Use <Link href="/v2/source/?file=remix.yaml">this checkout</Link> to match the demo.</p>
              <p className="v2-note"><a href={`${packages.github.files}/remix.yaml`}>View the configuration on GitHub</a> · <a href={`${packages.github.files}/lib/fortal/components/checkbox.dart`}>View the installed checkbox on GitHub</a>{!packages.github.pinned && ' (reference only; this working copy is not pinned)'}</p>
              <CodeExample entry={code['fortal-checkbox']} />
              <p className="v2-note"><code>@MixWidget</code> generates the <code>FortalCheckbox</code> wrapper. After editing an annotated recipe, run <code>dart run build_runner build --delete-conflicting-outputs</code>.</p>
              <ul className="v2-widgets" aria-label="Open code guides">
                <li><Link href="/remix/docs/open-code/">Open code</Link></li>
                <li><Link href="/remix/docs/fortal/">Fortal</Link></li>
                <li><Link href="/remix/docs/guides/registries/">Registries</Link></li>
                <li><Link href="/remix/docs/agent/composer/">Agent surfaces</Link></li>
              </ul>
            </div>
          </details>
          <ul className="v2-widgets" aria-label="Explore Remix components">
            {WIDGETS.map(([name, slug]) => <li key={slug}><Link href={`/remix/docs/components/${slug}/`}>{name}</Link></li>)}
          </ul>
          <p className="v2-note" id="v2-remix-groups">Also in Remix</p>
          <ul className="v2-widgets" aria-labelledby="v2-remix-groups">
            {REMIX_GROUPS.map(([name, path]) => <li key={path}><Link href={`/remix/docs/${path}/`}>{name}</Link></li>)}
          </ul>
        </Section>
        <Section id="naked" active={active} doc={guideFor('naked')} tag="03 / Build on Naked UI" title="Own the rendering.">
          <p>Now the task rows and player buttons use Naked UI directly. It supplies interaction state; the app supplies the rendering and values.</p>
          <FeatureLesson key={lessonKey('naked')} id="naked" code={code} open={lesson?.chapter === 'naked'} />
          <button className="v2-link" type="button" onClick={() => previewFeature({ chapter: 'naked', block: 'team' })}>Try the Naked invite <ArrowRight /></button>
          <p className="v2-note">Open the same invite with bare rendering. Tab stays inside, Escape closes it, and this demo returns focus to Invite. Demo only: nothing is sent.</p>
          <CodeExample entry={code['naked-invite']} collapsible />
        </Section>
        <Section id="blocks" active={active} doc={{ href: '/v2/source/', label: 'Explore the showcase source' }} tag="The interface, together" title="Explore the parts.">
          <p>Inspect any card from the same interface. Each one shares the design tokens and local state you just explored.</p>
          <div className="v2-blocks" role="group" aria-label="Choose an example">
            {BLOCKS.map(item => <button key={item.id} type="button" aria-pressed={block === item.id} onClick={event => { setBlock(item.id); showPreview(true, event.currentTarget); }}>
              <span><strong>{item.name}</strong><span>{item.note}</span></span><ArrowRight />
            </button>)}
          </div>
        </Section>
      </div>
    </div>

    <Features onPreview={previewFeature} />

    <section className="v2-end" aria-labelledby="v2-start">
      <div className="v2-end-intro"><h2 id="v2-start">Take it into your app.</h2><p>Start with the layer you need: Mix for styling, Remix for components, or Naked UI for behavior.</p><p>{packages.requirements}</p></div>
      <div className="v2-end-grid">
        <article>
          <Library role="Styling" version={packages.libraries.mix.version} /><h3>Mix</h3><p>Tokens, variants, and animation.<br />One expressive styling language.</p>
          <CopyCommand command={packages.libraries.mix.command} />
          <Link className="v2-link" href="/mix/docs/overview/getting-started/#installation">Start with Mix <ArrowRight /></Link>
        </article>
        <article>
          <Library role="Components" version={packages.libraries.remix.version} /><h3>Remix</h3><p>Remix brings Mix and Naked UI with it.<br />Style the components your way.</p>
          <CopyCommand command={packages.libraries.remix.command} />
          <Link className="v2-link" href="/remix/docs/getting-started/#your-first-component">Start with Remix <ArrowRight /></Link>
          <p className="v2-end-example">Example: <Link href="/remix/docs/components/checkbox/#basic-implementation">Remix checkbox</Link></p>
        </article>
        <article>
          <Library role="Behavior" version={packages.libraries.naked_ui.version} /><h3>Naked UI</h3><p>Headless, interactive primitives.<br />Your widgets. Your visual choices.</p>
          <CopyCommand command={packages.libraries.naked_ui.command} />
          <Link className="v2-link" href="/naked-ui/docs/#basic-implementation">Start with Naked UI <ArrowRight /></Link>
          <p className="v2-end-example">Example: <Link href="/naked-ui/docs/widget/checkbox/#basic-implementation">NakedCheckbox</Link></p>
        </article>
      </div>
      <p className="v2-features-source"><Link href="/v2/source/?file=pubspec.yaml">Run this showcase locally <ArrowRight /></Link></p>
      <footer className="v2-footer"><span>Built with Mix, Remix, and Naked UI.</span><a href="https://github.com/btwld">Open source on GitHub <ArrowRight /></a></footer>
    </section>
  </div>;
}
