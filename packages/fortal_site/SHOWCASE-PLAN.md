# Showcase plan

Proposed November 10, 2026; Leo said to go ahead the same day. It covers every slide, not only the first.

## Progress

All six steps are built, plus a charts slide Leo asked for afterwards.

| Step | State |
|---|---|
| 1. Layout constants and the shared card | Done. `kit.dart` holds the grid (four and three columns), the spacing scale, the five type sizes and `ShowCard`, the card anatomy, which the components and charts slides use. Every slide's gaps are on the scale, checked by `test/rules_test.dart`; the one let-off is the ring around a theme dot |
| 2. Shader to eight tiles; hero collage and buttons | Done; the cards redesigned on November 11 (1a below): sized to their content, measured boxes to the shader |
| 3. Components slides no longer repeat the hero | Done; the second slide adds a data table, an accordion and a date range picker (its own card, "Plan the sprint"). The first slide still has a Beira-mar 2.4 card, as the hero does |
| 4. Themes, Use it and Foundations | Done: radius and scaling pickers that change the whole site, the list and both previews on the three columns with the code line under the previews, three equal columns for Use it with the line on `lib/ui` under the first two, four cards with a spacing card for Foundations. The closing line has no links yet |
| 5. Narrow layout, with a small navigation bar | Done; the bar has the five section links but not the name |
| 6. Review | Done on November 10: every slide at 1440 × 900, 1280 × 720 and 1920 × 1080, the narrow page at 430 × 932 and 820 × 1180, every control used once in a browser, 110% scaling with full radius on every slide, keys and wheel between slides, and a wave sequence. `test/layout_test.dart` checks for overflow at every scaling and radius |

Departures from the rules below, all deliberate: the two components slides start their heading at 84 rather than 104 to hold six cards, and at 110% scaling they end 12 above the foot rather than 48. Slide titles are one line on wide screens and split into two balanced lines on narrow ones.

## Goal

A clean, polished showcase of Fortal: calmer than the shadcn and Radix walls it learns from (captures in `.context/references/`), with real variety, and one set of layout rules applied to every slide.

## Design rules for the whole site

These are the site's own layout rules. Components stay default Fortal throughout.

### Grid

- Canvas 1440 × 900. Content runs from 115 to 1325 (1210 wide).
- Twelve columns of 79 with 24 between them. Every card, heading and code block starts and ends on a column edge.
- Card walls use four columns of 284 (three grid columns each) or three of 387 (four grid columns each).

### Spacing

One scale, in canvas units: **4, 8, 12, 16, 24, 32, 48, 64, 96**. No other values.

| Where | Value |
|---|---|
| Between a label and its control | 8 |
| Between rows inside a card | 12 |
| Between groups inside a card | 16 |
| Between cards, both directions | 24 |
| Slide heading to the first card | 48 |
| Top of the canvas to the navigation | 32 |
| Navigation to the slide's label | 64 |
| Bottom safe area on slides that don't run off the edge | 48 |

### Type

Five sizes for the site's own text. Text inside components keeps Fortal's sizes.

| Use | Size | Weight |
|---|---|---|
| Hero name | 172 | Bold |
| Slide title | 48 | Bold |
| Hero tagline | 28 | Medium |
| Slide detail line | 18 | Regular |
| Label above a title, and card footers | 12, letterspaced, capitals | Bold |

Slide titles are one line, at most 34 characters. Detail lines are one line, at most 80 characters.

### Card anatomy

Every showcase card has the same four parts, in this order:

1. **Title**: Fortal heading size 4, at most 24 characters.
2. **Detail**: one muted line, at most 44 characters, so it never wraps.
3. **Content**: the components at work. Rows 12 apart, groups 16 apart.
4. **Footer**: a divider, then the names of the components used, in the small capitals.

Actions sit bottom right, primary last. A card has at most one primary button.

### Alignment

- Everything in a card starts at the card's left padding. No centred buttons, no indented controls.
- A control that Fortal's touch box would push inward (a bare checkbox) is not used on its own; a switch at the row's right edge or a labelled radio is used instead.
- Columns in a wall have staggered tops on the hero only (the waves need it). Every other slide aligns card tops.

### Colour and backgrounds

- One accent at a time, chosen by the visitor. Site text is the theme's darkest neutral on light slides and white on dark ones.
- Backgrounds stay as they are: the shore, dry sand, the horizon, the sea after dark, sand with the water's edge.

## Slide by slide

### 1. Fortal (hero)

**Now:** the name, the tagline and six tiles on the shore.
**Plan:** an eight-card collage in four columns, with two buttons under the tagline.

- Buttons: **Get started** (to Use it) and **Components**, in the light surface style so they read on the sea.
- The collage, its stagger and the eight cards are now specified in 1a below, which replaces the first version's table (fixed boxes, an inline calendar shrunk to fit, tops at 384, 416, 392 and 432).

### 1a. The hero's eight cards, redesigned (November 11)

