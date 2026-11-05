import { codeToHtml } from 'shiki';

/**
 * Static Dart for the landings, highlighted on the server. The original
 * highlighted in a client effect, which shipped Shiki to the browser and
 * flashed unstyled code; prerendering puts the real markup in the HTML so the
 * rendered audit and search crawlers see it.
 *
 * Live, locked preview sources keep using FlutterSnippet: those bytes are
 * fetched from the pinned bundle and must not be inlined here.
 */
export async function CodeBlock({ code, label, className = 'lx-code-pad' }: {
  code: string;
  label?: string;
  className?: string;
}) {
  const html = await codeToHtml(code, { lang: 'dart', theme: 'github-dark' });
  return <>
    {label && <span className="lx-code-label">{label}</span>}
    <div className={className} dangerouslySetInnerHTML={{ __html: html }} />
  </>;
}
