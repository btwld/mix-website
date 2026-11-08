import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { codeToHtml } from 'shiki';
import { DARK_CODE_THEME } from '@/lib/code-theme';

const PACKAGE = path.join(process.cwd(), 'packages/mix_showcase');
const SOURCE = path.join(PACKAGE, 'lib');
const REPOSITORY = 'https://github.com/btwld/mix-website';

export type SourcePart = { file: string; start: number; end: number };
export type SourceDefinition = { name: string; file: string; line: number };
export type SourceUses = { file: string; definitions: SourceDefinition[] };
export type ShowcaseCode = Record<string, { html: string; raw: string; parts: SourcePart[]; uses: SourceUses[] }>;
export type ShowcasePackage = {
  libraries: Record<'mix' | 'remix' | 'naked_ui', { version: string; command: string }>;
  dart: string;
  flutter: string;
  requirements: string;
  cli: { version: string; command: string };
  registry: { revision: string; url: string };
  /** Only clean, identified builds can promise matching GitHub source lines. */
  github: { package: string; files: string; pinned: boolean; reference: string; dirty: boolean };
};

/** Paths stay relative to lib, including installed recipes and generated Dart. */
export async function showcaseDartFiles(directory = SOURCE): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map(async entry => {
    if (entry.isDirectory()) return (await showcaseDartFiles(path.join(directory, entry.name))).map(file => `${entry.name}/${file}`);
    return entry.isFile() && entry.name.endsWith('.dart') ? [entry.name] : [];
  }));
  return files.flat().sort();
}

