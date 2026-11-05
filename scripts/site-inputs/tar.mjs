// Minimal deterministic ustar writer and a strict reader for site-input archives.
//
// Site inputs only ever contain regular files, so the reader rejects every
// other entry type (links, devices, pax/GNU extension headers) and any path
// that could escape the destination. Keeping this dependency-free means the
// prebuild that runs inside Firebase App Hosting trusts no archive tooling.
import { createHash } from 'node:crypto';
import { mkdir, readdir, readFile, lstat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { gunzipSync, gzipSync } from 'node:zlib';

const BLOCK = 512;
const MAX_ENTRIES = 20_000;
const MAX_TOTAL_BYTES = 1024 * 1024 * 1024;

export function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

/** Reject anything other than a plain relative POSIX path with no `.`/`..` segments. */
export function assertSafeEntryPath(entryPath) {
  if (typeof entryPath !== 'string' || entryPath.length === 0) throw new Error('Archive entry has an empty path');
  if (entryPath.includes('\0') || entryPath.includes('\\')) throw new Error(`Archive entry has an invalid character: ${JSON.stringify(entryPath)}`);
  if (entryPath.startsWith('/') || /^[A-Za-z]:/.test(entryPath)) throw new Error(`Archive entry is absolute: ${entryPath}`);
  for (const segment of entryPath.split('/')) {
    if (segment === '' || segment === '.' || segment === '..') throw new Error(`Archive entry is not normalized: ${entryPath}`);
  }
  return entryPath;
}

async function listFiles(root, relative = '') {
  const entries = await readdir(path.join(root, relative), { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const child = relative ? `${relative}/${entry.name}` : entry.name;
    const stats = await lstat(path.join(root, child));
    if (stats.isSymbolicLink()) throw new Error(`Refusing to pack symbolic link: ${child}`);
    if (stats.isDirectory()) files.push(...await listFiles(root, child));
    else if (stats.isFile()) files.push(child);
    else throw new Error(`Refusing to pack non-regular file: ${child}`);
  }
  return files;
}

function splitPath(entryPath) {
  const bytes = Buffer.byteLength(entryPath);
  if (bytes <= 100) return { name: entryPath, prefix: '' };
  for (let index = entryPath.indexOf('/'); index !== -1; index = entryPath.indexOf('/', index + 1)) {
    const prefix = entryPath.slice(0, index);
    const name = entryPath.slice(index + 1);
    if (Buffer.byteLength(prefix) <= 155 && Buffer.byteLength(name) <= 100) return { name, prefix };
  }
  throw new Error(`Path is too long for ustar: ${entryPath}`);
}

function octal(value, width) {
  return value.toString(8).padStart(width - 1, '0') + '\0';
}

function header(entryPath, size) {
  const { name, prefix } = splitPath(entryPath);
  const block = Buffer.alloc(BLOCK);
  block.write(name, 0, 100, 'utf8');
  block.write(octal(0o644, 8), 100, 'ascii');
  block.write(octal(0, 8), 108, 'ascii');
  block.write(octal(0, 8), 116, 'ascii');
  block.write(octal(size, 12), 124, 'ascii');
  block.write(octal(0, 12), 136, 'ascii');
  block.fill(' ', 148, 156);
  block.write('0', 156, 'ascii');
  block.write('ustar\0', 257, 'ascii');
  block.write('00', 263, 'ascii');
  block.write(prefix, 345, 155, 'utf8');
  let sum = 0;
  for (const byte of block) sum += byte;
  block.write(sum.toString(8).padStart(6, '0') + '\0 ', 148, 'ascii');
  return block;
}

/** Pack every regular file under `root` in byte order with fixed metadata. */
export async function packDirectory(root) {
  const files = (await listFiles(root)).sort((a, b) => Buffer.compare(Buffer.from(a), Buffer.from(b)));
  const chunks = [];
  for (const file of files) {
    assertSafeEntryPath(file);
    const data = await readFile(path.join(root, file));
    chunks.push(header(file, data.length), data);
    const padding = (BLOCK - (data.length % BLOCK)) % BLOCK;
    if (padding) chunks.push(Buffer.alloc(padding));
  }
  chunks.push(Buffer.alloc(BLOCK * 2));
  return { archive: gzipSync(Buffer.concat(chunks), { level: 9 }), files };
}

function readString(block, start, length) {
  const slice = block.subarray(start, start + length);
  const end = slice.indexOf(0);
  return slice.subarray(0, end === -1 ? length : end).toString('utf8');
}

function readOctal(block, start, length) {
  const text = readString(block, start, length).trim();
  if (!/^[0-7]*$/.test(text)) throw new Error('Archive header has a non-octal number');
  return text ? parseInt(text, 8) : 0;
}

/** Parse a gzip-compressed ustar archive into `{ path, data }` regular-file entries. */
export function readArchive(gzipped) {
  const tar = gunzipSync(gzipped);
  const entries = [];
  const seen = new Set();
  let total = 0;
  for (let offset = 0; offset + BLOCK <= tar.length;) {
    const block = tar.subarray(offset, offset + BLOCK);
    if (block.every(byte => byte === 0)) return entries;
    const expected = readOctal(block, 148, 8);
    let sum = 0;
    for (let index = 0; index < BLOCK; index++) sum += index >= 148 && index < 156 ? 32 : block[index];
    if (sum !== expected) throw new Error(`Archive header checksum mismatch at byte ${offset}`);
    if (readString(block, 257, 6) !== 'ustar') throw new Error('Archive is not ustar');
    const type = String.fromCharCode(block[156] || 48);
    const prefix = readString(block, 345, 155);
    const name = readString(block, 0, 100);
    const entryPath = prefix ? `${prefix}/${name}` : name;
    const size = readOctal(block, 124, 12);
    offset += BLOCK;
    if (type === '5') { offset += Math.ceil(size / BLOCK) * BLOCK; continue; }
    if (type !== '0') throw new Error(`Archive entry ${entryPath} has unsupported type ${JSON.stringify(type)}`);
    assertSafeEntryPath(entryPath);
    if (seen.has(entryPath)) throw new Error(`Archive entry is duplicated: ${entryPath}`);
    seen.add(entryPath);
    if (offset + size > tar.length) throw new Error(`Archive entry ${entryPath} is truncated`);
    total += size;
    if (entries.length >= MAX_ENTRIES || total > MAX_TOTAL_BYTES) throw new Error('Archive exceeds size limits');
    entries.push({ path: entryPath, data: tar.subarray(offset, offset + size) });
    offset += Math.ceil(size / BLOCK) * BLOCK;
  }
  throw new Error('Archive is missing its end-of-archive marker');
}

/** Write parsed entries below `destination`; callers clear the destination first. */
export async function writeEntries(entries, destination) {
  const root = path.resolve(destination);
  for (const entry of entries) {
    const target = path.resolve(root, entry.path);
    if (!target.startsWith(root + path.sep)) throw new Error(`Archive entry escapes destination: ${entry.path}`);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, entry.data);
  }
}
