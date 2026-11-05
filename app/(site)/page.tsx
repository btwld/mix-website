import { ProjectCard } from '@/components/project-card';
import { InstallSection } from '@/components/landing/install-section';
import { HeroMedia } from '@/components/landing/hero-media';
import { MixFeatures } from '@/components/landing/mix-features';
import { LandingButton, SectionHead } from '@/components/landing/ui';
import { HOME_FEATURE_IDS } from '@/lib/landing-previews.mjs';
import { PROJECT_IDS } from '@/lib/projects.mjs';
import { landingMetadata } from '@/lib/site';

export const metadata = landingMetadata({
  description: 'An expressive styling system for Flutter. Effortlessly style your widgets and build design systems, with interactive Flutter examples and documentation.',
  path: '/',
});

export default function Home() {
  return <div className="lx project-mix lx-mix lx-mix-home">
    <HeroMedia />
    <section className="lx-band">
      <div className="lx-shell lx-shell-narrow">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="lx-mark lx-enter" src="/assets/icon_logo.svg" alt="Mix" width={95} height={105} />
        <h1 className="lx-display lx-enter lx-enter-1">An Expressive Styling<br className="lx-hero-break" /> System for Flutter</h1>
        <p className="lx-lead lx-enter lx-enter-2">
          Effortlessly style your widgets and build design systems.
        </p>
        <div className="lx-hero-cta lx-enter lx-enter-3">
          <LandingButton href="/mix/docs/overview/getting-started/" arrow>Get started</LandingButton>
          <LandingButton href="/mix/docs/" variant="secondary">Read the docs</LandingButton>
        </div>
      </div>
    </section>

    <section className="lx-gap" aria-labelledby="home-features">
      <div className="lx-shell lx-shell-narrow">
        <SectionHead
          align="left"
          eyebrow="Features"
          id="home-features"
          title="Expressive by design, precise by nature."
          lead="Mix uses Dart's type system to make styles composable and type-safe. Chain methods to build styles, compose them with variants, and let the framework handle the rest."
        />
      </div>
      <div className="lx-shell"><MixFeatures only={HOME_FEATURE_IDS} /></div>
    </section>

    <section className="lx-shell lx-gap" aria-labelledby="projects">
      <SectionHead
        eyebrow="Three projects"
        id="projects"
        title="One toolkit for styling, components and behavior."
        lead="Each project keeps its own documentation. Search and navigation span all three."
      />
      <div className="lx-siblings lx-reveal">
        {PROJECT_IDS.map(id => <ProjectCard key={id} id={id} />)}
      </div>
    </section>

    <InstallSection />
  </div>;
}
