// Runs before first paint, ahead of hydration, so a landing never flashes its
// sections in and then hides them. Plain DOM on purpose: if React failed to
// hydrate, the observer still runs and the content still appears.
//
// `lx-js` is only set when the reader welcomes motion, so reduced motion and
// no-JS both fall through to the plain, fully visible stylesheet. A mutation
// observer picks up sections added by client-side navigation, which would
// otherwise stay hidden after the first page.
const SCRIPT = `(function(){
  try {
    if (!window.IntersectionObserver || !window.MutationObserver) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    document.documentElement.classList.add('lx-js');
    var seen = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.setAttribute('data-shown', '');
        seen.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -12% 0px' });
    var scan = function (root) {
      if (!root || root.nodeType !== 1) return;
      if (root.classList.contains('lx-reveal') && !root.hasAttribute('data-shown')) seen.observe(root);
      root.querySelectorAll('.lx-reveal:not([data-shown])').forEach(function (el) { seen.observe(el); });
    };
    var watch = function () {
      scan(document.body);
      new MutationObserver(function (records) {
        records.forEach(function (record) { record.addedNodes.forEach(scan); });
      }).observe(document.body, { childList: true, subtree: true });
    };
    if (document.body) watch();
    else document.addEventListener('DOMContentLoaded', watch);
  } catch (error) {
    document.documentElement.classList.remove('lx-js');
  }
})();`;

export function RevealScript() {
  return <script dangerouslySetInnerHTML={{ __html: SCRIPT }} />;
}
