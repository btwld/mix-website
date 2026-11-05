// Every Mix preview the landing pages mount, in one place. The site-input
// prebuild resolves these IDs against the locked manifest exactly like the IDs
// written in Mix MDX, so a renamed or dropped preview fails the build instead
// of rendering an empty frame. Keep the lists literal: the verifier imports
// this module, it does not parse JSX.

/** Mix feature cards: live widget beside the exact Dart that produced it. */
export const MIX_FEATURES = [
  {
    previewId: 'homepage/styling',
    title: 'Intuitive styling',
    body: 'Define size, color, and shape in a single fluent chain. Each method returns a new style — readable, composable, and type-safe.',
    href: '/mix/docs/guides/styling/',
    linkLabel: 'See the styling guide',
    span: 2,
  },
  {
    previewId: 'homepage/variants',
    title: 'Context-reactive variants',
    body: 'Declare hover behaviour inline — colour, scale, and shadow all react to state without conditional logic.',
    href: '/mix/docs/guides/dynamic-styling/',
    linkLabel: 'Explore variants',
    span: 1,
  },
  {
    previewId: 'homepage/animation',
    title: 'Powerful animations',
    body: 'Define keyframe timelines with multiple property tracks directly inside styles. No external animation controllers needed.',
    href: '/mix/docs/guides/animations/',
    linkLabel: 'Animation docs',
    span: 1,
  },
  {
    previewId: 'homepage/buttons',
    title: 'Design system buttons',
    body: 'Define a base button once, then compose variants by adding just what differs. Text styling flows through via inherited defaults.',
    href: '/mix/docs/tutorials/creating-a-widget/',
    linkLabel: 'Build your own widget',
    span: 2,
  },
  {
    previewId: 'homepage/directives',
    title: 'Text directives',
    body: 'Apply uppercase and capitalize transforms directly in the style. Directives stay attached through merges and composition.',
    href: '/mix/docs/guides/directives/',
    linkLabel: 'Directives guide',
    span: 2,
  },
];

/** The apex welcome leads with Mix but stays shorter than the project landing. */
export const HOME_FEATURE_IDS = ['homepage/styling', 'homepage/variants', 'homepage/animation'];

/**
 * Remix hero: one RemixButton, three real Mix styles. The displayed code is
 * read from each preview's own `style` docregion, so the snippet is the source
 * that was compiled rather than a copy kept in sync by hand.
 */
export const REMIX_HERO_STYLES = [
  { key: 'classic', name: 'Classic', previewId: 'homepage/hero-classic' },
  { key: 'gradient', name: 'Gradient', previewId: 'homepage/hero-gradient' },
  { key: 'neon', name: 'Neon', previewId: 'homepage/hero-neon' },
];

/** Live component tiles. Every one is a running Flutter app, never an image. */
export const REMIX_BENTO = [
  { previewId: 'components/button.0', label: 'Button', span: 2, height: 300 },
  { previewId: 'components/textfield.0', label: 'TextField', span: 1, height: 300 },
  { previewId: 'components/switch.0', label: 'Switch', span: 1, height: 232 },
  { previewId: 'components/slider.0', label: 'Slider', span: 1, height: 232 },
  { previewId: 'components/avatar.0', label: 'Avatar', span: 1, height: 232 },
];

/** Flat list the prebuild verifies against the locked Mix manifest. */
export const LANDING_PREVIEW_IDS = [
  ...MIX_FEATURES.map(feature => feature.previewId),
  ...REMIX_HERO_STYLES.map(style => style.previewId),
  ...REMIX_BENTO.map(tile => tile.previewId),
];
