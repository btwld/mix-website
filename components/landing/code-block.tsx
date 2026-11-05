import { codeToHtml } from 'shiki';
import { DARK_CODE_THEME } from '@/lib/code-theme';

/**
 * Static Dart for the landings, highlighted on the server. The original
 * highlighted in a client effect, which shipped Shiki to the browser and
 * flashed unstyled code; prerendering puts the real markup in the HTML so the
 * rendered audit and search crawlers see it.
 *
 * Live, locked preview sources keep using FlutterSnippet: those bytes are
 * fetched from the pinned bundle and must not be inlined here.
 */
export async function CodeBlock({ code, className = 'lx-code-pad' }: {
  code: string;
  className?: string;
}) {
  const html = await codeToHtml(code, { lang: 'dart', theme: DARK_CODE_THEME });
  return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}
