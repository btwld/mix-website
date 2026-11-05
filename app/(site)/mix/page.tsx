import Link from 'next/link';
import type { Metadata } from 'next';
import { InstallSection } from '@/components/landing/install-section';
import { MixCodegen } from '@/components/landing/mix-codegen';
import { MixFeatures } from '@/components/landing/mix-features';
import { HeroBackdrop, LandingButton, SectionHead } from '@/components/landing/ui';
import { ArrowRight } from '@/components/landing/icons';
import { PROJECTS } from '@/lib/projects.mjs';
import { canonicalMetadata } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Mix',
  description: PROJECTS.mix.description,
  ...canonicalMetadata(PROJECTS.mix.overviewPath),
};

export default function MixOverview() {
  return <div className="lx lx-mix">
    <section className="lx-band">
      <HeroBackdrop />
      <div className="lx-shell lx-shell-narrow">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="lx-mark lx-enter" src="/assets/icon_logo.svg" alt="" width={95} height={105} />
        <h1 className="lx-display lx-enter lx-enter-1">Mix</h1>
        <p className="lx-lead lx-enter lx-enter-2">
          Flutter styling without the boilerplate. {PROJECTS.mix.description}
        </p>
        <div className="lx-hero-cta lx-enter lx-enter-3">
          <LandingButton href={PROJECTS.mix.startPath} arrow>Get started</LandingButton>
          <LandingButton href={`${PROJECTS.mix.docsBase}/`} variant="secondary">Documentation</LandingButton>
          <LandingButton href={PROJECTS.mix.codeRepository} variant="secondary">Source on GitHub</LandingButton>
        </div>
      </div>
    </section>

    <section className="lx-shell lx-gap" aria-labelledby="mix-features">
      <SectionHead
        align="left"
        eyebrow="Features"
        id="mix-features"
        title="Style composition, reactive variants and design tokens — in one package."
        lead="Explore real Flutter widgets alongside the Dart code that creates them."
      />
      <MixFeatures />
    </section>

    <MixCodegen />

    <InstallSection>
      Mix 2.3.1 requires Dart 3.12 and Flutter 3.44 or newer.{' '}
      <Link className="lx-inline-link" href={PROJECTS.mix.startPath}>Installation details<ArrowRight /></Link>
    </InstallSection>
  </div>;
}
