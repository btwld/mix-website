import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { codeToHtml } from 'shiki';
import { DARK_CODE_THEME } from '@/lib/code-theme';

const SOURCE = path.join(process.cwd(), 'packages/mix_showcase/lib');

/** Reads one `#docregion`, so a displayed excerpt cannot drift from what runs. */
async function region(file: string, name: string) {
  const source = await readFile(path.join(SOURCE, file), 'utf8');
  const lines = source.split('\n');
  const start = lines.findIndex(line => line.trim() === `// #docregion ${name}`);
  const end = lines.findIndex(line => line.trim() === `// #enddocregion ${name}`);
  if (start < 0 || end < start) throw new Error(`Missing docregion ${name} in ${file}`);
  const body = lines.slice(start + 1, end).filter(line => !line.trim().startsWith('// #'));
  const indent = Math.min(...body.filter(Boolean).map(line => line.match(/^ */)![0].length));
  return body.map(line => line.slice(indent)).join('\n');
}

const closeLook = (code: string) => `${code}\n  // …\n);`;

export type ShowcaseCode = Record<string, { html: string; file: string }>;

export async function showcaseCode(): Promise<ShowcaseCode> {
  const entries: [string, string, string, (code: string) => string][] = [
    ['midnight', 'tokens.dart', 'look-midnight', closeLook],
    ['paper', 'tokens.dart', 'look-paper', closeLook],
    ['pop', 'tokens.dart', 'look-pop', closeLook],
    ['cyber', 'tokens.dart', 'look-cyber', closeLook],
    ['states', 'styles.dart', 'list-row', code => code],
    ['adapt', 'styles.dart', 'page-padding', code => code],
    ['motion', 'styles.dart', 'equalizer', code => code],
    ['naked', 'cards.dart', 'naked-row', code => code],
  ];
  const rendered = await Promise.all(entries.map(async ([key, file, name, finish]) => {
    const code = finish(await region(file, name));
    return [key, { html: await codeToHtml(code, { lang: 'dart', theme: DARK_CODE_THEME }), file }] as const;
  }));
  return Object.fromEntries(rendered);
}
