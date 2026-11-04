# Content and URL accounting

The counted corpus is canonical MDX at the pinned revisions, not a count of
navigation entries or copies served from multiple hosts. `pages.json` records
each page's owner, edit path and final route. Folder indexes and project
landings are separate generated routes: 120 content/index/landing routes in
total. The Flutter catalog, forwarding dashboard, search JSON, robots, sitemap
and asset endpoints are accounted for separately and are not canonical MDX pages.

| Project | Canonical pages | Explanation |
| --- | ---: | --- |
| Mix | 29 | All MDX files under the pinned website's `src/content/documentation/mix`. The prior “33 / 31 remaining” summary was incorrect; 27 remained after the two-page pilot. The URL inventory also contains `src/content/mix.mdx` (the legacy project landing), which is represented by the new landing and is not a documentation page. |
| Remix | 53 | Every page in the pinned, upstream-prepared docs snapshot; tutorial ZIP includes and real catalog source panels are expanded upstream. The 26 Concepta copies do not count as separate pages. |
| Naked UI | 23 | All 18 archived pages, updated against active naked_ui 1.5.0, plus Combobox, Menubar, Scrollbar, TextMagnifier and ToggleGroup. Switch keeps its route and documents `NakedToggle(asSwitch: true)`. |
| Total | 105 | No duplicated manually editable Naked UI copy remains in the website. |

`legacy-urls.json` preserves all 235 entries from the 2026-11-03 URL inventory.
`historical-paths.json` preserves all 151 historical path-map entries (151 unique
paths) and the five pattern groups without page maps. “Migrated” means the
content destination exists in this implementation. “Redirected” means a local
compatibility rule is prepared. **Neither label claims the legacy host has
changed or a hosted rollout exists.** Each entry carries delivery state.

The first accounting pass has 213 migrated entries, 11 prepared redirects,
eight intentional exclusions and three unresolved entries. The machine-readable
files are authoritative if later verification narrows a decision.

Intentional exclusions retain the shared Concepta documentation entry, Mix Winds
product landing, standalone legacy Mix Gallery/Naked UI example app and the
original-origin Remix worker retirement script. The dashboard remains reachable
through a temporary forwarding route to its maintained Pages deployment; its
library/release behavior and deployment are unchanged.

Unresolved entries concern historical major-version content or old pattern
aliases requiring an explicit version/archive decision. The dead Mix v1 origin
returns 410; a v2 guide is not equivalent documentation for a removed API. Keep
historical version handling visible rather than silently forwarding every old
URL to the home page. `historical-paths.json` distinguishes suggested current
guides from approved exact current-route redirects.

Cross-origin redirects on Concepta, GitHub Pages and docs.page remain cutover
work at their respective owners. The Remix root retirement worker must stay
reachable without redirect on Pages. The active Mix Gallery worker must be
retired at that origin before replacing its app with a forwarding stub. No DNS,
legacy deployment or original-origin worker has been changed here.

Validation must cover rendered routes, heading targets, image responses,
project-labeled search records, real Flutter readiness and source bytes, in
addition to this accounting. `scripts/audit/rendered-site.py` checks the expanded
site and environment metadata; browser tests exercise interaction and cache
isolation. Full route counts are generated in `pages.json`.

The canonical Naked source also records original Markdown heading targets in
`naked_ui_docs/legacy-anchors.json`. The consumer audit verifies those targets
against rendered pages; Slider property renames and the Switch title retain
explicit aliases. Live legacy renderer probes returned 403 (docs.page) and 429
(Concepta), so exact historical renderer equivalence is not claimed from those
probes. The ledger identifies the GitHub-style slug basis explicitly.

The preserved Mix URL rows name 30 unique MDX sources: 29 docs and that one
project landing, each under two hosts. The old prose claim of 33 MDX pages is
not supported by the pinned tree; the exact file/route lists replace it. No
extra four source pages are inferred or silently dropped. Naked UI’s 18 and 23
counts describe the archived and active expanded corpora respectively.
