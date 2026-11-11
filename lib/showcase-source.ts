import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { codeToTokens } from 'shiki';
import { DARK_CODE_THEME } from '@/lib/code-theme';
import { EXCERPTS, type ExcerptKey } from '@/lib/showcase-excerpts';

type Marks = Record<string, string | string[]>;
type Spec = { file: string; region?: string; from?: string; through?: string; marks?: Marks; blocks?: Marks; lines?: Marks };

const PACKAGE = path.join(process.cwd(), 'packages/mix_showcase');
const SOURCE = path.join(PACKAGE, 'lib');
const REPOSITORY = 'https://github.com/btwld/mix-website';

export type CodeToken = { text: string; color?: string; italic?: boolean };
/** `n` is the line's number in its file; an elision has none. */
export type CodeLine = { n: number | null; tokens: CodeToken[]; marks: string[] };
export type Excerpt = {
  /** Path below `lib/`. */
  file: string;
  lines: CodeLine[];
  /** Exactly what the copy button copies. */
  raw: string;
  ranges: { start: number; end: number }[];
  /** Whether the excerpt is every line of the file. */
  whole: boolean;
  /** Lines in the file the excerpt was cut from. */
  total: number;
};
export type ShowcaseCode = Record<ExcerptKey, Excerpt>;

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
  return { libraries, dart, flutter, cli: { version: cliVersion, command: `dart pub global activate remix_cli "^${cliVersion}"` }, requirements: `${flutter} · ${dart}`, registry: { revision, url: `https://github.com/${repository}/tree/${revision}/registry` }, github: { package: `${REPOSITORY}/tree/${reference}`, files: `${REPOSITORY}/blob/${reference}`, pinned: commit !== null && !dirty, reference: commit ?? 'main', dirty } };
}

const regionMarker = (line: string) => /^\s*\/\/ #(?:end)?docregion\b/.test(line);
// An excerpt also drops the formatter switches around stacked style code. A whole
// file keeps them, so its line numbers count without gaps, as in an editor.
const marker = (line: string) => regionMarker(line) || /^\s*\/\/ dart format (?:off|on)$/.test(line);
const indentOf = (line: string) => line.match(/^ */)![0].length;
type SourceLine = { text: string; n: number | null };

/**
 * A region may reopen with the same name, as in Dart's code excerpter. The
 * source skipped between its segments is shown as `// ···` at the indentation
 * of the first omitted line, and every kept line keeps its own line number.
 */
function region(file: string, name: string, source: string): SourceLine[] {
  const lines = source.split('\n');
  const segments: SourceLine[][] = [];
  const omitted: number[] = [];
  let from = 0;
  for (;;) {
    const start = lines.findIndex((line, index) => index >= from && line.trim() === `// #docregion ${name}`);
    if (start < 0) break;
    const end = lines.findIndex((line, index) => index > start && line.trim() === `// #enddocregion ${name}`);
    if (end < 0) throw new Error(`Unclosed docregion ${name} in ${file}`);
    const body = lines.slice(start + 1, end).flatMap((text, index) => marker(text) ? [] : [{ text, n: start + index + 2 }]);
    if (!body.length) throw new Error(`Empty docregion ${name} in ${file}`);
    segments.push(body);
    omitted.push(indentOf(lines.slice(end + 1).find(line => line.trim() && !marker(line)) ?? ''));
    from = end + 1;
  }
  if (!segments.length) throw new Error(`Missing docregion ${name} in ${file}`);
  return segments.flatMap((body, index) => [
    ...(index > 0 ? [{ text: `${' '.repeat(omitted[index - 1])}// ···`, n: null }] : []),
    ...body,
  ]);
}

/** A whole file, without the excerpt markers other excerpts cut it by. */
function whole(source: string): SourceLine[] {
  const lines = source.replace(/\n$/, '').split('\n');
  return lines.flatMap((text, index) => regionMarker(text) ? [] : [{ text, n: index + 1 }]);
}

/**
 * A declaration in a file without markers: from the line containing `text` to
 * the `}` that closes it. With `open`, it runs on and `through` ends it instead.
 */
function declaration(file: string, text: string, source: string, open = false): SourceLine[] {
  const lines = source.split('\n');
  const start = lines.findIndex(line => line.includes(text));
  if (start < 0) throw new Error(`Nothing in ${file} matches ${text}`);
  const end = open ? lines.length - 1 : lines.findIndex((line, index) => index > start && line === '}');
  if (end < 0) throw new Error(`The declaration at ${text} in ${file} never closes`);
  return lines.slice(start, end + 1).map((line, index) => ({ text: line, n: start + index + 1 }));
}

