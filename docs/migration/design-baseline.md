# Design and ownership baseline

The reader-facing product is one Next.js/Fumadocs site at fluttermix.com for
Mix, Remix and Naked UI. Consolidation does not mean replacing Fumadocs or
merging independent Flutter package release histories.

## Historical reference

The standalone Mix homepage is the visual/content reference, before its
integration into the Concepta site:

- `btwld/website@a83438ababdac622a4dbd546855f4e8aa65ca311` (2026-02-24):
  Flutter embedding integration, `components/HomeContent.tsx`.
- `btwld/website@5fd657eb18f0bd051f7486d7871b36836f9a635e` (2026-04-08):
  homepage feature showcase update, same headline and subtitle.

The headline is **An Expressive Styling System for Flutter**. The subtitle is
**Effortlessly style your widgets and build design systems.** The main page
moves from this introduction into real Flutter feature demonstrations. The
later `509c4a9` Concepta checkpoint remains the provenance of reused media and
other migrated assets; it is not the sole authority for the Mix homepage.

The approved adaptation rebalances the logo and heading, retains dark-only
host UI, keeps the current docs navigation, and adds sibling project access
below the features. It is not a pixel-identical port. Preserve historical
identity through the native Fumadocs layout, typography and preview adapters;
do not restore the old documentation framework. Historical docs visual parity
has not yet been established with a matched before/after render.

Keep `/`, `/mix/`, `/remix/`, `/naked-ui/` and existing docs URLs stable during
this cleanup. The apex introduces Mix and all three projects. The Mix overview
provides the full feature set, code generation and package requirements.
Production already serves both indexed URLs.

## One owner per responsibility

| Responsibility | Owner |
| --- | --- |
| Fumadocs typography, generic MDX components and configuration helpers | `btwld/docs-theme`, published as `@concepta/docs-theme` |
| Product palette, project registry, landing pages, shared search and preview adapters | This repository |
| Canonical Mix documentation and Mix website preview sources | `content/mix` and `packages/mix_docs_preview` here |
| Canonical Remix/Naked UI docs and catalog sources | `btwld/remix`, consumed through pinned inputs |
| Flutter package code and releases | Respective package repositories |
| Generated snapshots and bundles | Build output, never independently edited |

The installed theme's old `conceptadev/docs-theme` package metadata does not
mean a second theme is needed. `btwld/docs-theme` is the verified upstream.
Keep product-specific landing CSS out of that shared library unless another
consumer demonstrates a reusable requirement.

`btwld/docs` is a separate Mintlify Mix documentation repository, not this
site's theme or input. At `3bb7a8f78b4ddcd7cf2d2244b22a5d47478a5bed` it has
26 MDX pages, versus this site's 29 Mix pages. All 21 same-path pages differ.
Old-only paths include `overview/best-practices`, `widgets/overview`,
`guides/design-tokens`, `ecosystem/mix-tailwinds` and `index`. Some have renamed
or expanded counterparts here, but complete content equivalence is unproven.
Reconcile useful unique material before marking that source superseded.
Do not copy old API examples wholesale or silently archive the repository.

## Frontend cleanup

Landing neutral colors use the shared Fumadocs roles, and each project scope
provides its primary, selection, focus, caret and native control colors. Mix
preview chrome uses the host palette. MDX, fetched Dart and static Dart use
the same dark code theme.
The server supplies the pinned preview and source bases to all landing and
docs components. The returning-browser check exercises docs and navigation from a retained
apex tab to the Remix hero; it does not exercise every landing preview.

## Separate tracks

Reconcile the five old-only and 21 differing same-path Mix pages against
current APIs before marking the old Mintlify source superseded.

The current Flutter preview bundle pins Mix `2.2.0-beta.2`, Remix `bc95c45`
and Naked UI `1.0.0-beta.4`. The site documents Mix `2.3.1`, Remix docs at
`ba450dc` and Naked UI `1.5.0`. Modernization requires a dependency review,
fresh compiled previews and matching Dart sources, browser verification and
a new digest-pinned archive. Review potential standalone Naked UI demos with
that rebuild. Deployment automation and PR preview activation remain separate
from the frontend changes.
