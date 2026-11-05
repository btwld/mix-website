import type { Metadata } from 'next';
import site from '@/.generated/site-inputs.json';
import { FeatureCards, HeroBackdrop, LandingButton, SectionHead } from '@/components/landing/ui';
import { Accessibility, Blocks, Sparkle } from '@/components/landing/icons';
import { PROJECTS } from '@/lib/projects.mjs';
import { canonicalMetadata } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Naked UI',
  description: PROJECTS['naked-ui'].description,
  ...canonicalMetadata(PROJECTS['naked-ui'].overviewPath),
};

/** Widget names come from the staged docs, so the list cannot drift. */
const WIDGETS = site.pages['naked-ui']
  .filter(slug => slug.startsWith('widget/'))
  .map(slug => 'Naked' + slug.slice('widget/'.length).replace(/(^|-)(\w)/g, (_, __, letter: string) => letter.toUpperCase()));

const FEATURES = [
  { icon: Blocks, title: 'Behaviour without styling', body: 'Interaction, focus management and state live in the widget. Every pixel of the presentation is still yours to write.' },
  { icon: Accessibility, title: 'Semantics included', body: 'Keyboard handling and screen-reader semantics ship with each widget rather than being bolted on afterwards.' },
  { icon: Sparkle, title: 'Composes with Mix and Remix', body: 'Style a Naked widget with Mix, or take the ready-made Remix components built on the same primitives.' },
];

export default function NakedUiOverview() {
  return <div className="lx lx-naked-ui">
    <HeroBackdrop />
    <section className="lx-band">
      <div className="lx-shell lx-shell-narrow">
        <span className="lx-eyebrow lx-enter">Headless Flutter widgets</span>
        <h1 className="lx-display lx-enter lx-enter-1">Naked UI</h1>
        <p className="lx-lead lx-enter lx-enter-2">{PROJECTS['naked-ui'].description}</p>
        <div className="lx-hero-cta lx-enter lx-enter-3">
          <LandingButton href={PROJECTS['naked-ui'].startPath} arrow>Get started</LandingButton>
          <LandingButton href={PROJECTS['naked-ui'].codeRepository} variant="secondary">Source on GitHub</LandingButton>
        </div>
      </div>
    </section>

    <section className="lx-shell lx-gap" aria-labelledby="naked-why">
      <SectionHead
        eyebrow="Why Naked UI"
        id="naked-why"
        title="The hard parts, handled. The look, untouched."
        lead="Naked UI gives you the behaviour contract of a component library without inheriting its design language."
      />
      <FeatureCards items={FEATURES} />
    </section>

    <section className="lx-gap-sm lx-marquee-section" aria-label={`${WIDGETS.length} documented Naked UI widgets`}>
      <div className="lx-marquee" aria-hidden="true">
        <div className="lx-marquee-track">
          {[...WIDGETS, ...WIDGETS].map((name, index) => <span key={`${name}-${index}`} className="lx-chip">{name}</span>)}
        </div>
      </div>
      <div className="lx-shell lx-center lx-reveal lx-marquee-cta">
        <LandingButton href={`${PROJECTS['naked-ui'].docsBase}/`} variant="ghost" arrow>Browse every widget</LandingButton>
      </div>
    </section>
  </div>;
}
