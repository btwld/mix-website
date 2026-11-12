import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';
import { isFlutterAppPath } from '@/lib/projects.mjs';
import { ArrowRight } from './icons';

type ButtonProps = {
  href: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  arrow?: boolean;
  children: ReactNode;
  prefetch?: boolean;
} & Omit<ComponentProps<'a'>, 'href' | 'children'>;

/** One call-to-action for every landing; the project scope supplies the accent. */
export function LandingButton({ href, variant = 'primary', arrow, children, className, prefetch, ...props }: ButtonProps) {
  const classes = `lx-btn lx-btn-${variant}${className ? ` ${className}` : ''}`;
  const inner = <>{children}{arrow && <ArrowRight />}</>;
  // Flutter bundles and apps such as the catalog are published assets, not app routes, so
  // they must not be prefetched as Next pages.
  if (/^(?:[a-z]+:)?\/\//.test(href) || isFlutterAppPath(href)) {
    return <a className={classes} href={href} target={href.startsWith('/') ? undefined : '_blank'} rel={href.startsWith('/') ? undefined : 'noreferrer'} {...props}>{inner}</a>;
  }
  return <Link className={classes} href={href} prefetch={prefetch} {...props}>{inner}</Link>;
}

/** Sits directly under `.lx`, so the glow and grid flow past the hero band. */
export function HeroBackdrop() {
  return <div className="lx-band-media lx-band-ambient" aria-hidden="true">
    <div className="lx-band-aurora" />
    <div className="lx-band-grid" />
  </div>;
}

/** The same panel chrome surrounds static code and running Flutter examples. */
export function WindowBar({ label, children }: { label?: string; children?: ReactNode }) {
  return <div className={`lx-window-bar${label ? ' lx-window-bar-start' : ''}`}>
    <div className="lx-dots" aria-hidden="true"><span /><span /><span /></div>
    {label ? <span className="lx-window-file">{label}</span> : children}
  </div>;
}

export type Feature = {
  icon: (props: ComponentProps<'svg'>) => ReactNode;
  title: string;
  body: string;
  wide?: boolean;
};

export function FeatureCards({ items }: { items: Feature[] }) {
  return <div className="lx-cards lx-reveal">
    {items.map(({ icon: Icon, title, body, wide }) => <article key={title} className={`lx-card${wide ? ' lx-card-wide' : ''}`}>
      <span className="lx-card-icon" aria-hidden="true"><Icon /></span>
      <h3>{title}</h3>
      <p>{body}</p>
    </article>)}
  </div>;
}

export function SectionHead({ eyebrow, title, lead, align = 'center', id }: {
  eyebrow?: string;
  title: ReactNode;
  lead?: ReactNode;
  align?: 'center' | 'left';
  id?: string;
}) {
  return <div className={`lx-head lx-reveal${align === 'center' ? ' lx-head-center' : ''}`}>
    {eyebrow && <span className="lx-eyebrow">{eyebrow}</span>}
    <h2 className="lx-title" id={id}>{title}</h2>
    {lead && <p className="lx-lead">{lead}</p>}
  </div>;
}

export function Faq({ items }: { items: { q: string; a: string }[] }) {
  return <div className="lx-faq lx-reveal">
    {items.map(item => <details key={item.q} className="lx-faq-item">
      <summary>{item.q}<span className="lx-faq-icon" aria-hidden="true" /></summary>
      <p>{item.a}</p>
    </details>)}
  </div>;
}