Leo found the first version's cards awkward and unpolished. Its cause: every card was a fixed box with its content spread to fill it, so gaps inside a card had nothing to do with the content; the calendar was shrunk to fit a box narrower than Fortal draws it; and the stagger had no rule. This spec replaces that version. Not approved by Leo.

**One product.** Every card is a moment from Beira-mar 2.4, a release of a project run by Bea Lima (owner), Caio Rocha and Lia Mendes. Today is Tuesday, November 10, 2026; the release ships Friday, November 20.

#### The collage

- **Grid.** Four columns of 284 (three grid columns each) at 115, 423, 731 and 1039, 24 apart. Every card is 284 wide. Nothing runs off the side.
- **Heights come from content.** No card is given a height. Each column stacks its cards 24 apart, each as tall as its content needs at the current scaling. The cards' measured rectangles are what the shader gets (see *How the shader gets the cards*).
- **Stagger.** One rule: each column starts 16 lower than the one to its left, 384, 400, 416 and 432, a calm stair that leaves the most sand under the buttons at the top right. The waves reach the columns one after another.
- **Balance.** The cards are assigned to columns so the four columns are about the same height, so the bottoms make a stair like the tops: at 100% the columns end at 814, 852, 830 and 850, every card at least 48 above the foot. At 110% the cards grow by a tenth and end by about 890; nothing is cut. At 90% they end higher.
- **Weight.** The top row holds the visually heavier cards (the big number, the buttons, the chart, the switches); the row beneath is quieter. No two neighbouring cards are the same kind.

| Column | Top | Cards |
|---|---|---|
| 1 | 384 | Release progress, Members |
| 2 | 400 | Release notes (the basics), Invite |
| 3 | 416 | This week, Theme |
| 4 | 432 | Alerts, Release date |

The order of the cards for the shader (`heroTiles()`) stays: release progress, invite, basics, members, release date, theme, this week, alerts, so the Themes slide's previews (cards 0 and 7) keep their meaning.

#### Inside every card

- Fortal's card at size 3: padding 24 on every side, so a 284 card has 236 for content. Every card has the same padding and the same corner.
- **Header:** the title in Fortal's heading size 3, bold. Something that describes the whole card (a status badge, a figure, the current theme's name) may sit at the header's right, on the title's line.
- **Detail:** at most one muted line under the title, 4 below it, at most 44 characters.
- **Header to content:** 16. **Rows inside a group:** 12. **Groups:** 16. **Label to its control:** 8.
- Rows that hold a control are 40 tall, Fortal's touch box; the text in them is centred on that box, never top-aligned.
- Everything starts at the left padding. A control at a row's end sits at the right padding. Actions sit at the bottom right, primary last; at most one primary button per card.
- No footer of component names: these are product moments, not specimens.

#### Card by card

1. **Release progress.** Title "Beira-mar 2.4", with an "In progress" badge (soft) at the header's right. Then 16, "68%" in heading size 8 with "17 of 25 tasks" muted on its baseline. 12, a progress bar in Fortal's soft style, which has no outline heavier than its fill. 16, a row: the three people as small avatars (size 1, 4 apart) at the left, "Ships Fri, Nov 20" muted at the right. The ship date follows the Release date card.
2. **Invite.** Title "Invite", detail "They join Beira-mar as editors." Then 16, one row: the email field (labelled "Email" for assistive technology) taking the width, and 8 after it the primary "Invite" button at its own width, ending at the right padding.
3. **Release notes (the basics).** The everyday controls as one believable moment: publishing the release notes. Title "Release notes", then the counts of each kind of change as badges in Fortal's three badge styles ("4 new" solid, "5 improved" soft, "3 fixed" outline). 16, the label "Visible to" over a single choice, Team or Everyone. Then a switch row, "Email subscribers". 12, the actions right-aligned: "Share" (outline), "Edit" (soft), "Publish" (solid, last). Short labels, so the three buttons still fit one row at 110%.
4. **Members.** Title "Members", the count "3" muted at the header's right. 16, three rows 12 apart: avatar (size 2), then name over email (the name in Fortal's medium weight, the email muted and small), and the role muted at the right: Owner, Editor, Viewer.
5. **Release date.** Swapped from the inline calendar to Fortal's date picker. Fortal draws its calendar at one size, 332 wide with its own padding (308 between its outer days), and a 284 card has 236 inside: the calendar cannot sit in a column of four without being shrunk, and a three-column collage is too tall for eight cards above the fold. The date picker keeps the calendar at Fortal's own size, opening it from the field. Title "Release date". 16, the date picker. 8, a muted line that answers the choice: "In 10 days, on a Friday." Picking a date also changes the release card's ship date.
6. **Theme.** Title "Theme", the current theme's name as a soft badge at the header's right (as "In progress" on the release card). Detail "Pick a colour to retint the site." 16, the seven colours as 24 dots 8 apart, each a 32 target (keyboard focusable, named for assistive technology), the current one ringed. Picking one sets `siteAccent`.
7. **This week.** Title "This week", "Nov 9 to 15" muted at the right. 16, "128" in heading size 6 with "updates" muted on its baseline. 16, the bar chart at 112 tall, its axis 0, 20, 40.
8. **Alerts.** Title "Alerts", detail "Email me about Beira-mar." 16, three 40-tall switch rows (Comments, Mentions, Weekly digest), the label at the left and the switch at the right, with a divider between rows.

