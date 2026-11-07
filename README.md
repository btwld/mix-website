# Flutter Mix website

One Next.js/Fumadocs application for Mix, Remix and Naked UI, with shared
navigation, project-labeled search and working Flutter examples. The durable
[migration record](docs/migration/plan.md) preserves the implementation and
delivery history. The [ownership decisions](docs/migration/decisions.md)
trace each source.
The [design and ownership baseline](docs/migration/design-baseline.md) identifies
the historical Mix reference, shared theme and remaining consolidation work.

The full local corpus is **29 Mix, 53 Remix and 23 Naked UI pages**. Generated
folder indexes and landings bring the site to 120 routes. The exact locked
archives are published and anonymously verified. A fresh remote clone of
`70d679c` built successfully without restored input archives or generated outputs.
Publication is owner-authorized under the existing [notices](docs/migration/notices.md),
with no new blanket license. The indexed production site is live at
[fluttermix.com](https://fluttermix.com) on Firebase App Hosting.
The deployment branch is tracked in [PR #1](https://github.com/btwld/mix-website/pull/1).
Automatic rollouts and live PR preview channels remain separate delivery work.

| Project | Overview / docs | Canonical editing location |
| --- | --- | --- |
| Mix | `/mix/`, `/mix/docs/` | This repository: `content/mix`, `packages/mix_docs_preview` |
| Remix | `/remix/`, `/remix/docs/`, `/remix/catalog/` | `btwld/remix/docs`, tutorial sources and catalog apps |
| Naked UI | `/naked-ui/`, `/naked-ui/docs/` | `btwld/remix/naked_ui_docs` (draft PR [#381](https://github.com/btwld/remix/pull/381)) |

Do not edit `.generated` snapshots or public Flutter outputs. Package releases
remain independent. The maintained Remix dashboard remains on GitHub Pages,
reachable through a temporary forwarding route.

## Develop and verify

Use Node 24.14+ and pnpm 11.5.3 (`.node-version`, `packageManager`).

```bash
pnpm install --frozen-lockfile
pnpm dev
pnpm lint
pnpm test
pnpm typecheck
pnpm audit:inputs
pnpm build && pnpm start -p 3100
python3 scripts/audit/rendered-site.py http://localhost:3100
pnpm test:e2e
pnpm test:lock-update chromium
pnpm site-inputs:remote
```

`dev`, `build` and `typecheck` fetch, hash-check and stage the pinned inputs.
`SITE_INPUTS_OFFLINE=1` forbids downloads. Cache-backed success cannot establish
remote artifact availability; `site-inputs:remote` deliberately bypasses caches.
The rendered audit checks every route, link, anchor, image, search record and
environment metadata. `test:lock-update` rebuilds repeatedly: stop other local
servers/tests before running it. A Next static export also uses `.next` during
its build; do not run either build against a server using that directory.

Playwright tests run Chromium and WebKit against `:3100` or `E2E_BASE_URL`.
Failures retain screenshots, videos and traces. On a non-Ubuntu Linux host,
WebKit can run in `mcr.microsoft.com/playwright:v1.64.1-noble` using host networking.
Local evidence belongs in `.context/`, never in commits.

The `/v2/` tour runs a separate Flutter app. See
[`packages/mix_showcase`](packages/mix_showcase/README.md) for its local build.

## Reproducible site inputs

Flutter runs in independent input producers, not the website build. Each input
has a full source commit, archive size/SHA-256, and toolchain in
`sources.lock.json`. New producers also record their exact website commit.

| Input | Source | Archive contents |
| --- | --- | --- |
| `mix-previews` | This repository | Flutter bundle, manifest, matching Dart snippets |
| `remix-docs` | `btwld/remix` | Validated/prepared docs, expanded tutorial includes, real catalog source panels and Flutter catalog |
| `naked-ui-docs` | `btwld/remix` | Prepared docs; every Dart fence compiled or explicitly source-checked as an API reference |

Run **Publish site input** with an input and full source SHA. It builds with the
pinned SDK, refuses to replace an existing release and verifies the published
bytes. Then use `node scripts/site-inputs/pin.mjs <archive>` in a website PR.
Publish and anonymously verify assets before merging a lock update. Retain old
releases for rollback. Current GitHub releases are mutable; lock verification
rejects altered bytes. GitHub-enforced immutability is a separate repository
policy and is not claimed here. The Remix archive has
been rebuilt with the full upstream docs contract and
explicit producer provenance; Mix publication now builds from this repo,
not `btwld/website`. [The ownership proof](docs/migration/source-ownership-check.md)
records the source-edit → compiled demo/snippet check.

Mix assets use `/previews/mix/<digest>/` with immutable caching. The catalog uses
`/remix/catalog/` and revalidates fixed filenames. Their asset/worker scopes stay
separate. Historical URLs, exclusions and version decisions are recorded in
[the inventory](docs/migration/inventory.md).

## Deployment

`firebase.json` selects the live App Hosting backend `fluttermix` at root `.`
in `bitwild-oss` / `us-east4`. The `www` hostname redirects to the apex
and preserves the path and query. `apphosting.yaml` uses the managed adapter.
A `scripts.buildCommand` override disables the adapter. Builds are noindex
by default. Production uses `SITE_INDEXING=index` and the canonical origin
at build and runtime. Its sitemap lists actual routes. Preview builds omit
production canonical and Open Graph URLs.

`public/__site.json` records the checkout, dirty state and pinned inputs. A
managed source archive without Git metadata may provide an exact `SITE_COMMIT`;
otherwise its identity is explicitly unavailable and cannot pass promotion
verification. Never substitute a workflow merge SHA for the source checkout.
Local-source uploads use a temporary `SITE_COMMIT` overlay for the exact
reviewed source because the upload excludes `.git`. The production
[`/__site.json`](https://fluttermix.com/__site.json) reports the deployed SHA.

[Deployment instructions](docs/migration/deployment.md) cover the first hosted
rollout, PR preview tradeoffs, environment identities, promotion and rollback.
[Verification evidence and limits](docs/migration/verification.md) distinguish
local checks from live delivery.
