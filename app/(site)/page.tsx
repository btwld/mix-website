import type { Metadata } from 'next';
import { ProjectCard } from '@/components/project-card';
import { CodeBlock } from '@/components/landing/code-block';
import { InstallSection } from '@/components/landing/install-section';
import { HeroMedia } from '@/components/landing/hero-media';
import { MixFeatures } from '@/components/landing/mix-features';
import { LandingButton, SectionHead } from '@/components/landing/ui';
import { HOME_FEATURE_IDS } from '@/lib/landing-previews.mjs';
import { PROJECT_IDS } from '@/lib/projects.mjs';
import { canonicalMetadata } from '@/lib/site';

export const metadata: Metadata = {
  description: 'Flutter styling without the boilerplate. Mix, Remix and Naked UI: fluent styles, components and headless widgets, with every example running real Flutter.',
  ...canonicalMetadata('/'),
};

// Illustrative, not a locked preview: explicit Flutter constructors so the
// "before" really is the code a reader would otherwise write.
const WITHOUT_MIX = `Container(
  padding: EdgeInsets.all(16),
  decoration: BoxDecoration(
    color: Colors.blue,
    borderRadius: BorderRadius.circular(8),
  ),
  child: ...
)`;

const WITH_MIX = `// Style can live outside the widget
final cardStyle = BoxStyler()
    .color(Colors.blue)
    .padding(.all(16))
    .borderRadius(.circular(8));

// Widget stays clean
Box(style: cardStyle, child: ...)`;

export default function Home() {
  return <div className="lx lx-mix">
    <section className="lx-band">
      <HeroMedia />
      <div className="lx-shell lx-shell-narrow">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="lx-mark lx-enter" src="/assets/icon_logo.svg" alt="Mix" width={95} height={105} />
        <h1 className="lx-display lx-enter lx-enter-1">Flutter styling without<br />the boilerplate.</h1>
        <p className="lx-lead lx-enter lx-enter-2">
          Fluent, chainable styles. Reactive variants. Design tokens. Build design systems that scale.
        </p>
        <div className="lx-hero-cta lx-enter lx-enter-3">
          <LandingButton href="/mix/docs/overview/getting-started/" arrow>Get started</LandingButton>
          <LandingButton href="/mix/docs/" variant="secondary">Read the docs</LandingButton>
        </div>
      </div>
    </section>

    <section className="lx-shell lx-shell-narrow lx-gap" aria-labelledby="why-mix">
      <SectionHead align="left" eyebrow="Why Mix" id="why-mix" title="Less nesting. More clarity." />
      <div className="lx-compare">
        <div>
          <span className="lx-code-label">Without Mix</span>
          <div className="lx-code-surface"><CodeBlock code={WITHOUT_MIX} /></div>
        </div>
        <div className="lx-compare-good">
          <span className="lx-code-label">With Mix</span>
          <div className="lx-code-surface"><CodeBlock code={WITH_MIX} /></div>
        </div>
      </div>
    </section>

    <section className="lx-shell lx-gap" aria-labelledby="home-features">
      <SectionHead
        align="left"
        eyebrow="Features"
        id="home-features"
        title="Style composition, reactive variants and design tokens — in one package."
        lead="Mix uses Dart's type system to make styles composable and type-safe. Chain methods to build styles, compose them with variants, and let the framework handle the rest."
      />
      <MixFeatures only={HOME_FEATURE_IDS} />
    </section>

    <section className="lx-shell lx-gap" aria-labelledby="projects">
      <SectionHead
        eyebrow="Three projects"
        id="projects"
        title="One toolkit for styling, components and behaviour."
        lead="Each project keeps its own documentation. Search and navigation span all three."
      />
      <div className="lx-siblings lx-reveal">
        {PROJECT_IDS.map(id => <ProjectCard key={id} id={id} />)}
      </div>
    </section>

    <InstallSection />
  </div>;
}
