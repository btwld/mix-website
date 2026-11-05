/** Stored on the page global so replacement chunks/HMR cannot forget the engine owner. */
export function acceptMixBundle(page, basePath) {
  const identity = new URL(basePath.replace(/\/$/, '') + '/', page.location.href).href;
  if (page.__MIX_FLUTTER_BUNDLE__ && page.__MIX_FLUTTER_BUNDLE__ !== identity) {
    page.location.reload();
    return false;
  }
  page.__MIX_FLUTTER_BUNDLE__ = identity;
  return true;
}
