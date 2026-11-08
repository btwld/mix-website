'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowRight } from '@/components/landing/icons';
import { CopyCommand } from '@/components/landing/copy-command';
import type { ShowcaseCode, ShowcasePackage } from '@/lib/showcase-source';
import { Stage, useShowcase } from './stage';
import { CodeExample } from './code-example';
import { Features, motionDocs, type FeaturePreview, type MotionMode } from './features';

const LOOKS = [
  { id: 'midnight', name: 'Midnight', swatch: ['#0d0b14', '#8b5cf6'] },
  { id: 'paper', name: 'Paper', swatch: ['#f3ede1', '#b03a23'] },
  { id: 'pop', name: 'Pop', swatch: ['#ffd83d', '#2540ff'] },
  { id: 'cyber', name: 'Cyber', swatch: ['#04120b', '#2bff88'] },
];
const TOUR_LOOKS = ['paper', 'pop', 'cyber', 'midnight'];
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
  { id: 'appearance', name: 'Appearance', note: 'Change the cards’ accent, corners, and shadows.' },
  { id: 'team', name: 'Team', note: 'Try an invite interaction with local sample data.' },
];
const MOTION: { id: MotionMode; name: string; description: string; instruction: string }[] = [
  { id: 'transitions', name: 'Transitions', description: 'A new look changes the target values. One .animate() call lets the cards’ surface and shape flow into place.', instruction: 'Choose a look to see the transition.' },
  { id: 'springs', name: 'Springs', description: 'The same animation API can use spring motion. Spending’s bars settle into their new heights when the data changes.', instruction: 'Switch This week and Last week in the card.' },
  { id: 'keyframes', name: 'Keyframes', description: 'For a repeating sequence, define a timeline. The player’s equalizer moves through height keyframes, all within its style.', instruction: 'Use Play and Pause in the card. No audio is played; the equalizer stays still with reduced motion.' },
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
  const root = useRef<HTMLDivElement>(null);
  const picked = useRef(false);
  const { ready, missing, mount, send } = useShowcase();

  const goTo = useCallback((chapter: Chapter, focus?: string) => {
    const compact = matchMedia('(max-width: 62rem)').matches;
    if (compact && chapter === 'adapt') chapter = 'looks';
    const target = root.current?.querySelector<HTMLElement>(`[data-chapter="${chapter}"]`);
    if (!target) return;
    setChapterFocus(focus ? { chapter, block: focus } : null);
    const stage = root.current?.querySelector('.v2-stage-column')?.getBoundingClientRect();
    // Tall desktop chapters anchor below the fixed nav; shorter ones stay centered.
    const offset = chapter === 'hero' ? 0 : compact ? innerHeight <= 600 ? 88 : (stage?.height ?? 0) + 88 : chapter === 'looks' ? 116 : Math.max(116, innerHeight / 2 - target.offsetHeight / 2);
    scrollTo({ top: Math.max(0, scrollY + target.getBoundingClientRect().top - offset), behavior: 'instant' });
    setActive(chapter);
    // Explicit navigation can reselect the active chapter after browsing Features.
    const hash = chapter === 'hero' ? '' : `#v2-${chapter}`;
    if (location.hash !== hash) history.replaceState(history.state, '', `${location.pathname}${location.search}${hash}`);
  }, []);

  // Follow a reading line below the pinned demo on compact screens. Recalculate
  // on resize as well as scroll, so rotating a device cannot strand the chapter.
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const compact = matchMedia('(max-width: 62rem)').matches;
      const stage = root.current?.querySelector('.v2-stage-column')?.getBoundingClientRect();
      const line = compact && innerHeight > 600 ? Math.min(innerHeight - 40, (stage?.bottom ?? 0) + 64) : innerHeight * .5;
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
      const progress = Math.min(.999, Math.max(0, (120 - top) / Math.max(1, height - innerHeight)));
      const next = TOUR_LOOKS[Math.floor(progress * TOUR_LOOKS.length)];
      setLook(next);
    };
    follow();
    addEventListener('scroll', follow, { passive: true });
    return () => removeEventListener('scroll', follow);
  }, [active, ready]); // eslint-disable-line react-hooks/exhaustive-deps

  // A choice stays made: scrolling back through Looks must not replace it.
  const chooseLook = (id: string) => { picked.current = true; setLook(id); };
  const previewFeature = ({ chapter, motion, look, block }: FeaturePreview) => {
    if (motion) setMotion(motion);
    if (look) chooseLook(look);
    if (block) setBlock(block);
    goTo(chapter, block);
    const target = chapter === 'adapt' && matchMedia('(max-width: 62rem)').matches ? 'looks' : chapter;
    root.current?.querySelector<HTMLElement>(`#v2-title-${target}`)?.focus({ preventScroll: true });
  };
  const chapter = STEPS.find(step => step.id === active);
  const motionExample = MOTION.find(item => item.id === motion)!;

  return <div className="lx project-mix v2" data-layer={LAYER[active]} ref={root} id="v2-content">
    <div className="v2-tour">
      <header className="v2-hero" data-chapter="hero">
        <h1>Flutter UI,<br />your way.</h1>
        <p className="v2-lead">Style with Mix. Compose with Remix. Build on Naked UI. Three open-source libraries, one expressive Flutter stack.</p>
        <div className="v2-cta">
          <button className="lx-btn lx-btn-primary" type="button" onClick={() => goTo('looks')}>Explore the showcase <ArrowRight /></button>
          <a className="lx-btn lx-btn-secondary" href="#v2-features">Features &amp; code</a>
        </div>
        <div className="v2-stack" aria-label="The Flutter UI stack">
          <a href="#v2-looks" onClick={event => { event.preventDefault(); goTo('looks'); }}><strong>Mix</strong><span>Define the style</span><ArrowRight /></a>
          <a href="#v2-remix" onClick={event => { event.preventDefault(); goTo('remix'); }}><strong>Remix</strong><span>Compose the interface</span><ArrowRight /></a>
          <a href="#v2-naked" onClick={event => { event.preventDefault(); goTo('naked'); }}><strong>Naked UI</strong><span>Start with behavior</span><ArrowRight /></a>
        </div>
        <p className="v2-hint">Real Flutter, running right here.<br />Try the controls, then scroll to see how it’s built.</p>
      </header>

      <div className="v2-stage-column">
        <div className="v2-stage-caption"><span>{chapter ? `${chapter.group} / ${chapter.name}` : 'Interactive Flutter showcase'}</span><span>{active === 'naked' ? 'Unstyled' : LOOKS.find(item => item.id === look)?.name}</span></div>
        <Stage mount={mount} ready={ready} missing={missing} />
        <Steps active={active} onStep={goTo} />
      </div>

      <div className="v2-rail">
        <Section id="looks" active={active} doc={{ href: '/mix/docs/guides/design-token/#mixscope', label: 'Explore design tokens' }} tag="Mix / Design tokens" title="Same widgets. A whole new feel.">
          <p>Color, typography, shape, and depth — one set of tokens changes them together. Scroll through four looks, or pick your own.</p>
          <div className="v2-chips" role="group" aria-label="Choose a look">
            {LOOKS.map(item => <button key={item.id} type="button" aria-pressed={look === item.id} onClick={() => chooseLook(item.id)}>
              <span className="v2-swatch" style={{ background: `linear-gradient(135deg, ${item.swatch[0]} 50%, ${item.swatch[1]} 50%)` }} />{item.name}
            </button>)}
          </div>
          <CodeExample entry={code[look]} collapsible />
        </Section>
        <Section id="states" active={active} doc={{ href: '/mix/docs/guides/dynamic-styling/#interaction', label: 'Explore state variants' }} tag="Mix / Interaction states" title="Style the interaction, too.">
          <p>Hover or press a task, or Tab to its checkbox. Mix keeps the visual response in the style, alongside its resting appearance.</p>
          <CodeExample entry={code.states} collapsible />
        </Section>
        <Section id="adapt" active={active} doc={{ href: '/mix/docs/guides/dynamic-styling/#breakpoint', label: 'Explore breakpoints' }} tag="Same styles / Responsive layout" title="Less room. Still your design.">
          <p>Flutter’s <code>LayoutBuilder</code> switches the deck when space gets tight. A Mix breakpoint tightens the shared card padding.</p>
          <CodeExample entry={code.adapt} collapsible />
        </Section>
        <Section id="motion" active={active} doc={{ href: motionDocs[motion], label: 'Explore animation' }} tag="Mix / Animation" title="Give your styles a little life.">
          <div className="v2-motion-options" role="group" aria-label="Choose an animation">
            {MOTION.map(item => <button type="button" key={item.id} aria-pressed={motion === item.id} aria-controls="v2-motion-example" onClick={() => setMotion(item.id)}>{item.name}</button>)}
          </div>
          <div id="v2-motion-example">
            <p>{motionExample.description}</p>
            {motion === 'transitions' && <div className="v2-motion-looks" role="group" aria-label="Change the animated look">
              {LOOKS.map(item => <button type="button" key={item.id} aria-label={`Animate to ${item.name}`} aria-pressed={look === item.id} onClick={() => chooseLook(item.id)}><span className="v2-swatch" style={{ background: `linear-gradient(135deg, ${item.swatch[0]} 50%, ${item.swatch[1]} 50%)` }} />{item.name}</button>)}
            </div>}
            <p className="v2-note">{motionExample.instruction}</p>
            <CodeExample entry={code[motion]} collapsible />
          </div>
        </Section>
        <Section id="remix" active={active} doc={{ href: '/remix/docs/styler-api/#variants-and-selected-state', label: 'Build with Remix' }} tag="Remix / Components" title="Your components. Your design language.">
          <p>The outlines reveal Remix widgets. They combine Naked UI behavior with Mix styling, so buttons, sliders, and checkboxes can speak the same visual language.</p>
          <p>Choose Invite on the Team card to try a dialog, email field, and confirmation toast. Demo only: nothing is sent.</p>
          <button className="v2-link" type="button" onClick={() => previewFeature({ chapter: 'remix', block: 'team' })}>Try the invite <ArrowRight /></button>
          <ul className="v2-widgets" aria-label="Explore Remix components">
            {WIDGETS.map(([name, slug]) => <li key={slug}><Link href={`/remix/docs/components/${slug}/`}>{name}</Link></li>)}
          </ul>
          <p className="v2-note" id="v2-remix-groups">Also in Remix</p>
          <ul className="v2-widgets" aria-labelledby="v2-remix-groups">
            {REMIX_GROUPS.map(([name, path]) => <li key={path}><Link href={`/remix/docs/${path}/`}>{name}</Link></li>)}
          </ul>
          <CodeExample entry={code.remix} collapsible />
        </Section>
        <Section id="naked" active={active} doc={{ href: '/naked-ui/docs/widget/checkbox/#basic-implementation', label: 'Build with Naked UI' }} tag="Naked UI / Behavior" title="Take away the style. Keep the interaction.">
          <p>The task rows and player buttons now use Naked UI directly. Naked UI handles interaction and its states (hover, focus, press); the app keeps the value.</p>
          <p className="v2-note">Try a task, or focus it and press Space. Its checked state stays the same when the styling returns.</p>
          <CodeExample entry={code.naked} collapsible />
          <button className="v2-link" type="button" onClick={() => previewFeature({ chapter: 'naked', block: 'team' })}>Try the Naked invite <ArrowRight /></button>
          <p className="v2-note">Choose Invite on Team to open the bare Naked UI dialog. Tab stays inside, Escape closes it, and focus returns to Invite. Demo only: nothing is sent.</p>
          <CodeExample entry={code['naked-invite']} collapsible />
        </Section>
        <Section id="blocks" active={active} doc={{ href: '/v2/source/', label: 'Explore the showcase source' }} tag="The stack, together" title="Small pieces. Real possibilities.">
          <p>Explore each card on its own. These examples share the same tokens, styles, and local state.</p>
          <div className="v2-blocks" role="group" aria-label="Choose an example">
            {BLOCKS.map(item => <button key={item.id} type="button" aria-pressed={block === item.id} onClick={() => setBlock(item.id)}>
              <span><strong>{item.name}</strong><span>{item.note}</span></span><ArrowRight />
            </button>)}
          </div>
          <p className="v2-note">Demo data only. Nothing is sent or saved to a server.</p>
        </Section>
      </div>
    </div>

    <Features code={code} onPreview={previewFeature} />

    <section className="v2-end" aria-labelledby="v2-start">
      <div className="v2-end-intro"><h2 id="v2-start">One stack.<br />Start where you need.</h2><p>Use Mix to style your widgets, Remix for ready-to-style components, or Naked UI when you want to build from behavior up.</p><p>{packages.requirements}</p></div>
      <div className="v2-end-grid">
        <article>
          <p className="v2-library-role">Styling</p><h3>Mix</h3><p>Tokens, variants, and animation.<br />One expressive styling language.</p>
          <CopyCommand command={packages.libraries.mix.command} />
          <Link className="v2-link" href="/mix/docs/overview/getting-started/#installation">Start with Mix <ArrowRight /></Link>
        </article>
        <article>
          <p className="v2-library-role">Components</p><h3>Remix</h3><p>Remix brings Mix and Naked UI with it.<br />Style the components your way.</p>
          <CopyCommand command={packages.libraries.remix.command} />
          <Link className="v2-link" href="/remix/docs/getting-started/#installation">Start with Remix <ArrowRight /></Link>
        </article>
        <article>
          <p className="v2-library-role">Behavior</p><h3>Naked UI</h3><p>Headless, interactive primitives.<br />Your widgets. Your visual choices.</p>
          <CopyCommand command={packages.libraries.naked_ui.command} />
          <Link className="v2-link" href="/naked-ui/docs/#installation">Start with Naked UI <ArrowRight /></Link>
        </article>
      </div>
      <footer className="v2-footer"><span>Built with Mix, Remix, and Naked UI.</span><a href="https://github.com/btwld">Open source on GitHub <ArrowRight /></a></footer>
    </section>
  </div>;
}
