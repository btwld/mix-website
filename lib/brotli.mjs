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

/**
 * A Next `has` condition: the request's Accept-Encoding lists `br`, and not
 * with a zero quality (`br;q=0` refuses it). Next matches it as `^value$`.
 */
export const ACCEPTS_BROTLI = [{
  type: 'header',
  key: 'accept-encoding',
  value: '(?:.*[\\s,])?br(?!\\s*;\\s*[qQ]\\s*=\\s*0(?:\\.0{0,3})?\\s*(?:,|$))(?:[\\s;,].*)?',
}];