const BRACKETS = /'(?:\\.|[^'\\])*'/g;
function depthChange(text: string) {
  let depth = 0;
  for (const character of text.replace(BRACKETS, '')) {
    if ('([{'.includes(character)) depth++;
    if (')]}'.includes(character)) depth--;
  }
  return depth;
}

/**
 * A mark names the lines a control or a live state points at. It covers every
 * place the text occurs. A call runs until the brackets it opens close; a block
 * runs to the end of its statement or declaration; a line is that line alone.
 * A trailing `\n` in the text means the line must end there.
 */
function marked(key: string, lines: SourceLine[], marks: Marks, extent: 'call' | 'block' | 'line'): Record<number, string[]> {
  const whole = extent === 'block';
  const result: Record<number, string[]> = {};
  for (const [name, patterns] of Object.entries(marks)) {
    for (const given of [patterns].flat()) {
      const atEnd = given.endsWith('\n');
      const pattern = atEnd ? given.slice(0, -1) : given;
      const starts = lines.flatMap((line, index) => line.n !== null && (atEnd ? line.text.trimEnd().endsWith(pattern) : line.text.includes(pattern)) ? [index] : []);
      if (!starts.length) throw new Error(`Excerpt ${key}: nothing matches the mark ${name} (${pattern})`);
      for (const start of starts) {
        let depth = 0;
        let end = start;
        for (let index = start; extent !== 'line' && index < lines.length; index++) {
          const text = !whole && index === start ? lines[index].text.slice(lines[index].text.indexOf(pattern)) : lines[index].text;
          depth += depthChange(text);
          end = index;
          if (depth <= 0 && (!whole || /[;}]\s*$/.test(text))) break;
        }
        for (let index = start; index <= end; index++) if (!(result[index] ??= []).includes(name)) result[index].push(name);
      }
    }
  }
  return result;
}

export async function showcaseCode(): Promise<ShowcaseCode> {
  const cache = new Map<string, Promise<string>>();
  const read = (file: string) => {
    if (!cache.has(file)) cache.set(file, readFile(path.join(SOURCE, file), 'utf8'));
    return cache.get(file)!;
  };
  const entries = await Promise.all((Object.entries(EXCERPTS) as [string, Spec][]).map(async ([key, spec]) => {
    const source = await read(spec.file);
    let cut = spec.region ? region(spec.file, spec.region, source) : spec.from ? declaration(spec.file, spec.from, source, Boolean(spec.through)) : whole(source);
    if (spec.through) {
      const last = cut.findIndex(line => line.text.includes(spec.through!));
      if (last < 0) throw new Error(`Excerpt ${key}: nothing matches through (${spec.through})`);
      cut = cut.slice(0, last + 1);
    }
    const indent = Math.min(...cut.filter(line => line.text.trim()).map(line => indentOf(line.text)));
    const lines = cut.map(line => ({ ...line, text: line.text.slice(Math.min(indent, indentOf(line.text))) }));
    const raw = lines.map(line => line.text).join('\n');
    const { tokens } = await codeToTokens(raw, { lang: 'dart', theme: DARK_CODE_THEME });
    const calls = marked(key, lines, spec.marks ?? {}, 'call');
    const blocks = marked(key, lines, spec.blocks ?? {}, 'block');
    const single = marked(key, lines, spec.lines ?? {}, 'line');
    const ranges: Excerpt['ranges'] = [];
    for (const { n } of lines) {
      if (n === null) continue;
      const last = ranges.at(-1);
      if (last && n <= last.end + 1) last.end = n; else ranges.push({ start: n, end: n });
    }
    const total = source.replace(/\n$/, '').split('\n').length;
    const excerpt: Excerpt = {
      file: spec.file,
      raw,
      ranges,
      total,
      whole: !spec.region && !spec.from,
      lines: lines.map((line, index) => ({
        n: line.n,
        marks: [...(calls[index] ?? []), ...(blocks[index] ?? []), ...(single[index] ?? [])],
        tokens: (tokens[index] ?? []).map(token => ({ text: token.content, color: token.color, ...(token.fontStyle === 1 ? { italic: true } : {}) })),
      })),
    };
    return [key, excerpt] as const;
  }));
  return Object.fromEntries(entries) as ShowcaseCode;
}
