import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';
import { ArrowRight } from './icons';

type ButtonProps = {
  href: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  arrow?: boolean;
  children: ReactNode;
} & Omit<ComponentProps<typeof Link>, 'href' | 'children'>;

/** One call-to-action for every landing; the project scope supplies the accent. */
export function LandingButton({ href, variant = 'primary', arrow, children, className, ...props }: ButtonProps) {
  const classes = `lx-btn lx-btn-${variant}${className ? ` ${className}` : ''}`;
  const inner = <>{children}{arrow && <ArrowRight />}</>;
  // Flutter bundles and the catalog are published assets, not app routes, so
  // they must not be prefetched as Next pages.
  if (/^(?:[a-z]+:)?\/\//.test(href) || href.startsWith('/remix/catalog')) {
    return <a className={classes} href={href} {...(href.startsWith('/') ? {} : { target: '_blank', rel: 'noreferrer' })}>{inner}</a>;
  }
  return <Link className={classes} href={href} {...props}>{inner}</Link>;
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
