'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight } from '@/components/landing/icons';
import type { ShowcaseCode } from '@/lib/showcase-source';
import { CodeExample } from './code-example';

export type MotionMode = 'transitions' | 'springs' | 'keyframes';
export const motionDocs: Record<MotionMode, string> = {
  transitions: '/mix/docs/guides/animations/#curve-based-configs',
  springs: '/mix/docs/guides/animations/#spring-based-configs',
  keyframes: '/mix/docs/guides/animations/#keyframe-animations',
};
export type FeaturePreview = {
  chapter: 'looks' | 'states' | 'adapt' | 'motion' | 'remix' | 'naked' | 'blocks';
  motion?: MotionMode; block?: string; preset?: 'custom' | 'fortal'; feature?: string;
};

type Feature = {
  id: string; name: string; library: 'Mix' | 'Remix' | 'Naked UI'; description: string;
  instruction: string; snippet: string; preview: FeaturePreview;
  docs: { href: string; label: string };
};

export const FEATURES: Feature[] = [
  {
    id: 'tokens', name: 'Design tokens', library: 'Mix',
    description: 'Provide new values to the same tokens. Every style that uses them follows the selected look.',
    instruction: 'Choose a look. The cards and the values in the Provide step change together.',
    snippet: 'token-declare', preview: { chapter: 'looks' },
    docs: { href: '/mix/docs/guides/design-token/#mixscope', label: 'Design token guide' },
  },
  {
    id: 'composition', name: 'Style composition', library: 'Mix',
    description: 'Define a shared style, then extend it with only the values that differ.',
    instruction: 'The cards share cardStyle. quietSlider changes two values of the shared slider style and keeps the rest.',
    snippet: 'composition', preview: { chapter: 'looks' },
    docs: { href: '/mix/docs/guides/styling/', label: 'Style composition guide' },
  },
  {
    id: 'states', name: 'Interaction states', library: 'Mix',
    description: 'Keep resting, hover, and pressed appearances in one style.',
    instruction: 'Hover or press a task row. Tab to its checkbox to see keyboard focus.',
    snippet: 'states', preview: { chapter: 'states' },
    docs: { href: '/mix/docs/guides/dynamic-styling/#interaction', label: 'Interaction state guide' },
  },
  {
    id: 'layout', name: 'Responsive layout', library: 'Mix',
    description: 'Use Flutter for the layout and Mix for styles that respond to the available width.',
    instruction: 'The narrow view uses a compact deck. Shared card padding changes from 18 to 14 pixels below 480 pixels.',
    snippet: 'adapt', preview: { chapter: 'adapt' },
    docs: { href: '/mix/docs/guides/dynamic-styling/#breakpoint', label: 'Breakpoint guide' },
  },
  {
    id: 'transitions', name: 'Transitions', library: 'Mix',
    description: 'Animate changes to a style’s resolved values with one animation configuration.',
    instruction: 'Choose another look to animate the cards’ surfaces and shapes.',
    snippet: 'transitions', preview: { chapter: 'motion', motion: 'transitions' },
    docs: { href: motionDocs.transitions, label: 'Transition guide' },
  },
  {
    id: 'springs', name: 'Spring motion', library: 'Mix',
    description: 'Use a spring configuration to animate a style toward its next value.',
    instruction: 'Switch This week and Last week in Spending. The bars spring to their new heights.',
    snippet: 'springs', preview: { chapter: 'motion', motion: 'springs' },
    docs: { href: motionDocs.springs, label: 'Spring animation guide' },
  },
  {
    id: 'keyframes', name: 'Keyframe timelines', library: 'Mix',
    description: 'Define a repeating timeline inside a style, without an animation controller in the widget.',
    instruction: 'Press Play or Pause. The equalizer follows a height timeline; no audio plays.',
    snippet: 'keyframes', preview: { chapter: 'motion', motion: 'keyframes' },
    docs: { href: motionDocs.keyframes, label: 'Keyframe guide' },
  },
  {
    id: 'material-bridge', name: 'Material bridge', library: 'Mix',
    description: 'Use ContextToken to read your existing Material theme from a Mix style.',
    instruction: 'Open Invite on Team. Send invite takes its fill and label colors from the app’s ColorScheme.',
    snippet: 'material-bridge', preview: { chapter: 'remix', block: 'team', preset: 'custom' },
    docs: { href: '/mix/docs/guides/design-token/#context-tokens', label: 'Material theme guide' },
  },
  {
    id: 'remix', name: 'Remix components', library: 'Remix',
    description: 'Compose components that pair Naked UI behavior with Mix styles.',
    instruction: 'Check a task. RemixCheckbox handles the control; CheckboxStyler defines its appearance.',
    snippet: 'remix', preview: { chapter: 'remix', block: 'today', preset: 'custom' },
    docs: { href: '/remix/docs/components/checkbox/#basic-implementation', label: 'Remix checkbox guide' },
  },
  {
    id: 'open-code', name: 'Open code', library: 'Remix',
    description: 'Start with Fortal’s theme and recipes, then edit the installed source in your app.',
    instruction: 'Compare the Today card in your styles and Fortal. The tasks keep their state.',
    snippet: 'fortal-today', preview: { chapter: 'remix', block: 'today', preset: 'fortal' },
    docs: { href: '/remix/docs/open-code/', label: 'Open-code guide' },
  },
  {
    id: 'overlays', name: 'Overlays and feedback', library: 'Remix',
    description: 'Combine a dialog, text field, loading button, and toast in one invite flow.',
    instruction: 'Open Invite on Team, enter an email, then choose Send invite. This is a local demo; nothing is sent.',
    snippet: 'invite', preview: { chapter: 'remix', block: 'team', preset: 'custom' },
    docs: { href: '/remix/docs/components/dialog/', label: 'Dialog guide' },
  },
  {
    id: 'naked', name: 'Naked UI behavior', library: 'Naked UI',
    description: 'Use interaction primitives directly when you want to define the rendering yourself.',
    instruction: 'Focus a task and press Space. The app keeps the checked value; NakedCheckbox supplies interaction state.',
    snippet: 'naked', preview: { chapter: 'naked' },
    docs: { href: '/naked-ui/docs/widget/checkbox/#basic-implementation', label: 'Naked UI checkbox guide' },
  },
];

