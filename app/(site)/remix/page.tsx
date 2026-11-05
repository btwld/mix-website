import type { Metadata } from 'next';
import site from '@/.generated/site-inputs.json';
import { LegacyCatalogRedirect } from '@/components/legacy-catalog-redirect';
import { RemixBento } from '@/components/landing/remix-bento';
import { RemixHeroDemo } from '@/components/landing/remix-hero-demo';
import { Faq, FeatureCards, HeroBackdrop, LandingButton, SectionHead, WindowBar } from '@/components/landing/ui';
import { Accessibility, Blocks, Bolt, Github, Repeat, Sparkle, Wand } from '@/components/landing/icons';
import { PROJECTS } from '@/lib/projects.mjs';
import { canonicalMetadata } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Remix',
  description: PROJECTS.remix.description,
  ...canonicalMetadata(PROJECTS.remix.overviewPath),
};

const LINKS = {
  getStarted: PROJECTS.remix.startPath,
  components: '/remix/docs/components/button/',
  styling: '/mix/docs/guides/styling/',
  catalog: PROJECTS.remix.catalogPath,
  github: PROJECTS.remix.codeRepository,
  pubDev: 'https://pub.dev/packages/remix',
};

/** Component names come from the staged docs, so the list cannot drift. */
const COMPONENTS = site.pages.remix
  .filter(slug => slug.startsWith('components/'))
  .map(slug => slug.slice('components/'.length).replace(/_/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase()));

const STATS = [
  { value: String(COMPONENTS.length), label: 'Documented components' },
  { value: '100%', label: 'Headless behaviour' },
  { value: 'Fortal', label: 'Optional design system' },
  { value: 'BSD-3', label: 'Open source' },
];

const FEATURES = [
  { icon: Blocks, title: 'Headless by design', wide: true, body: 'Behaviour, focus and state are handled. Remix has no opinion on how it looks — that part is entirely yours.' },
  { icon: Wand, title: 'Styled with Mix', wide: true, body: 'Compose styles with a fluent, type-safe API — variants, states and tokens all in one place.' },
  { icon: Accessibility, title: 'Accessible out of the box', body: 'Keyboard navigation and screen-reader semantics are built into every widget.' },
  { icon: Repeat, title: 'Define once, reuse everywhere', body: 'Share one style across your whole app. No drifting variants.' },
  { icon: Bolt, title: 'Real, running Flutter', body: 'Every example on this page is a live app, never a screenshot.' },
];

const FAQ = [
  {
    q: 'Is it production-ready?',
    a: 'The component set is real, running and usable today — every example on this page is live proof. Remix is still pre-1.0 on pub.dev because the API is evolving and components and guides land continuously, not because the components are unstable.',
  },
  {
    q: 'How is it different from Material or Cupertino?',
    a: 'Material and Cupertino ship with a design language built in. Remix ships behaviour, and you style every pixel with Mix. Fortal is available when you want a ready-made look, but it is opt-in rather than the default.',
  },
  {
    q: 'Do I need to know Mix first?',
    a: 'It helps, but no. Remix ships with sensible styles you can use immediately, then customise with Mix’s fluent API as you grow.',
  },
  {
    q: 'Is it accessible and keyboard-navigable?',
    a: 'Yes, and it is built into every component. You do not wire it up yourself.',
  },
  {
    q: 'Is Remix free, and can I use it commercially?',
    a: 'Yes to both. Remix is open source under the BSD 3-Clause licence, with no tiers and no licence fees.',
  },
];

