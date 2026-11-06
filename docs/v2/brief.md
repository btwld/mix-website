# Website V2 brief

Prepared for Leo, November 6, 2026. Status: working prototype at `/v2/`, not
approved, not published. Nothing here has been committed, pushed or deployed.

## Goal

A version 2 of fluttermix.com that takes a different approach and showcases the
work with far more impact. The incumbent pages pass their tests, yet Leo found
them awkward, and iterating on them never revisited the approach.

## What was wrong

The site treats Flutter as small stamps inside web cards. Measured on the live
pages, views are 360×140 to 560×240, so the headline promises "your interfaces"
and the page shows one button in a large empty panel. On `/remix/` the complete
interface is a static capture. Nothing connects the three projects except prose
and cards, so the reader has to work out how Mix, Remix and Naked UI relate.

The exploration branch `codex/remix-blocks-exploration` polished that structure.
It remains uncommitted in its own checkout and was not changed by this work.

## The approach

**The page is a guided tour of one real, running app.** A large Flutter app stays
pinned while the story scrolls past it, and each chapter changes that same live
instance.

| Chapter | Project | What the app does |
| --- | --- | --- |
| Hero | Mix | Usable immediately, at full size |
| One app. Any look. | Mix tokens | Scrolling walks it through four identities |
| States are styles. | Mix variants | Hover and press rows |
| Same app, narrower screen. | Mix context | Reflows to phone width with real breakpoints |
| Motion lives in the style. | Mix animation | The equalizer plays a keyframe timeline |
| Build your interfaces… | Remix | X-ray names every Remix widget |
| Underneath, it's just behavior. | Naked UI | Same layout, styling off, real Naked widgets, live state flags |
| Every card is a block. | Blocks | Pick a block and it is ringed in place |

The three projects become three layers of one object, which is the journey the
earlier pages lacked.

## Subject

Leo found the first subject, a full-screen Launch checklist with a sidebar, too
heavy and not illustrative enough. The stage now shows **Cards** by default: a
wall of five varied blocks (Now playing, Today, Spending, Make it yours, Team).
Make it yours edits the tokens the whole stage reads as you drag.

The Prototype menu at the top right compares Cards, Single card, Phone and Full
app live, and `/v2/?subject=single` opens one directly. It is a review tool, kept
apart from the product and removed once a subject is chosen.

Under the stage, one slim bar shows a dash per chapter grouped by project. It
replaced two stacked rows after a comparison with Radix, shadcn, Stripe and Apple.
Each dash jumps to its chapter and the address follows, so a copied link lands on
the same chapter. The embedded app has no URL strategy, so it stays out of the
page's address bar; with Flutter's default the step links were cancelled.

An all-music deck was tried first. An independent review rejected it as one app
cut into pieces, and varied subjects show range better, so only Now playing
stayed.

The deck never scrolls. It fills the stage and drops a block when there is no
room, so a cut-off card fails a test rather than shipping.

**UI8 has not been available in this work.** No UI8 MCP server is configured for
Claude Code here, the Chrome extension was not connected, and ui8.net returned
403 to both direct requests and the fetch tool. That block was not worked around.
References used were the public shadcn, Radix, Tremor, Geist and coss pages and
the SimpleList notes from the earlier plan. No UI8 assets were used.

## Shape as a token

`ShapeToken` extends Mix's `MixToken`, so a look can change every corner without
touching a widget. The Cyber look (formerly Terminal) uses `CutCorners`, a custom
border with flat cuts on the top-left and bottom-right and a bright edge piece on
each cut, kept thin so it does not compete with the accent. Rounded looks animate
into it through Flutter's shape interpolation.

Cover art is generated from a grid of styled boxes instead of an image. It reads
the same tokens, so it repaints with each look: quarter circles in rounded looks
and triangles in Cyber.

## Checkbox check mark

`RemixCheckbox` does not centre its check. Because a sized Mix box forces a child
without alignment to fill it, `.size(20, 20).iconSize(12)` draws a 20px check and
silently ignores the icon size. The Radix path also runs edge to edge, so the mark
overflows the box.

- Registry recipes are correct: Vanilla and HeroUI set `.alignment(.center)`.
  PRs #162, #277 and #278 in `btwld/remix` all worked on this indicator.
- Remix's docs teach the bug: 4 of 4 sized `CheckboxStyler` examples in
  `docs/components` omit the alignment. Remix `main` has the same code.
- A one-line fix, `Center(child: indicator)` in `checkbox_widget.dart`, corrects
  the unaligned case. Remix's 147 checkbox tests pass with it. The patch is not
  upstream.
- The showcase sets the alignment and has a test for it. Its checkboxes are also
  square-ish in every look, because a circle reads as a radio.

## Clipping

Leo's screenshot (`evidence/leo-clipping-screenshot.png`) was reproduced on
production in real Chrome on Apple M2 Max, Flutter 3.44, Skwasm
(`evidence/production-remix-820-reproduced.png`).