/** The directory opens lessons in the tour; it does not create a second story. */
export function Features({ onPreview }: { onPreview: (preview: FeaturePreview) => void }) {
  // These actions need the tour's handlers and refs, not Flutter itself.
  // Do not offer an enabled SSR button whose first click can be lost.
  const [interactive, setInteractive] = useState(false);
  useEffect(() => setInteractive(true), []);
  return <section className="v2-features" id="v2-features" aria-labelledby="v2-features-title">
    <div className="v2-features-intro">
      <div><p className="v2-tag">Features &amp; code</p><h2 id="v2-features-title">Go straight to the code.</h2></div>
      <p>Choose a topic to open its code in the live tour.</p>
    </div>
    <div className="v2-feature-index" role="group" aria-label="Choose a feature">
      {(['Mix', 'Remix', 'Naked UI'] as const).map(library => <div className="v2-feature-index-group" key={library}>
        <h3>{library}</h3>
        <div>{FEATURES.filter(feature => feature.library === library).map(feature => <button type="button" key={feature.id} disabled={!interactive}
          title={feature.description} onClick={() => onPreview({ ...feature.preview, feature: feature.id })}>
          {feature.name}<ArrowRight />
        </button>)}</div>
      </div>)}
    </div>
    <p className="v2-features-source"><Link href="/v2/source/">Browse the complete project and setup <ArrowRight /></Link></p>
  </section>;
}

/** One focused code lesson, next to the live interface it describes. */
export function FeatureLesson({ id, code, open = false, onOpen }: {
  id: string; code: ShowcaseCode; open?: boolean; onOpen?: () => void;
}) {
  const feature = FEATURES.find(item => item.id === id)!;
  return <div className="v2-feature-panel" data-feature={id}>
    {open && <><p className="v2-lesson-topic">{feature.name}</p><p className="v2-note">{feature.description}</p></>}
    <p className="v2-note">{feature.instruction}</p>
    <CodeExample entry={code[feature.snippet]} collapsible initiallyOpen={open} onOpen={onOpen} />
    {id === 'material-bridge' && <details className="v2-integration-note">
      <summary>Theme placement</summary>
      <p>ContextToken resolves below the Material theme and needs no MixScope entry. Here the ColorScheme is seeded from the look’s accent, so the colors match.</p>
      <p>The button’s shape and typography still use the app’s Mix tokens.</p>
    </details>}
    {id === 'overlays' && <details className="v2-integration-note">
      <summary>Changing themes while a dialog is open</summary>
      <p>Remix beta.17 captures the opening token scope. <Link href="/v2/source/?file=invite.dart">openInvite</Link> provides the current look inside the dialog builder.</p>
    </details>}
  </div>;
}