#### How the shader gets the cards

The cards are laid out by a small layout object in `hero.dart` that stacks each column's cards at their own heights and reports every card's rectangle in canvas units after each layout. When the rectangles change (first layout, a new scaling or radius, fonts arriving, the date picker changing a line), the hero hands the new list to `Shore` on the next frame. The first frame uses the rectangles measured at 100%, so a plain load shows no jump. A test lays the slide out at 90%, 100% and 110% and checks the rectangles given to `Shore` against the cards' real boxes. The narrow layout works the same way: one column of eight cards, 448 wide, in the order the wide collage reads row by row, with the page as tall as the cards need and 64 below the last.

**Reviewed** in two rounds of captures with a fresh critique between them (round 1 fixed dots that touched, radio labels larger than the switch label beside them, an unlabelled choice, a cryptic theme name and a column ending 26 above the foot). Not yet approved by Leo.

### 2 and 3. Components

**Now:** two slides of product-moment cards, three columns each, on the new card anatomy.
**Plan:** keep the cards; bring them onto the rules.

- Remove from these slides whatever the hero now shows (Members, the calendar), so nothing appears twice.
- Slide 2 keeps the form moments: Invite your team, Notifications, Share project, Upload limits, Workspace, and adds **Date range** (the date range picker).
- Slide 3 becomes the pieces not shown elsewhere: **Schedule** (date picker and callout), **Project details** (data list), **Find anything** (keyboard key, code, link), **Activity** (data table), **Questions** (accordion), **Loading** (skeleton).
- Card tops aligned; both rows end 48 above the bottom.

### 4. Themes

**Now:** the list of seven themes, light and dark previews, and a code line.
**Plan:** tidy to the grid and reuse the hero's cards.

- Theme list: three grid columns. Previews: the light and dark panels share the remaining nine, equal widths, tops aligned with the list.
- The previews show two of the new hero cards (Beira-mar 2.4 and Alerts) in place of the old tiles.
- Add radius and scaling pickers under the theme list, as Radix's panel has, each as a Fortal segmented control. Both retint the previews live.
- The code line moves under the previews, same width, and names every choice made.

### 5. Use it

**Now:** three steps with code, and the button the last one makes.
**Plan:** even columns and a fuller result.

- Three equal columns, one per step, tops aligned, in place of the current two-and-one.
- Step 3's result card shows the button in the current theme with its hover and pressed states reachable.
- One line under the steps on what "installed as source" means: the files land in `lib/ui` and are yours to edit.

### 6. Foundations

**Now:** colour scales, type sizes and radius buttons.
**Plan:** four equal cards and a closing line.

- Four cards of three grid columns each: **Colour**, **Type**, **Shape**, **Spacing** (new: Fortal's spacing steps drawn to scale).
- Colour shows the two scales as now, with the step numbers; Shape shows the five radius settings on the same button.
- The closing line "Built with Mix and Remix." sits 48 above the water's edge, with links to both.

### Navigation and the narrow layout

- Navigation stays: the name at the left, four links at the right, dots at the side. The links get a visible focus ring and the current one an underline.
- Narrow screens keep one scrolling page. The same spacing scale applies, with 16 at the edges and 48 between sections. A small fixed bar with the name and a menu of the four sections is added, since narrow screens have no navigation today.

## What has to change in code

1. **Shader: six tiles become eight**, in `shore.frag`, `shore.dart` and the wave timing.
2. **Install from the registry:** `chart` (brings the beta `mix_chart` package). The date range picker, data table and accordion are already installed.
3. **Shared layout constants** in `kit.dart` for the grid, the spacing scale and the type sizes, so no slide uses its own numbers.
4. **One card widget** for the anatomy above, used by every slide.

## Steps

1. Layout constants and the shared card; move the two components slides onto them. No visible redesign yet, only alignment.
2. Shader to eight tiles; build the hero collage and its buttons.
3. Rework the components slides' contents so nothing repeats the hero.
4. Themes, Use it and Foundations onto the grid, with their additions.
5. Narrow layout for all of it, with the small navigation bar.
6. Review, then the README and status.

## How it will be checked

- **Rules:** a test that every spacing value used by the slides is on the scale, and that titles and detail lines fit their limits.
- **Screens:** every slide at 1440 × 900, 1280 × 720, 1920 × 1080 and a phone size, checked for overflow, wrapping and misaligned edges.
- **Motion:** a wave sequence on the hero, checking foam, shadows and the wash on all eight cards.
- **Use:** every control clicked once in a browser, a theme switch on every slide, keyboard movement between slides.

## Open questions for Leo

1. Eight hero cards, or six or ten?
2. A chart in the hero, at the cost of a beta package? If not, that card becomes a second number card.
3. The calendar in the hero, or only on a components slide?
4. Radius and scaling pickers on the Themes slide: wanted, or keep it to colour only?
