'use client';

import Link from 'next/link';
import { ArrowRight } from '@/components/landing/icons';
import type { ShowcaseCode } from '@/lib/showcase-source';
import { CodeExample } from './code-example';

export type MotionMode = 'transitions' | 'springs' | 'keyframes';
export const motionDocs: Record<MotionMode, string> = {
  transitions: '/mix/docs/guides/animations/#curve-based-configs',
  springs: '/mix/docs/guides/animations/#spring-based-configs',
  keyframes: '/mix/docs/guides/animations/#keyframe-animations',
};
export type FeaturePreview = { chapter: 'looks' | 'states' | 'adapt' | 'motion' | 'remix' | 'naked' | 'blocks'; motion?: MotionMode; look?: string; block?: string; preset?: 'custom' | 'fortal' };

const FEATURES: {
  id: string; name: string; layer: string; title: string; description: string; detail: string;
  snippet: string; preview: FeaturePreview; docs: { href: string; label: string };
}[] = [
  {
    id: 'composition', name: 'Style composition', layer: 'Mix / Styling', title: 'One base. Every card.',
    description: 'Build a style with a fluent, typed API. Extend it where you need a little more, without duplicating the shared design.',
    detail: 'The cards share cardStyle; cardPad adds padding. ShapeToken and LiftToken are small adapters in tokens.dart, so custom shapes and shadows read like any other token.',
    snippet: 'composition', preview: { chapter: 'looks' }, docs: { href: '/mix/docs/overview/getting-started/', label: 'Get started with Mix' },
  },
  {
    id: 'tokens', name: 'Design tokens', layer: 'Mix / Theming', title: 'Change the design. Keep the widgets.',
    description: 'Declare a token, provide its value in MixScope, then reference it in a style. This complete, runnable example changes color, spacing, and typography without replacing the styled widget.',
    detail: 'A token is a key, not a global value. Calling it creates a reference; Mix resolves it below the nearest scope. Rebuilding that scope with new values updates dependent styles. This small example runs separately; “Try it” shows the same idea applied to four looks. The showcase adds custom ShapeToken and LiftToken adapters for shape and depth; those are app code, not built-in Mix APIs.',
    snippet: 'tokens', preview: { chapter: 'looks', look: 'cyber' }, docs: { href: '/mix/docs/guides/design-token/#mixscope', label: 'Explore design tokens' },
  },
  {
    id: 'material-bridge', name: 'Material bridge', layer: 'Mix / Theming', title: 'Bring your Material theme along.',
    description: 'Read the active Material theme with ContextToken. Mix styles can use your app’s existing colors directly.',
    detail: 'ContextToken<Color> reads Theme.of at the consuming widget’s context, so place the consumer below MaterialApp or Theme. It needs no MixScope entry. This app separately updates ThemeData from the selected look; this is not two-way theme synchronization. The button’s shape and type still come from the app’s MixScope. Open Invite on Team to try it.',
    snippet: 'material-bridge', preview: { chapter: 'blocks', block: 'team' }, docs: { href: '/mix/docs/guides/design-token/#context-tokens', label: 'Bridge your Material theme' },
  },
  {
    id: 'states', name: 'Interaction states', layer: 'Mix / Variants', title: 'The response belongs in the style.',
    description: 'Describe resting, hover, and pressed appearances together. Mix resolves the style as the interaction changes.',
    detail: 'Today’s task rows brighten on hover and scale down on press. listRow.pressable supplies those interaction states; a plain Box does not. The checkbox remains the row’s keyboard control. The excerpt includes the style and its actual consumer.',
    snippet: 'states', preview: { chapter: 'states' }, docs: { href: '/mix/docs/guides/dynamic-styling/#interaction', label: 'Explore state variants' },
  },
  {
    id: 'transitions', name: 'Transitions', layer: 'Mix / Motion', title: 'Let one look become the next.',
    description: 'Add an animation configuration to a style. When its resolved values change, Mix interpolates between them.',
    detail: 'The cards use a shared 420 ms ease-out transition for their surface and shape. Change the look to see it run.',
    snippet: 'transitions', preview: { chapter: 'motion', motion: 'transitions' }, docs: { href: motionDocs.transitions, label: 'Explore animation' },
  },
  {
    id: 'springs', name: 'Spring motion', layer: 'Mix / Motion', title: 'Give changing values a softer landing.',
    description: 'Use a spring configuration with the same animate API. The target value stays in your style; Mix handles the movement.',
    detail: 'Switch between This week and Last week in Spending. Each bar animates to its new height with a 320 ms spring.',
    snippet: 'springs', preview: { chapter: 'motion', motion: 'springs' }, docs: { href: motionDocs.springs, label: 'Explore spring animation' },
  },
  {
    id: 'keyframes', name: 'Keyframe timelines', layer: 'Mix / Motion', title: 'Set the rhythm, property by property.',
    description: 'Define a timeline of values and easing, then map the result back to a style. No separate controller in the widget.',
    detail: 'The player’s equalizer loops a height track while playing. Play and Pause control the demo; it produces no audio.',
    snippet: 'keyframes', preview: { chapter: 'motion', motion: 'keyframes' }, docs: { href: motionDocs.keyframes, label: 'Explore keyframes' },
  },
  {
    id: 'layout', name: 'Responsive layout', layer: 'Flutter + Mix / Layout', title: 'Your layout. Your styling system.',
    description: 'Flutter’s LayoutBuilder switches the deck to a compact composition. A Mix breakpoint tightens the shared card padding.',
    detail: 'The Layout chapter narrows the deck on larger screens. On a phone, the compact layout is already in use.',
    snippet: 'adapt', preview: { chapter: 'adapt' }, docs: { href: '/mix/docs/guides/dynamic-styling/#breakpoint', label: 'Explore breakpoints' },
  },
  {
    id: 'remix', name: 'Remix components', layer: 'Remix / Components', title: 'Compose the UI. Make the style yours.',
    description: 'Remix pairs Naked UI behavior with Mix styling. Use buttons, sliders, and checkboxes without starting each component from scratch.',
    detail: 'Today uses RemixCheckbox with a shared checkbox style. Its checked state stays intact as you change looks.',
    snippet: 'remix', preview: { chapter: 'remix', block: 'today', preset: 'custom' }, docs: { href: '/remix/docs/components/checkbox/#basic-implementation', label: 'Explore the checkbox' },
  },
  {
    id: 'open-code', name: 'Open code', layer: 'Remix / Open code', title: 'Install the recipe. Own the source.',
    description: 'Remix components are theme-free. Fortal is an optional starting design system: the CLI installs editable recipes and a token theme into your app, not another runtime theme package.',
    detail: 'Only Today switches to FortalCard, FortalCheckbox and FortalBadge. The other cards keep the selected look, and tasks keep their state. FortalTheme supplies its own complete token scope, so the app’s custom look tokens do not apply inside it.',
    snippet: 'fortal-today', preview: { chapter: 'remix', block: 'today', preset: 'fortal' }, docs: { href: '/remix/docs/open-code/', label: 'Explore open code' },
  },
  {
    id: 'overlays', name: 'Overlays and feedback', layer: 'Remix / Components', title: 'From an invite to a confirmation.',
    description: 'Combine a dialog, text field, loading button, and toast in one interaction, with Mix styles for each component.',
    detail: 'Open Invite on the Team card, enter an email, and choose Send invite. The dialog closes and a toast confirms the local demo invite. Nothing is sent.',
    snippet: 'invite', preview: { chapter: 'blocks', block: 'team' }, docs: { href: '/remix/docs/components/dialog/', label: 'Explore dialogs' },
  },
  {
    id: 'naked', name: 'Naked UI behavior', layer: 'Naked UI / Behavior', title: 'Keep the behavior. Choose the rendering.',
    description: 'Start with interactive primitives when you want to own the visual layer. Use their state to build the interface you need.',
    detail: 'The unstyled task row uses NakedCheckbox directly. Click it, or focus it and press Space, to change the same task state.',
    snippet: 'naked', preview: { chapter: 'naked' }, docs: { href: '/naked-ui/docs/widget/checkbox/#basic-implementation', label: 'Explore Naked UI' },
  },
];