- **Cause:** with Skwasm multi-view, all views share one surface sized to
  whichever view rendered last. Headless SwiftShader checks did not represent this.
- **Visible:** the `/remix/` Button tile at about 820 to 1100px wide.
- **Latent:** `/mix/` at 1440px has the same undersized surface (360 wide views on
  a 255 wide bitmap), but its content happens to fit, so no cut was seen there.
- **Not affected:** WebKit, which uses CanvasKit.
- **Which build:** the screenshot shows the old `Row` sample with no Ghost button
  or feedback line, so it was almost certainly production or a main-based preview
  rather than the exploration build. The exact URL was never supplied.

The exploration's renderer change (`canvaskit` plus
`canvasKitForceMultiSurfaceRasterizer`) passed every Chrome and WebKit flow tried,
including client-side navigation from `/mix/` to `/remix/`.

V2 avoids the bug by construction. One view means one surface, and its bitmap
matched its host at every width tested.

## What exists

- `packages/mix_showcase`: the app, on Mix 2.3.1, Remix `ba450dc` and Naked UI
  1.5.0, which are the versions the docs describe. Styles are in `styles.dart`
  against tokens in `tokens.dart`; no style names a look.
- `app/(site)/v2/`, `components/v2/`, `app/v2.css`: the tour. Marked noindex.
- `lib/showcase-source.ts`: reads excerpts from the Dart source by docregion at
  build time, so displayed code cannot drift from what runs.
- All app state is local to the page. Sample data is labeled as such.

## Run it locally

The site does not build the Flutter app, so `/v2/` needs a local bundle first:

```bash
cd packages/mix_showcase
flutter build web --release --wasm --no-web-resources-cdn --no-source-maps
cd ../.. && cp -R packages/mix_showcase/build/web public/v2-flutter
pnpm build && pnpm start
```

Without that bundle, as on a PR preview, the stage says the app is not published.

## Verified

Run locally on November 6, 2026, against a production `next build` served by
`next start`.

- 237 Flutter tests, covering every subject, look, mode and stage size for layout
  overflow. Deliberately forcing a card onto a short stage made them fail, so the
  guard is real.
- Real Chrome: wheel over the canvas scrolls the page; scrolling alone walks all
  four looks; the look change animates (8 of 8 sampled frames distinct); bitmap
  matches host from 1000 to 1440px; hover, Tab and Space work in the Naked chapter.
- WebKit at 1440 and 390: loads through the self-hosted CanvasKit fallback, no
  errors, bitmap matches host, scroll-driven looks work.
- Website: 31 unit tests, TypeScript and the repository audit pass.
- Tour controls: every step, on desktop and in phone emulation, reaches its chapter
  in both directions. Keyboard activation, deep links and Back work, and all links
  on the page resolve.

## Not verified or not done

- Load time was simulated against a local server that does not compress wasm, so
  real hosting should do better. `/v2/` took 1.1s on broadband, 4.1s on fast 4G and
  21s on slow 4G, at 4.0MB. The current `/mix/` took 1.0s, 3.3s and 17s at 3.1MB.
  All fonts load up front (1.8MB), so loading them per look is the obvious saving.
- Touch was only tested in Chromium's phone emulation, not on a device. Vertical
  swipes now scroll the page through `touch-action: pan-y` on the Flutter view, and
  tap and sideways drag were confirmed to still reach the app.
- Reduced motion stops the auto-play, the scroll-driven looks, the equalizer and
  the phone reflow animation. Look changes a reader triggers still animate,
  because Mix does not read that preference.
- Screen readers: Flutter semantics not audited. No accessibility claim is made.
- `/`, `/mix/`, `/remix/` and `/naked-ui/` are unchanged. The tour is a separate route.
- Blocks have no full-source destination yet.
- `public/v2-flutter` is a local build output, so `/v2/` will not work in CI or
  on a preview until the release path below exists.

## Release path

1. Add a `mix-showcase` site input with the existing publish, pin and verify flow.
   Do not commit build output or weaken the source-parity guard.
2. Keep `mix_docs_preview` separate so the 43 docs previews stay on their own pin.
3. Replace the bundled fonts with a reviewed subset. Their OFL notices are in
   `packages/mix_showcase/assets/fonts/OFL.txt`.
4. Move the tour to `/` and decide what each project page keeps.

## Decisions for Leo

1. Is this the direction? If so, the tour replaces `/`.
2. Do the project pages become their own tours, or short pages that link into this one?
3. Are these the right four looks? They are placeholders chosen to be far apart.
4. Is Cards the right subject, and are these the right five blocks?
5. Ship the renderer fix to production now, ahead of V2? The published bundle
   already contains `main.dart.js`, so it is a website-only change. It needs a
   preview check, since it changes the renderer for every docs preview.
