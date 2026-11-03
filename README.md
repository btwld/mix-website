# Flutter Mix website

One Next.js and Fumadocs site for [Mix](https://github.com/btwld/mix), [Remix](https://github.com/btwld/remix), and Naked UI, intended for fluttermix.com on Firebase App Hosting.

> [!IMPORTANT]
> This is a pilot. It contains material copied from btwld/website (Mix pages and preview components) and the archived btwld/naked_ui docs, pending a publication and license review. Do not push or deploy this branch until that review clears it. No Firebase project, release asset, or DNS record has been created for it.

| Project | Overview | Docs | Content owner |
| --- | --- | --- | --- |
| Mix | `/mix/` | `/mix/docs/` | This repository (`content/mix`) |
| Remix | `/remix/` | `/remix/docs/`, catalog at `/remix/catalog/` | btwld/remix (`docs/`), consumed as a pinned site input |
| Naked UI | `/naked-ui/` | `/naked-ui/docs/` | Staged here (`content/naked-ui`) until btwld/remix has a Naked UI docs folder |

The pilot publishes the Mix Box and Animations guides, the Remix Button page with its catalog embed, and the NakedButton page (`site-scope.json` selects the Remix pages). Links to pages that have not migrated yet redirect temporarily (307) to their current home.

## Run

Use Node 24.14+ and pnpm 11.5.3 (`.node-version`, `packageManager`).

```bash
pnpm install --frozen-lockfile
pnpm dev                      # prebuild, then next dev
pnpm build && pnpm start      # production server
```

Every `dev`, `build`, and `typecheck` first runs `scripts/site-inputs/sync.mjs`. It downloads the archives that `sources.lock.json` pins, verifies their SHA-256 and size, and checks that each archive's own metadata names the locked source commit. Then it stages the archives into `.generated/` and `public/`, which are gitignored. Archives are cached under `.site-inputs/cache/<sha256>.tar.gz`. Set `SITE_INPUTS_OFFLINE=1` to forbid downloads, or `SITE_INPUTS_CACHE` to move the cache.

## Checks

```bash
pnpm test                     # site-input pipeline unit tests
pnpm typecheck
pnpm test:e2e                 # Playwright, Chromium and WebKit, against :3100 or E2E_BASE_URL
pnpm test:lock-update         # returning browser after a lock update (rebuilds twice)
```

Playwright keeps a trace, video, and screenshot for every failure under `test-results/`. WebKit's Linux build needs Ubuntu-level libraries. On other hosts, run it in `mcr.microsoft.com/playwright:v1.64.1-noble` with `--network host` and `E2E_BASE_URL`.

## Site inputs

Flutter never runs in the website build. Each Flutter-dependent input is built once from an exact source commit with a pinned SDK (`scripts/site-inputs/toolchains.json`):

| Input | Source | Contents |
| --- | --- | --- |
| `mix-previews` | btwld/website `packages/mix_docs_preview` | Multi-view Flutter bundle, `previews-manifest.json`, and the Dart sources it names |
| `remix-docs` | btwld/remix | Staged docs snapshot (`tool/prepare_docs_site.py`) and the Widgetbook catalog built for `/remix/catalog/` |

To advance a pin:

1. Run the **Publish site input** workflow with the input name and a full source commit SHA whose upstream CI passed. It builds with `scripts/site-inputs/produce/<input>.sh` and publishes `site-input-<input>-<commit12>` as a release asset of this repository. It refuses to replace an existing tag, and it re-downloads the asset to confirm the published digest.
2. In a website PR, download the asset and run `node scripts/site-inputs/pin.mjs <archive>`, then commit `sources.lock.json`.

Publish assets before merging the lock update, and never delete them, so older site commits stay rebuildable. Turn on GitHub's immutable releases for this repository as well. The prebuild's digest check is the backstop either way.

The Mix bundle lives at `/previews/mix/<sha256 prefix>/`, served `immutable`, so a page never mixes an engine, manifest, or snippet from two builds. The catalog keeps its own base href at `/remix/catalog/` and revalidates on every load.

## Content

`scripts/migrate/import-docs.mjs` copies legacy pages with mechanical changes only and records each original's path and SHA-256 in `content/<project>/SOURCES.json`. Make editorial fixes in separate commits.

## Firebase App Hosting

`apphosting.yaml` keeps the Next.js adapter. Don't set `scripts.buildCommand`, because that opts out of the adapter. The adapter runs the `build` script, so the prebuild runs inside the managed build and fetches the published release assets. Every backend is `noindex` (`X-Robots-Tag`, robots meta, and a disallowing `robots.txt`) unless it sets `SITE_INDEXING=index`. Only production should set it, at cutover.