export function Features({ code, onPreview, selected, onSelect }: { code: ShowcaseCode; onPreview: (preview: FeaturePreview) => void; selected: string; onSelect: (id: string) => void }) {
  const feature = FEATURES.find(item => item.id === selected)!;

  return <section className="v2-features" id="v2-features" aria-labelledby="v2-features-title">
    <div className="v2-features-intro">
      <div><p className="v2-tag">Features &amp; code</p><h2 id="v2-features-title">See it. Build it.</h2></div>
      <p>Follow the running app’s source, or start smaller with a complete token example. Each feature connects the behavior, Dart, and reference guide.</p>
    </div>
    <div className="v2-feature-workbench">
      <div className="v2-feature-menu" role="group" aria-label="Choose a feature">
        {FEATURES.map((item, index) => <button type="button" key={item.id} aria-pressed={selected === item.id} aria-controls="v2-feature-panel" onClick={() => onSelect(item.id)}>
          <span className="v2-feature-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span><span>{item.name}</span><ArrowRight />
        </button>)}
      </div>
      <div className="v2-feature-select"><label htmlFor="v2-feature-choice">Explore a feature</label>
        <select id="v2-feature-choice" value={selected} onChange={event => onSelect(event.target.value)}>{FEATURES.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
      </div>
      <div className="v2-feature-panel" id="v2-feature-panel" role="region" aria-labelledby="v2-feature-title">
        <p className="v2-tag">{feature.layer}</p>
        <h3 id="v2-feature-title">{feature.title}</h3>
        <p className="v2-feature-description">{feature.description}</p>
        <CodeExample entry={code[feature.snippet]} />
        {feature.id === 'tokens' && <div className="v2-token-guide">
          <ol><li><strong>Declare</strong> semantic keys once.</li><li><strong>Provide</strong> values above the widgets that use them.</li><li><strong>Consume</strong> references in a shared style, then attach it to a widget.</li></ol>
          <p>Run this file in the showcase package:</p>
          <code>flutter run -d chrome -t lib/token_example.dart</code>
          <p>For a partial override, use <code>MixScope.inherit</code>. A nested plain <code>MixScope</code> replaces the available token set; it does not fall back to its parent.</p>
          <Link href="/v2/source/?file=token_example.dart">Complete token example &amp; package setup <ArrowRight /></Link>
        </div>}
        <p className="v2-feature-detail">{feature.detail}</p>
        {feature.id === 'overlays' && <p className="v2-feature-detail">Remix beta.17 captures the token map when a dialog opens. Because this tour can change looks while it stays open, <Link href="/v2/source/?file=invite.dart">openInvite re-provides the current look inside the dialog builder</Link>.</p>}
        <div className="v2-feature-actions">
          <a className="v2-link" href={`#v2-${feature.preview.chapter}`} onClick={event => { event.preventDefault(); onPreview(feature.preview); }}>Try it in the showcase <ArrowRight /></a>
          <Link className="v2-link" href={feature.docs.href}>{feature.docs.label} <ArrowRight /></Link>
        </div>
      </div>
    </div>
    <p className="v2-features-source">Want the full picture? <Link href="/v2/source/">Browse all source files and setup instructions <ArrowRight /></Link></p>
  </section>;
}