export async function showcasePackage(): Promise<ShowcasePackage> {
  const pubspec = await readFile(path.join(PACKAGE, 'pubspec.yaml'), 'utf8');
  const remix = await readFile(path.join(PACKAGE, 'remix.yaml'), 'utf8');
  const revision = remix.match(/^    revision: "([a-f0-9]{40})"$/m)?.[1];
  const repository = remix.match(/^    repository: "([\w.-]+\/[\w.-]+)"$/m)?.[1];
  if (!revision || !repository) throw new Error('Missing pinned Remix registry provenance in remix.yaml');
  const libraries = Object.fromEntries(['mix', 'remix', 'naked_ui'].map(name => {
    const constraint = pubspec.match(new RegExp(`^  ${name}: ["']?([^"'\\s]+)`, 'm'))?.[1];
    if (!constraint) throw new Error(`Missing pub version for ${name}`);
    const version = constraint.replace(/^[\^~]/, '');
    // A prerelease range like ^1.0.0-0 takes the newest beta now and the stable release once
    // it ships, so the command never names a specific beta.
    const command = `flutter pub add ${version.includes('-') ? `"${name}:^${version.split('-')[0]}-0"` : name}`;
    return [name, { version, command }];
  })) as ShowcasePackage['libraries'];
  const floor = (key: string, label: string) => {
    const version = pubspec.match(new RegExp(`^  ${key}: ["']?>=([0-9]+\\.[0-9]+)(?:\\.([0-9]+))?`, 'm'));
    if (!version) throw new Error(`Missing ${label} floor`);
    return `${label} ${version[1]}${version[2] && version[2] !== '0' ? `.${version[2]}` : ''}+`;
  };
  const dart = floor('sdk', 'Dart');
  const flutter = floor('flutter', 'Flutter');
  const cliVersion = pubspec.match(/^  remix_cli: ["']?([^"'\s]+)/m)?.[1]?.replace(/^[\^~]/, '');
  if (!cliVersion) throw new Error('Missing project-local Remix CLI version');
  let commit: string | null = null;
  let dirty = false;
  try {
    const site = JSON.parse(await readFile(path.join(process.cwd(), 'public/__site.json'), 'utf8'));
    if (typeof site.commit === 'string' && site.commit) commit = site.commit;
    dirty = site.dirty === true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
  const reference = `${encodeURIComponent(commit ?? 'main')}/packages/mix_showcase`;
  return { libraries, dart, flutter, cli: { version: cliVersion, command: `flutter pub add --dev remix_cli:${cliVersion}` }, requirements: `Requires ${flutter} (${dart}).`, registry: { revision, url: `https://github.com/${repository}/tree/${revision}/registry` }, github: { package: `${REPOSITORY}/tree/${reference}`, files: `${REPOSITORY}/blob/${reference}`, pinned: commit !== null && !dirty, reference: commit ?? 'main', dirty } };
}

function region(file: string, name: string, source: string) {
  const lines = source.split('\n');
  const start = lines.findIndex(line => line.trim() === `// #docregion ${name}`);
  const end = lines.findIndex((line, index) => index > start && line.trim() === `// #enddocregion ${name}`);
  if (start < 0 || end < start) throw new Error(`Missing docregion ${name} in ${file}`);
  const body = lines.slice(start + 1, end).flatMap((line, index) => line.trim().startsWith('// #') ? [] : [{ text: line, line: start + index + 2 }]);
  const indent = Math.min(...body.filter(line => line.text.trim()).map(line => line.text.match(/^ */)![0].length));
  return { file, start: body[0].line, end: body.at(-1)!.line, raw: body.map(line => line.text.slice(indent)).join('\n') };
}

function identifiers(source: string) {
  return source.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*|r?(?:'''[\s\S]*?'''|"""[\s\S]*?"""|'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*")/g, match => match.replace(/[^\n]/g, ' '));
}

function declarations(file: string, source: string): SourceDefinition[] {
  const definitions: SourceDefinition[] = [];
  let depth = 0;
  identifiers(source).split('\n').forEach((line, index) => {
    if (depth === 0 && /^\S/.test(line) && !/^(?:import|export|part|library)\b/.test(line)) {
      const name = line.match(/^(?:(?:abstract|base|final|interface|sealed)\s+)*(?:class|enum|mixin)\s+([\w$]+)/)?.[1]
        ?? line.match(/^(?:const|final|var)\s+(?:[\w$<>?, ]+\s+)?([\w$]+)\s*=/)?.[1]
        ?? line.match(/^[\w$<>?, ]+\s+([\w$]+)\s*\(/)?.[1];
      if (name) definitions.push({ name, file, line: index + 1 });
    }
    for (const character of line) {
      if ('({['.includes(character)) depth++;
      if (')}]'.includes(character)) depth--;
    }
  });
  return definitions;
}

function uses(parts: (SourcePart & { raw: string })[], definitions: SourceDefinition[]): SourceUses[] {
  const groups = new Map<string, SourceDefinition[]>();
  const own = new Set(definitions.filter(definition => parts.some(part => part.file === definition.file && definition.line >= part.start && definition.line <= part.end)).map(definition => definition.name));
  // Local declarations must not link to an unrelated top-level name.
  for (const part of parts) for (const match of identifiers(part.raw).matchAll(/\b(?:final|const|var)\s+(?:[\w$<>?, ]+\s+)?([\w$]+)\s*=/g)) own.add(match[1]);
  const seen = new Set<string>();
  for (const part of parts) {
    const source = identifiers(part.raw);
    for (const match of source.matchAll(/[\w$]+/g)) {
      const name = match[0];
      if (own.has(name) || seen.has(name) || /[\w$.]/.test(source[match.index - 1] ?? '') || /^\s*:/.test(source.slice(match.index + name.length)) && !name.startsWith('$')) continue;
      const definition = definitions.find(item => item.name === name && item.file === part.file)
        ?? definitions.find(item => item.name === name && !name.startsWith('_'));
      if (!definition) continue;
      seen.add(name);
      const group = groups.get(definition.file) ?? [];
      group.push(definition);
      groups.set(definition.file, group);
    }
  }
  return [...groups].map(([file, definitions]) => ({ file, definitions }));
}

export async function showcaseCode(): Promise<ShowcaseCode> {
  const files = await showcaseDartFiles();
  const sources = Object.fromEntries(await Promise.all(files.map(async file => [file, await readFile(path.join(SOURCE, file), 'utf8')])));
  const definitions = files.flatMap(file => declarations(file, sources[file]));
  const entries: [string, [string, string][]][] = [
    ['token-declare', [['tokens.dart', 'token-declare']]],
    ...['midnight', 'paper', 'pop', 'cyber'].map(look => [`token-provide-${look}`, [['tokens.dart', `look-${look}`], ['tokens.dart', 'look-scope']]] as [string, [string, string][]]),
    ['token-use', [['styles.dart', 'card-style'], ['styles.dart', 'card-padding'], ['cards.dart', 'card-consumer']]],
    ['states', [['styles.dart', 'list-row'], ['cards.dart', 'pressable-row']]],
    ['adapt', [['styles.dart', 'card-padding'], ['cards.dart', 'responsive-deck']]],
    ['naked', [['cards.dart', 'naked-row']]],
    ['composition', [['styles.dart', 'card-style'], ['styles.dart', 'quiet-controls']]],
    ['transitions', [['styles.dart', 'motion-config'], ['styles.dart', 'card-style']]],
    ['springs', [['styles.dart', 'bar-style']]],
    ['keyframes', [['styles.dart', 'equalizer']]],
    ['remix', [['styles.dart', 'checkbox-style'], ['cards.dart', 'remix-checkbox']]],
    ['invite', [['invite.dart', 'invite-dialog'], ['invite.dart', 'toast-feedback']]],
    ['naked-invite', [['invite.dart', 'naked-invite']]],
    ['material-bridge', [['styles.dart', 'material-bridge']]],
    ['fortal-checkbox', [['fortal/components/checkbox.dart', 'fortal-checkbox']]],
    ['fortal-today', [['fortal_today.dart', 'fortal-today'], ['fortal_today.dart', 'fortal-control']]],
  ];
  return Object.fromEntries(await Promise.all(entries.map(async ([key, regions]) => {
    const parts = regions.map(([file, name]) => region(file, name, sources[file]));
    const raw = parts.map((part, index) => /^look-(midnight|paper|pop|cyber)$/.test(regions[index][1]) ? `${part.raw}\n  // Other look values are omitted here.\n);` : part.raw).join('\n\n');
    return [key, { html: await codeToHtml(raw, { lang: 'dart', theme: DARK_CODE_THEME }), raw, parts: parts.map(({ file, start, end }) => ({ file, start, end })), uses: uses(parts, definitions) }];
  })));
}
