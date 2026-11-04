# Purpose, ownership and delivery decisions

Updated 2026-11-04 after independent read-only review.

The site succeeds when readers discover the three projects, search accurate docs
and run working Flutter examples, and maintainers edit each page in one place,
review changes and rebuild them from durable inputs. Libraries continue their
independent package releases.

## One application

Keep one Next.js/Fumadocs app and sibling `/mix`, `/remix`, `/naked-ui` routes.
Project identity, routes and source paths live in `lib/projects.mjs`. Shared
components/layout/search avoid separate sites drifting. A future project needs a
source adapter, content/config and verification, not a new deployment system.
No future gateways or independent product backends are part of this migration.

## Source adjacent ownership

| Reader content | Canonical edit location | Transformation and verification | Website reads |
| --- | --- | --- | --- |
| Mix docs | `mix-website/content/mix` | Mechanical Nextra adaptation with original hashes; Fumadocs MDX; route/link/preview checks | Authored MDX directly |
| Mix preview and snippet | `mix-website/packages/mix_docs_preview` | Flutter 3.44 build, manifest and exported Dart sources, commit-addressed archive | Digest-pinned bundle; same manifest selects demo and displayed source |
| Remix docs/examples | `btwld/remix/docs`, `docs.json`, `apps/demo`, tutorial ZIP | Existing Dart docs validators; `prepare_docs_site.py` expands tutorial includes and injects actual catalog source; Flutter catalog build | `remix-docs` archive, `.generated/content/remix`, `public/remix` |
| Naked UI docs/examples | `btwld/remix/naked_ui_docs`, `apps/naked_ui_example` | Navigation coverage, explicit source-checked API references, complete example analysis AND Flutter frontend compilation; `prepare_naked_ui_docs.py` expands source includes | `naked-ui-docs` archive, `.generated/content/naked-ui` |

Keep Remix/Naked UI source adjacent: the existing tutorial includes, source panels,
active package and catalog evidence already give that workflow valuable checks.
Moving all authoring here would require rebuilding those dependency relationships
or maintaining synchronized code copies. The small independent Naked snapshot
producer preserves the existing Remix docs/build/release contracts. Website
`.generated`, `.site-inputs`, `.next` and Flutter outputs are disposable; never
edit or commit them. The website's one-page Naked pilot is removed when its
canonical snapshot is pinned. Its history/provenance is retained in Git.

The original Mix archive from `btwld/website@509c4a9` is an explicit migration
checkpoint, not an ongoing producer source. The publisher now selects this repo.
Exit: build from a clean site commit, record source and producer SHAs, compare all
manifest source bytes with local authoring source, publish, and advance the lock
only after anonymous download and hash verification. Never claim remote readiness
from a cache-backed run.

## Deployment and previews

Keep App Hosting for staging and production. Validate one real staging rollout
before expanding cloud infrastructure. Firebase CLI authentication fails in
this VM, but the parent coordinator's authenticated Mac successfully listed
backends in `bitwild-oss` and returned an empty list. Use that existing Mac
identity without transferring tokens; Google access itself is not blocked.
Local adapter success is separate from hosted build/runtime success.

The original argument that search requires a dynamic server was incorrect:
`app/api/search*.json` already exports JSON at build time and queries run in the
browser. The current server also implements redirects, headers and a catalog
index rewrite, so a static preview must prove equivalent routing/headers/404,
Flutter assets and search before being recommended. Firebase Hosting preview
channels remove the container, registry and runtime identity. Local emulator
validation has now passed the complete rendered audit and Chromium/WebKit suites, so
prepared PR workflows use that smaller path. Live deployment remains a
separate gate. Cloud Run is only a fallback if hosted equivalence fails. No
silent change to App Hosting or cutover is implied. PR URLs are a requirement;
the mechanism is chosen from actual validated app needs.

Official references checked 2026-11-04:
[App Hosting rollouts](https://firebase.google.com/docs/app-hosting/rollouts),
[Firebase preview channels](https://firebase.google.com/docs/hosting/github-integration),
[Hosting behavior](https://firebase.google.com/docs/hosting/full-config),
[Next static exports](https://nextjs.org/docs/app/guides/static-exports).
