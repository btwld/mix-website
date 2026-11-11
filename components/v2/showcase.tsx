'use client';

import Link from 'next/link';
import { Children, useEffect, useId, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { ArrowRight } from '@/components/landing/icons';
import { CopyCommand } from '@/components/landing/copy-command';
import type { ShowcaseCode, ShowcasePackage } from '@/lib/showcase-source';
import { ShowcaseProvider, useDemoControls, useDemoEvent, useDemoListener, useShowcase } from './flutter';
import { Bench, Code, DocLink, Heading, Notes, Preview, Segmented, THEMES, ThemeContext, ThemePicker, fileNames, useTheme, type ThemeId } from './ui';

type Props = { code: ShowcaseCode; packages: ShowcasePackage };

/** The page: one reading order from what the libraries are to installing them. */
export function Showcase({ code, packages }: Props) {
  return <ShowcaseProvider>
    <Themed>
      <Hero code={code} />
      <Stack />
      <section className="v2-part" id="mix" data-tone="mix" aria-labelledby="mix-title">
        <Heading id="mix" level={2} kicker="Mix · Styling" title="A style is a value.">
          <p>You build a Mix style with a chain of calls, keep it in a variable, and hand it to a widget. Because it is an ordinary value, you can share it between widgets, derive new styles from it, and merge two together.</p>
        </Heading>
        <nav className="v2-index" aria-label="Mix examples">
          {[['mix-style', 'Compose'], ['mix-states', 'States'], ['mix-responsive', 'Breakpoints'], ['mix-motion', 'Motion'], ['mix-tokens', 'Tokens']].map(([id, name], index) => <a key={id} href={`#${id}`}><span>{index + 1}</span>{name}</a>)}
        </nav>
        <StyleExhibit code={code} />
        <StatesExhibit code={code} />
        <ResponsiveExhibit code={code} />
        <MotionExhibit code={code} />
        <TokensExhibit code={code} />
      </section>
      <NakedPart code={code} />
      <RemixPart code={code} packages={packages} />
      <Start code={code} packages={packages} />
    </Themed>
  </ShowcaseProvider>;
}

/** The theme the Tokens example shows, in its view and in step 2 of its code. */
function Themed({ children }: { children: ReactNode }) {
  const { send, connected } = useShowcase();
  const [theme, setTheme] = useState<ThemeId>('midnight');
  useEffect(() => { send({ theme }); }, [theme, send, connected]);
  const value = useMemo(() => ({ theme, setTheme }), [theme]);
  const canvas = THEMES.find(item => item.id === theme)!.canvas;
  return <ThemeContext.Provider value={value}>
    <div className="v2" id="v2-content" style={{ '--v2-canvas': canvas } as CSSProperties}>{children}</div>
  </ThemeContext.Provider>;
}

function Hero({ code }: { code: ShowcaseCode }) {
  const states = useDemoEvent<string[]>('button', 'states', []);
  return <section className="v2-hero" aria-labelledby="v2-hero-title">
    <div className="v2-hero-text">
      <p className="v2-kicker">Open-source UI libraries for Flutter</p>
      <h1 id="v2-hero-title">Build your Flutter design system from three libraries.</h1>
      <p className="v2-hero-lede"><strong>Mix</strong> is a styling system: a style is a Dart value with interaction states, breakpoints, motion and tokens in one chain. <strong>Naked UI</strong> supplies behavior and accessibility with nothing drawn. <strong>Remix</strong> joins the two into components you install as source, compose, and edit as your own.</p>
      <div className="v2-cta">
        <a className="v2-button" data-kind="primary" href="#mix">Read the examples <ArrowRight /></a>
        <a className="v2-button" href="#start">Install</a>
      </div>
    </div>
    <Bench files={fileNames(code['button-style'], code['button-widget'])} id="hello">
      <Code tabs tone="mix" active={states} dim segments={[
        { excerpt: code['button-style'] },
        { excerpt: code['button-widget'] },
      ]} />
      <Side>
        <Preview demo="button" tag label="Live Flutter example: a styled button" hint={<><span className="v2-hint-pointer">Hover it, press it, or Tab to it.</span><span className="v2-hint-touch">Press it.</span> The line that handles each state lights up.</>} />
        <p className="v2-fineprint">This is Flutter running in your browser. Every example on this page is shown with the source it was compiled from, written with Dart’s dot shorthand: <code>.circular(12)</code> is short for <code>BorderRadiusGeometryMix.circular(12)</code>. Color names such as <code>purple</code> are constants in <Link href="/v2/source/?file=colors.dart"><code>lib/colors.dart</code></Link>. Style files start with <code>// dart format off</code>, so each call keeps its own line; the formatter would join short chains.</p>
      </Side>
    </Bench>
  </section>;
}

function Stack() {
  return <section className="v2-part v2-stack" id="stack" aria-labelledby="stack-title">
    <Heading id="stack" level={2} kicker="How they fit" title="Three layers. Use one, or all of them.">
      <p>Mix and Naked UI do not depend on each other. Remix depends on both, and re-exports Mix.</p>
    </Heading>
    <div className="v2-layers">
      <a className="v2-layer" data-tone="remix" data-row="top" href="#remix">
        <span className="v2-layer-role">Components</span><strong>Remix</strong>
        <p>Button, select, dialog, tabs and about thirty more. The interactive ones are Naked UI behavior drawn with a Mix style. You install them as source, so the styles are yours to edit.</p>
      </a>
      <a className="v2-layer" data-tone="mix" href="#mix">
        <span className="v2-layer-role">Styling</span><strong>Mix</strong>
        <p>Chain a style, add states and breakpoints, animate the changes, and name its values with tokens.</p>
      </a>
      <a className="v2-layer" data-tone="naked" href="#naked">
        <span className="v2-layer-role">Behavior</span><strong>Naked UI</strong>
        <p>Keyboard, focus, semantics and overlays for common controls. You return the widgets that get drawn.</p>
      </a>
      <div className="v2-layer" data-row="base">
        <span className="v2-layer-role">Underneath</span><strong>Flutter</strong>
        <p>Widgets, layout and rendering, unchanged.</p>
      </div>
    </div>
    <dl className="v2-choose">
      <div><dt>Styling is scattered through your <code>build</code> methods</dt><dd><a href="#mix">Start with Mix <ArrowRight /></a></dd></div>
      <div><dt>You need a custom control that works with a keyboard and a screen reader</dt><dd><a href="#naked">Start with Naked UI <ArrowRight /></a></dd></div>
      <div><dt>You want working components now, in your own visual language</dt><dd><a href="#remix">Start with Remix <ArrowRight /></a></dd></div>
    </dl>
  </section>;
}

/**
 * The column beside the code. The live view stays in sight while long code
 * scrolls past; whatever follows it scrolls within the space left, so nothing
 * is held out of reach on a short screen.
 */
function Side({ children }: { children: ReactNode }) {
  const [view, ...rest] = Children.toArray(children);
  return <div className="v2-bench-side">{view}<div className="v2-bench-rest">{rest}</div></div>;
}

function Exhibit({ id, children }: { id: string; children: ReactNode }) {
  return <article className="v2-exhibit" id={id} aria-labelledby={`${id}-title`}>{children}</article>;
}

function StyleExhibit({ code }: { code: ShowcaseCode }) {
  const [featured, setFeatured] = useState<'Starter' | 'Pro'>('Pro');
  useDemoListener<'Starter' | 'Pro'>('style', 'featured', setFeatured);
  useDemoControls('style', { featured });
  return <Exhibit id="mix-style">
    <Heading id="mix-style" kicker="Mix · 1 of 5" title="Declare a style once, then derive the rest.">
      <p><code>card</code> is the base. <code>featured</code> starts from it, merges in a shared <code>lifted</code> fragment, and restates only the border. The widget picks one of the two values and calls it.</p>
    </Heading>
    <Bench files={fileNames(code['style-styles'], code['style-widget'])}>
      <Code tabs tone="mix" active={['featured']} segments={[
        { excerpt: code['style-styles'] },
        { excerpt: code['style-widget'] },
      ]} />
      <Side>
        <Preview demo="style" label="Live Flutter example: two plan cards, one featured">
          <Segmented label="Featured plan" value={featured} onChange={setFeatured} options={[{ id: 'Starter', name: 'Starter' }, { id: 'Pro', name: 'Pro' }]} />
          <p className="v2-control-note">The highlighted lines are everything <code>featured</code> adds.</p>
        </Preview>
        <Notes>
          <li>Calling a style builds its widget: <code>card(children: …)</code> is a <code>FlexBox</code>, a column and its <code>Container</code> in one, and <code>planName('Pro')</code> is a <code>StyledText</code>.</li>
          <li>Later calls win, field by field. <code>featured</code> changes the border’s color and keeps its width, along with the padding, fill and radius from <code>card</code>.</li>
          <li><code>merge</code> combines two styles. Use it for fragments, like <code>lifted</code>, that several components share.</li>
        </Notes>
        <DocLink href="/mix/docs/guides/styling/#style-composition-and-override">Composition in the styling guide</DocLink>
      </Side>
    </Bench>
  </Exhibit>;
}

function TokensExhibit({ code }: { code: ShowcaseCode }) {
  const { theme } = useTheme();
  const name = THEMES.find(item => item.id === theme)!.name;
  return <Exhibit id="mix-tokens">
    <Heading id="mix-tokens" kicker="Mix · 5 of 5" title="Name a value once. Change it everywhere.">
      <p>The examples so far used fixed colors. A token is a typed name: a style refers to it with a call, <code>$primary()</code>, and the nearest <code>MixScope</code> supplies the value when the widget builds. Give the scope different values and every style under it follows.</p>
    </Heading>
    <Bench files={['Code']}>
      <Code tone="mix" active={['token']} segments={[
        { excerpt: code['tokens-declare'], title: '1. Declare the names' },
        { excerpt: code[`theme-${theme}`], title: `2. Give them values: ${name}` },
        { excerpt: code['tokens-scope'], title: '3. Provide the values' },
        { excerpt: code['tokens-use'], title: '4. Use the names' },
      ]} />
      <Side>
        <Preview demo="tokens" label="Live Flutter example: a plan card and button in the selected theme">
          <ThemePicker label="Theme" names />
          <p className="v2-control-note">Only step 2 changes. The four themes differ in color, corner radius, spacing and typeface.</p>
        </Preview>
        <Notes>
          <li>The <code>$</code> is a naming convention for token variables, not syntax. The call is what matters: <code>$primary()</code> returns a reference that is resolved later, not a color.</li>
          <li>Text styles pass through <code>.mix()</code>: <code>.style($label.mix())</code>.</li>
          <li>A nested <code>MixScope</code> replaces the outer one. To override a few tokens and keep the rest, use <code>MixScope.inherit</code>.</li>
        </Notes>
        <DocLink href="/mix/docs/guides/design-token/">Design tokens guide</DocLink>
      </Side>
    </Bench>
  </Exhibit>;
}

function StatesExhibit({ code }: { code: ShowcaseCode }) {
  const [hold, setHold] = useState<string[]>([]);
  const [enabled, setEnabled] = useState(true);
  const live = useDemoEvent<string[]>('states', 'states', []);
  useDemoControls('states', { hold, enabled });
  const active = [...new Set([...live, ...(enabled ? [] : ['disabled']), ...(hold.length ? ['controller'] : [])])];
  return <Exhibit id="mix-states">
    <Heading id="mix-states" kicker="Mix · 2 of 5" title="Interaction states belong to the style.">
      <p><code>onHovered</code>, <code>onPressed</code>, <code>onFocusVisible</code> and <code>onDisabled</code> each take the changes for one state. <code>.pressable()</code> adds the gestures, focus and button semantics.</p>
    </Heading>
    <Bench files={fileNames(code['states-style'], code['states-widget'])}>
      <Code tabs tone="mix" active={active} dim segments={[
        { excerpt: code['states-style'] },
        { excerpt: code['states-widget'] },
      ]} />
      <Side>
        <Preview demo="states" label="Live Flutter example: a button that shows its interaction states">
          <div className="v2-toggles" role="group" aria-label="Hold a state on">
            {(['hovered', 'pressed', 'focused'] as const).map(state => <button key={state} type="button" aria-pressed={hold.includes(state)} data-live={live.includes(state) || undefined}
              onClick={() => setHold(current => current.includes(state) ? current.filter(item => item !== state) : [...current, state])}>
              <i />{state === 'focused' ? 'Focused' : state === 'hovered' ? 'Hovered' : 'Pressed'}
            </button>)}
            <label className="v2-check"><input type="checkbox" checked={!enabled} onChange={event => setEnabled(!event.target.checked)} /><span>Disabled</span></label>
          </div>
          <p className="v2-control-note">Use the button, or hold a state on. A lit dot is a state Flutter reports right now.</p>
        </Preview>
        <Notes>
          <li>Hover and press work on any <code>Box</code>. Focus and disabled need a pressable ancestor, which <code>.pressable()</code> creates.</li>
          <li><code>onFocusVisible</code> stops applying after a click or tap, until the next key press, so a pointer does not leave a focus ring behind. <code>onFocused</code> applies to every kind of focus.</li>
          <li><code>actionLabel</code> is the <code>label</code> style from the first example with one line added. Pass a <code>WidgetStatesController</code> to read states or set them; the toggles above use one.</li>
        </Notes>
        <DocLink href="/mix/docs/guides/dynamic-styling/#interaction">Interaction variants</DocLink>
      </Side>
    </Bench>
  </Exhibit>;
}

const BREAKPOINT = 520;
const WIDTHS = [{ id: 360, name: '360 px' }, { id: 600, name: '600 px' }, { id: 840, name: '840 px' }] as const;

function ResponsiveExhibit({ code }: { code: ShowcaseCode }) {
  const [width, setWidth] = useState(600);
  useDemoControls('responsive', { width });
  const compact = width <= BREAKPOINT;
  const slider = useId();
  return <Exhibit id="mix-responsive">
    <Heading id="mix-responsive" kicker="Mix · 3 of 5" title="Breakpoints go in the same chain.">
      <p><code>onBreakpoint</code> swaps values while the screen is {BREAKPOINT} logical pixels wide or less. Here the plan cards from the first Mix example sit in a grid that goes from three columns to one.</p>
    </Heading>
    <Bench files={fileNames(code['responsive-style'], code['responsive-widget'])}>
      <Code tabs tone="mix" active={compact ? ['compact'] : []} segments={[
        { excerpt: code['responsive-style'] },
        { excerpt: code['responsive-widget'] },
      ]} />
      <Side>
        <Preview demo="responsive" label="Live Flutter example: a plan list that changes layout at a breakpoint">
          <div className="v2-range">
            <label htmlFor={slider}>Screen width</label>
            <output className="v2-readout" htmlFor={slider} aria-live="polite"><strong>{width}</strong> px · {compact ? 'compact' : 'wide'}</output>
            <input id={slider} type="range" min={300} max={1000} step={10} value={width} onChange={event => setWidth(Number(event.target.value))} aria-valuetext={`${width} pixels, ${compact ? 'compact' : 'wide'} layout`} />
          </div>
          <div className="v2-presets" role="group" aria-label="Set a width">
            {WIDTHS.map(item => <button key={item.id} type="button" aria-pressed={width === item.id} onClick={() => setWidth(item.id)}>{item.name}</button>)}
          </div>
          <p className="v2-control-note">The <code>onBreakpoint</code> calls light up while they are in effect. Wider screens are drawn smaller to fit.</p>
        </Preview>
        <Notes>
          <li><code>onBreakpoint</code> reads the screen size from <code>MediaQuery</code>. The preview sets that size to the width you choose, so the styles respond as they would on a screen that wide.</li>
          <li><code>onBreakpoint</code> works on any style, not only a grid: padding, type size and alignment can change the same way. <code>onMobile</code>, <code>onTablet</code> and <code>onDesktop</code> are built in. By default they cover up to 767, 768 to 1023, and 1024 up.</li>
          <li>A grid can also follow the width its parent offers instead of the screen’s: <code>onConstraints(.maxWidth(520), …)</code>.</li>
        </Notes>
        <DocLink href="/mix/docs/guides/dynamic-styling/#breakpoint">Breakpoint variants</DocLink>
      </Side>
    </Bench>
  </Exhibit>;
}

const MOTION = [
  { id: 'implicit', name: 'animate()' },
  { id: 'phases', name: 'Phases' },
  { id: 'keyframes', name: 'Keyframes' },
] as const;
const MOTION_FILES = {
  implicit: ['motion-implicit-style', 'motion-implicit-widget'],
  phases: ['motion-phases-style', 'motion-phases-widget'],
  keyframes: ['motion-keyframes-style', 'motion-keyframes-widget'],
} as const;
const CURVES = [{ id: 'ease', name: 'Ease out' }, { id: 'spring', name: 'Spring' }, { id: 'bouncy', name: 'Bouncy spring' }] as const;

function MotionExhibit({ code }: { code: ShowcaseCode }) {
  const [mode, setMode] = useState<(typeof MOTION)[number]['id']>('implicit');
  const [curve, setCurve] = useState<(typeof CURVES)[number]['id']>('spring');
  useDemoControls('motion', { mode, curve });
  return <Exhibit id="mix-motion">
    <Heading id="mix-motion" kicker="Mix · 4 of 5" title="Motion is one more call.">
      <p>A style can animate in three ways. <code>animate</code> eases between values whenever they change. A phase animation steps through named phases. A keyframe animation runs several tracks on one timeline.</p>
    </Heading>
    <Bench files={MOTION_FILES[mode].map(key => code[key].file.split('/').pop()!)}>
      <div className="v2-bench-main">
        <Segmented label="Kind of animation" hideLabel value={mode} onChange={setMode} options={MOTION} />
        {mode === 'implicit' && <Code tabs tone="mix" active={[curve, 'animate']} segments={[{ excerpt: code['motion-implicit-style'] }, { excerpt: code['motion-implicit-widget'] }]} />}
        {mode === 'phases' && <Code tabs tone="mix" active={['phases']} segments={[{ excerpt: code['motion-phases-style'] }, { excerpt: code['motion-phases-widget'] }]} />}
        {mode === 'keyframes' && <Code tabs tone="mix" active={['keyframes']} segments={[{ excerpt: code['motion-keyframes-style'] }, { excerpt: code['motion-keyframes-widget'] }]} />}
      </div>
      <Side>
        <Preview demo="motion" label={`Live Flutter example: ${mode === 'implicit' ? 'an animated switch' : mode === 'phases' ? 'a button with a phase animation' : 'a bell with a keyframe animation'}`}
          hint={mode === 'implicit' ? 'Tap the switch. Then change the config and tap again.' : mode === 'phases' ? 'Press the button.' : 'Press the bell.'}>
          {mode === 'implicit' && <Segmented label="Animation config" value={curve} onChange={setCurve} options={CURVES} />}
          
        </Preview>
        {mode === 'implicit' && <Notes>
          <li>The style never says “animate the thumb”. It states the alignment and color for each value of <code>on</code>, and <code>animate</code> covers the change.</li>
          <li>A spring has a duration and a bounce. <code>bounce: 0.6</code> overshoots; <code>0</code> settles without it.</li>
          <li>Combined with states, this is how a hover or press eases: <code>.onPressed(.scale(0.95)).animate(…)</code>.</li>
        </Notes>}
        {mode === 'phases' && <Notes>
          <li><code>button</code> is the style from the top of the page. Each change of <code>presses</code> plays the phases on it once: rest, squeeze, release, and back to rest.</li>
          <li><code>styleBuilder</code> returns the style for a phase. <code>configBuilder</code> returns the timing for reaching it.</li>
          <li>Leave out <code>trigger</code> and the phases loop.</li>
        </Notes>}
        {mode === 'keyframes' && <Notes>
          <li>The two tracks, <code>angle</code> and <code>scale</code>, run in parallel. Segments within a track run in sequence, each with its own easing.</li>
          <li><code>styleBuilder</code> reads the current values and returns a style, so a track can drive any property.</li>
          <li>No <code>AnimationController</code> and no ticker in the widget: the timeline is part of the style.</li>
        </Notes>}
        <DocLink href={`/mix/docs/guides/animations/${mode === 'implicit' ? '#implicit-animations' : mode === 'phases' ? '#phase-animations' : '#keyframe-animations'}`}>Animations guide</DocLink>
      </Side>
    </Bench>
  </Exhibit>;
}

const NAKED_WIDGETS = [{ id: 'radio', name: 'Radio group' }, { id: 'select', name: 'Select' }] as const;
const NAKED_DOCS = ['Button', 'Checkbox', 'Menu', 'Tabs', 'Slider', 'Dialog', 'Tooltip', 'Popover'];

function Keys({ children }: { children: ReactNode }) {
  return <div className="v2-keys">
    <p className="v2-keys-title">Handled by the widget, not by this code</p>
    <dl>{children}</dl>
  </div>;
}

function NakedPart({ code }: { code: ShowcaseCode }) {
  const [widget, setWidget] = useState<(typeof NAKED_WIDGETS)[number]['id']>('radio');
  useDemoControls('naked', { widget });
  const plan = useDemoEvent('naked', 'plan', 'Pro');
  const cycle = useDemoEvent('naked', 'cycle', 'Monthly');
  return <section className="v2-part" id="naked" data-tone="naked" aria-labelledby="naked-title">
    <Heading id="naked" level={2} kicker="Naked UI · Behavior" title="The behavior of a control, with nothing drawn.">
      <p>Mix covers how a widget looks. Naked UI covers how a control behaves: it handles pointer, keyboard, focus and semantics, then hands you its state. What appears on screen is whatever your builder returns, so one behavior can look like anything.</p>
    </Heading>
    <article className="v2-exhibit" aria-label="Naked UI example">
      <Bench files={widget === 'radio' ? fileNames(code['naked-radio'], code['naked-rows'], code['naked-segments']) : fileNames(code['naked-select'], code['naked-select-styles'])}>
        <div className="v2-bench-main">
          <Segmented label="Widget" hideLabel value={widget} onChange={setWidget} options={NAKED_WIDGETS} />
          {widget === 'radio' ? <Code tabs tone="naked" active={['behavior', 'yours', 'state']} segments={[
            { excerpt: code['naked-radio'] },
            { excerpt: code['naked-rows'] },
            { excerpt: code['naked-segments'] },
          ]} /> : <Code tabs tone="naked" active={['behavior', 'state']} segments={[
            { excerpt: code['naked-select'] },
            { excerpt: code['naked-select-styles'] },
          ]} />}
        </div>
        <Side>
          <Preview demo="naked" label={`Live Flutter example: ${widget === 'radio' ? 'a radio group drawn two ways' : 'a select menu'}`}>
            <p className="v2-control-note" aria-live="polite">{widget === 'radio' ? <>Both drawings are the same <code>PlanPicker</code>, sharing one selection. The group reported <strong>{plan}</strong> through <code>onChanged</code>.</> : <>The select reported <strong>{cycle}</strong> through <code>onChanged</code>.</>}</p>
          </Preview>
          {widget === 'radio' ? <Keys>
            <div><dt><kbd>Tab</kbd></dt><dd>moves focus into the group</dd></div>
            <div><dt><kbd>↑</kbd> <kbd>↓</kbd> <kbd>←</kbd> <kbd>→</kbd></dt><dd>move to the next option and select it</dd></div>
            <div><dt><kbd>Space</kbd></dt><dd>selects the focused option</dd></div>
          </Keys> : <Keys>
            <div><dt><kbd>Enter</kbd> <kbd>Space</kbd></dt><dd>open the menu, focus on the selected option</dd></div>
            <div><dt><kbd>↑</kbd> <kbd>↓</kbd> <kbd>Home</kbd> <kbd>End</kbd></dt><dd>move between options</dd></div>
            <div><dt><kbd>Esc</kbd></dt><dd>closes and returns focus to the trigger</dd></div>
            <div><dt>Click outside</dt><dd>closes. Near an edge, the menu flips to fit</dd></div>
          </Keys>}
          <Notes>
            <li>The builder gets typed state: <code>isHovered</code>, <code>isFocused</code> and <code>isPressed</code> everywhere, <code>isSelected</code> on a radio or an option, and <code>isOpen</code> on the select.</li>
            <li>Naked UI depends only on Flutter. These drawings use Mix; a <code>Container</code> works the same way.</li>
          </Notes>
          <DocLink href={`/naked-ui/docs/widget/${widget}/`}>{widget === 'radio' ? 'NakedRadio' : 'NakedSelect'} reference</DocLink>
        </Side>
      </Bench>
    </article>
    <div className="v2-more">
      <h3>Also in Naked UI</h3>
      <ul>{NAKED_DOCS.map(name => <li key={name}><Link href={`/naked-ui/docs/widget/${name.toLowerCase()}/`}>{name}</Link></li>)}<li><Link href="/naked-ui/docs/#components">All widgets <ArrowRight /></Link></li></ul>
    </div>
  </section>;
}

const REMIX_TABS = [{ id: 'install', name: 'Install' }, { id: 'compose', name: 'Compose' }, { id: 'recipe', name: 'A recipe’s source' }] as const;
const REMIX_DOCS: [string, string][] = [['Button', 'button'], ['Checkbox', 'checkbox'], ['Switch', 'switch'], ['Slider', 'slider'], ['Select', 'select'], ['Menu', 'menu'], ['Tabs', 'tabs'], ['Dialog', 'dialog'], ['Text field', 'textfield'], ['Toast', 'toast']];

function RemixPart({ code, packages }: Props) {
  const [tab, setTab] = useState<(typeof REMIX_TABS)[number]['id']>('compose');
  return <section className="v2-part" id="remix" data-tone="remix" aria-labelledby="remix-title">
    <Heading id="remix" level={2} kicker="Remix · Components" title="Components you install, compose and own.">
      <p>An interactive Remix component is Naked UI behavior drawn through a Mix style. A display component, such as a card or a badge, is a Mix style alone. The CLI copies them into your project as source. You import them from one file and compose them like any other widget.</p>
    </Heading>
    <article className="v2-exhibit" aria-label="Remix example">
      <Bench files={tab === 'compose' ? fileNames(code['remix-form'], code['remix-form-style']) : tab === 'recipe' ? fileNames(code['remix-recipe']) : ['Steps']}>
        <div className="v2-bench-main">
          <Segmented label="Code" hideLabel value={tab} onChange={setTab} options={REMIX_TABS} />
          {tab === 'compose' && <Code tabs tone="remix" active={['components']} segments={[{ excerpt: code['remix-form'] }, { excerpt: code['remix-form-style'] }]} />}
          {tab === 'recipe' && <>
            <Code tone="remix" segments={[{ excerpt: code['remix-recipe'], title: 'A recipe is a function in your project' }]} />
            <p className="v2-control-note"><code>@MixWidget</code> generates the <code>UiCard</code> widget from this function. <code>UiTokens</code> holds the theme’s tokens, called like <code>UiTokens.card()</code> as in the <a href="#mix-tokens">Tokens example</a>, and fixed scale values such as <code>UiTokens.s6</code>, which are plain numbers. <code>UiTheme</code> supplies the tokens’ values. Change a line here and every <code>UiCard</code> in your app follows.</p>
          </>}
          {tab === 'install' && <div className="v2-steps">
            <ol>
              <li><h4>Install the CLI once</h4><CopyCommand command={packages.cli.command} /><p>Puts the <code>remix</code> command on your path. If your shell cannot find it, add Pub’s <code>bin</code> folder to your <code>PATH</code>; pub prints the line to add. Keep the version: without it, pub picks the old 0.1.0.</p></li>
              <li><h4>Set up the project</h4><CopyCommand command="remix init" /><p>Writes <code>remix.yaml</code> and <code>lib/ui/ui.dart</code>. The defaults are the <code>Ui</code> prefix and the <code>lib/ui</code> folder.</p></li>
              <li><h4>Add the components you need</h4><CopyCommand command="remix add card button switch slider checkbox badge" /><p>Also adds the <code>remix</code> package, at the version the registry was tested with, and the code generator.</p></li>
              <li>
                <h4>Place the theme once, below your app host</h4>
                <pre className="v2-snippet" tabIndex={0}><code>{'WidgetsApp(\n  color: const Color(0xFFFFFFFF),\n  builder: (context, _) => const UiTheme(child: HomeScreen()),\n)'}</code></pre>
                <p>Every <code>Ui*</code> widget reads its values from this scope. <code>UiTheme</code> installs a <code>MixScope</code> holding the theme’s tokens, the mechanism from the <a href="#mix-tokens">Tokens example</a>, and sets the default text style. In an app with routes, wrap the builder’s <code>child</code> instead, <code>builder: (context, child) =&gt; UiTheme(child: child!)</code>, so pushed pages and menus sit under it too. The form on this page sits under one.</p>
              </li>
            </ol>
            <p><code>add</code> writes the files into <code>lib/ui</code> and generates the widgets. <Link href="/v2/source/?file=remix.yaml"><code>remix.yaml</code></Link> pins the registry revision they came from. To take a later version, run <code>remix registry update @remix</code>. Then <code>add button --diff</code> shows what would change, and <code>--overwrite</code> applies it.</p>
          </div>}
        </div>
        <Side>
          <Preview demo="remix" label="Live Flutter example: a checkout form composed from installed Remix components">
            <p className="v2-control-note">Move the slider, flip the switch, and press Start to see its loading state. Reset is the <code>ghost</code> variant of the same button.</p>
          </Preview>
          <Notes>
            <li>Six installed components and two Mix layout styles make the whole form. <code>UiCard</code>, <code>UiSlider</code>, <code>UiSwitch</code>, <code>UiCheckbox</code>, <code>UiButton</code> and <code>UiBadge</code> come from the one <code>ui.dart</code> import.</li>
            <li>Variants are named constructors: <code>UiButton.ghost</code>, <code>UiBadge.secondary</code>. To change one call site, pass <code>style:</code>; it is merged last.</li>
            <li>The components are source in <code>lib/ui</code>, not a dependency. Edit a recipe, or give a plain <code>Remix*</code> widget a Styler of your own.</li>
          </Notes>
          <DocLink href="/remix/docs/open-code/">Open code and the CLI</DocLink>
          <DocLink href="/remix/docs/guides/styling-components/">Styling components</DocLink>
        </Side>
      </Bench>
    </article>
    <div className="v2-more">
      <h3>Components in Remix</h3>
      <ul>{REMIX_DOCS.map(([name, slug]) => <li key={slug}><Link href={`/remix/docs/components/${slug}/`}>{name}</Link></li>)}<li><Link href="/remix/docs/">All components <ArrowRight /></Link></li></ul>
    </div>
  </section>;
}

const STARTS = [
  {
    id: 'mix', tone: 'mix', name: 'Mix', role: 'Styling', excerpt: 'start-mix', library: 'mix',
    when: 'You have widgets already and want their styling in one reusable place.',
    docs: [['Getting started', '/mix/docs/overview/getting-started/'], ['Styling guide', '/mix/docs/guides/styling/'], ['Design tokens', '/mix/docs/guides/design-token/'], ['Animations', '/mix/docs/guides/animations/']],
  },
  {
    id: 'naked', tone: 'naked', name: 'Naked UI', role: 'Behavior', excerpt: 'start-naked', library: 'naked_ui',
    when: 'You are building your own controls and want keyboard, focus and semantics handled.',
    docs: [['Getting started', '/naked-ui/docs/'], ['Checkbox', '/naked-ui/docs/widget/checkbox/'], ['Select', '/naked-ui/docs/widget/select/'], ['All widgets', '/naked-ui/docs/#components']],
  },
  {
    id: 'remix', tone: 'remix', name: 'Remix', role: 'Components', excerpt: 'start-remix', library: 'remix',
    when: 'You want complete components now, as source you own. Includes Mix.',
    docs: [['Getting started', '/remix/docs/getting-started/'], ['Styling components', '/remix/docs/guides/styling-components/'], ['Registries', '/remix/docs/guides/registries/'], ['Open code', '/remix/docs/open-code/']],
  },
] as const;

function Start({ code, packages }: Props) {
  const [selected, setSelected] = useState<(typeof STARTS)[number]['id']>('mix');
  const start = STARTS.find(item => item.id === selected)!;
  const library = packages.libraries[start.library];
  return <section className="v2-part v2-start" id="start" data-tone={start.tone} aria-labelledby="start-title">
    <Heading id="start" level={2} kicker="Get started" title="Add one to your app.">
      <p>Each library installs on its own. Pick the layer that matches what you are building; you can add the others later.</p>
    </Heading>
    <div className="v2-start-grid">
      <div className="v2-start-pick" role="radiogroup" aria-label="Library">
        {STARTS.map(item => <label key={item.id} data-tone={item.tone} data-checked={item.id === selected}>
          <input type="radio" name="v2-start" value={item.id} checked={item.id === selected} onChange={() => setSelected(item.id)} />
          <span className="v2-start-name"><strong>{item.name}</strong><em>{item.role}</em></span>
          <span className="v2-start-when">{item.when}</span>
        </label>)}
      </div>
      <div className="v2-start-body">
        {selected === 'remix' && <p className="v2-fineprint v2-start-ai">Using a coding agent? <DocLink href="/remix/docs/getting-started/#start-with-ai">Start with AI</DocLink></p>}
        <ol className="v2-start-steps">
          <li>
            <h3>{start.id === 'remix' ? 'Install the CLI, then a component' : 'Add the package'}</h3>
            {start.id === 'remix' ? <>
              <CopyCommand command={packages.cli.command} />
              <CopyCommand command="remix init" />
              <CopyCommand command="remix add button" />
              <p className="v2-fineprint"><code>remix add</code> also adds the remix package at the version the registry was tested with. This page runs remix {library.version}. <a href="https://pub.dev/packages/remix">remix on pub.dev</a></p>
            </> : <>
              <CopyCommand command={library.command} />
              <p className="v2-fineprint">This page runs {start.library} {library.version}{library.version.includes('-') ? ', a prerelease. The command takes the newest prerelease, and the stable release once there is one' : ''}. <a href={`https://pub.dev/packages/${start.library}`}>{start.library} on pub.dev</a></p>
            </>}
          </li>
          <li>
            <h3>Replace <code>lib/main.dart</code> with this</h3>
            <Code tone={start.tone} segments={[{ excerpt: code[start.excerpt] }]} />
          </li>
          <li>
            <h3>Run it</h3>
            <CopyCommand command="flutter run" />
            {/* naked_ui 2.0.0-beta.2 asks less than Mix and Remix, and its starter is plain Flutter. */}
            {start.id === 'naked'
              ? <p className="v2-fineprint">Needs Flutter 3.41+ · Dart 3.11+.</p>
              : <p className="v2-fineprint">Needs {packages.requirements}.{start.id === 'mix' && <> The starter uses Dart’s dot shorthand, such as <code>.circular(10)</code>.</>}</p>}
          </li>
        </ol>
        <div className="v2-start-next">
          <h3>Then read</h3>
          <ul>{start.docs.map(([name, href]) => <li key={href}><Link href={href}>{name} <ArrowRight /></Link></li>)}</ul>
        </div>
      </div>
    </div>
    <div className="v2-source-callout">
      <div>
        <h3>Run this page’s examples</h3>
        <p>Every example above is a file in one small Flutter package. Browse it, or clone it and run it.</p>
      </div>
      <Link className="v2-button" href="/v2/source/">Browse the source <ArrowRight /></Link>
    </div>
    <footer className="v2-footer">
      <span>Mix, Naked UI and Remix are open source.</span>
      <a href="https://github.com/btwld">github.com/btwld <ArrowRight /></a>
    </footer>
  </section>;
}
