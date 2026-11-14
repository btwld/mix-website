// Next compresses responses with gzip only. Flutter bundles are staged with a
// Brotli copy beside each file of these types (scripts/site-inputs/sync-lib.mjs),
// and next.config.mjs serves that copy to browsers that accept Brotli.

/** Pre-compressed file types and the Content-Type each is served with. */
export const BROTLI_TYPES = {
  wasm: 'application/wasm',
  js: 'application/javascript; charset=UTF-8',
  mjs: 'application/javascript; charset=UTF-8',
  frag: 'application/octet-stream',
  ttf: 'font/ttf',
  otf: 'font/otf',
};

/** A Next `has` condition: the request's Accept-Encoding lists `br`. */
export const ACCEPTS_BROTLI = [{ type: 'header', key: 'accept-encoding', value: '(?:.*[\\s,])?br(?:[\\s;,].*)?' }];