export default function RemixOverview() {
  return <div className="lx lx-remix">
    <LegacyCatalogRedirect />

    <HeroBackdrop />
    <section className="lx-band">
      <div className="lx-shell lx-band-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/remix/assets/logo_dark.png" alt="Remix" width={802} height={223}
          className="lx-wordmark lx-enter" />
        <h1 className="lx-display lx-enter lx-enter-1">
          The behavior is built in.<br /><span className="lx-grad">Style Flutter your way.</span>
        </h1>
        <p className="lx-lead lx-enter lx-enter-2">
          <span className="lx-eyebrow lx-hero-eyebrow">Built for a generative UI future.</span>
          Headless, accessible Flutter components with the behaviour already handled. Style every pixel with Mix — the look is entirely yours.
        </p>
        <div className="lx-hero-cta lx-enter lx-enter-3">
          <LandingButton href={LINKS.getStarted} arrow>Start in 2 minutes</LandingButton>
          <LandingButton href={LINKS.catalog} variant="secondary">Open the catalog</LandingButton>
        </div>
        <div className="lx-stagewrap lx-enter-stage">
          <RemixHeroDemo locked={site.mix.landingPreviews} />
        </div>
      </div>
    </section>

    <section className="lx-shell lx-gap-sm" aria-label="Remix at a glance">
      <div className="lx-stats lx-reveal">
        {STATS.map(stat => <div key={stat.label} className="lx-stat">
          <span className="lx-stat-value">{stat.value}</span>
          <span className="lx-stat-label">{stat.label}</span>
        </div>)}
      </div>
    </section>

    <section className="lx-shell lx-gap">
      <p className="lx-statement lx-reveal">
        Material and Cupertino come with a look of their own.{' '}
        <span className="lx-grad">Remix hands you behaviour and gets out of the way</span>, so styling becomes the part you actually enjoy.
      </p>
    </section>

    <section className="lx-shell lx-gap" aria-labelledby="remix-why">
      <SectionHead
        eyebrow="Why Remix"
        id="remix-why"
        title="Everything you need. Nothing in your way."
        lead="A foundation that handles the hard parts — behaviour, focus, accessibility — and then disappears so your design can take over."
      />
      <FeatureCards items={FEATURES} />
    </section>

    <section className="lx-shell lx-gap" aria-labelledby="remix-components">
      <SectionHead
        eyebrow="Components"
        id="remix-components"
        title="Components running live on this page."
        lead="Real, running Flutter apps. Hover them, focus them, click them. Nothing here is a screenshot."
      />
      <RemixBento />
    </section>

    <section className="lx-gap-sm lx-marquee-section" aria-label={`${COMPONENTS.length} documented Remix components`}>
      {[false, true].map(reverse => <div key={String(reverse)} className={`lx-marquee${reverse ? ' lx-marquee-reverse' : ''}`} aria-hidden="true">
        <div className="lx-marquee-track">
          {[...COMPONENTS, ...COMPONENTS].map((name, index) => <span key={`${name}-${index}`} className="lx-chip">{name}</span>)}
        </div>
      </div>)}
      <div className="lx-shell lx-center lx-reveal lx-marquee-cta">
        <LandingButton href={LINKS.components} variant="ghost" arrow>Browse the full component library</LandingButton>
      </div>
    </section>

    <section className="lx-shell lx-gap">
      <div className="lx-split">
        <div>
          <SectionHead
            align="left"
            eyebrow="Styling"
            title="Define a look once. Reuse it everywhere."
            lead="Compose a style with Mix's fluent API, then share it across your whole app. No deep widget trees, no copy-pasted variants drifting out of sync."
          />
          <ul className="lx-checklist lx-reveal">
            <li><Sparkle /> Type-safe, fluent and composable</li>
            <li><Sparkle /> Variants, states and tokens in one place</li>
            <li><Sparkle /> Works on any Remix component</li>
          </ul>
          <div className="lx-reveal lx-split-cta">
            <LandingButton href={LINKS.styling} variant="ghost" arrow>Explore styling</LandingButton>
          </div>
        </div>
        <div className="lx-panel lx-reveal">
          <WindowBar label="Fortal design system" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="lx-catalog-image" src="/remix/assets/fortal-catalog.png" alt="The Fortal component catalog, showing styled Remix components" width={1600} height={1000} loading="lazy" />
        </div>
      </div>
    </section>

    <section className="lx-shell lx-gap" aria-labelledby="remix-faq">
      <SectionHead eyebrow="FAQ" id="remix-faq" title="Questions, answered." />
      <Faq items={FAQ} />
    </section>

    <section className="lx-shell lx-gap">
      <div className="lx-cta lx-reveal">
        <div className="lx-cta-glow" aria-hidden="true" />
        <h2 className="lx-title">Build Flutter UI that&rsquo;s finally yours.</h2>
        <p className="lx-lead">
          Open source, free and in active development. Explore the components, read the docs, and shape it with the community.
        </p>
        <div className="lx-cta-row">
          <LandingButton href={LINKS.getStarted} arrow>Start in 2 minutes</LandingButton>
          <LandingButton href={LINKS.components} variant="secondary">Browse components</LandingButton>
        </div>
        <div className="lx-cta-links">
          <a href={LINKS.github} target="_blank" rel="noreferrer"><Github /> GitHub</a>
          <span aria-hidden="true">·</span>
          <a href={LINKS.pubDev} target="_blank" rel="noreferrer">pub.dev</a>
          <span aria-hidden="true">·</span>
          <a href="/notices/remix-BSD-3-Clause.txt" className="lx-fine">BSD 3-Clause · Built on Mix</a>
        </div>
      </div>
    </section>
  </div>;
}
