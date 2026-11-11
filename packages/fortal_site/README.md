# Fortal site (exploration)

A browsable showcase for Fortal, built as full-screen slides. Started November 10, 2026, at Leo's request. It is a prototype: nothing here is approved, and it is separate from the presentation, its motion scenes and `apps/showcase`.

| Slide | What it shows | Background |
|---|---|---|
| Fortal | The name, two buttons and a collage of eight cards of real components on a shore drawn by a fragment shader | The sea meeting the sand |
| Components | Product moments built from the everyday controls | Shared animated dunes and lagoon, with beige reading fade |
| Components, continued | Date picker, data table, data list, accordion, date range picker, keyboard key, code and link | Shared animated dunes and lagoon, with beige reading fade |
| Charts | Fortal's line, bar and pie charts | Coastal dunes meeting an interdune lagoon |
| Themes | The seven themes with radius and scaling pickers; every choice changes the whole site, shown in light and dark | The horizon in the theme's colours |
| Use it | The two install commands and a usage snippet, with the button that snippet makes | The sea after dark |
| Foundations | Colour scales, type sizes, radius settings and spacing steps, read from the current theme | Coastal dunes and interdune lagoon |

The backgrounds are drawn, not photographed, and take their views from Fortaleza's beira-mar.

## Run it

```sh
fvm flutter run -d chrome
```

The app is pinned to Flutter 3.47.9 (Dart 3.13.7), the latest stable on November 11, in `.fvmrc`; plain `flutter` uses the machine's default.

The site follows Remix main: `remix.yaml` pins the registry to a main commit and `pubspec.yaml` overrides `remix` with main. Run `tool/update_remix.sh` to move both to main's latest commit and reinstall every Fortal item from it.

To look at a build, use `python3 tool/serve.py [port] [build dir]`. Python's stock `http.server` can drop a request during a page's first load, which leaves the icons as empty boxes. `serve.py` also sends `application/wasm` and the cross-origin isolation headers a WebAssembly build wants; a real host should send the same headers and compress the files.

Move between slides with the wheel, a swipe, the arrow or page keys, the links at the top or the dots at the side. `?slide=2` opens on a slide. `?t=6.2` holds the shore at one moment; with reduced motion requested, the shore holds still and slides change without sliding.

## How it works

- **`lib/site.dart`:** the slides, the links and dots, and moving between them.
- **`lib/slides/`:** one file per slide. `hero.dart` runs the shore and rests it while another slide shows.
- **`lib/kit.dart`:** the 1440 × 900 canvas every slide is laid out on, the grid (`columnLeft` for four columns, `wallLeft` for three), the spacing scale (`Gap`), the type sizes, headings, and the shared showcase card (`ShowCard`: title, muted detail line, content, footer).
- **`lib/backdrops.dart`:** the backgrounds of the slides after the first, including the shader-driven coastal dunes and interdune lagoons (`shaders/dunes.frag`) and the perspective horizon and night sea (`shaders/horizon.frag`).
- **`lib/theme.dart`:** the one accent the whole site wears, and Fortal's resolved tokens.
- **`shaders/shore.frag`:** the sand, sea, waves and foam of the first slide. Everything is a function of the time it is given. The eight tile boxes are passed in, so foam gathers where a wave meets a tile, the water parts around it, and sand banks up around it. Open-sea surface optics (Fresnel sky reflection, anisotropic Gaussian sun glitter with Smith masking, backlit subsurface swell glow, cat's-paw wind gusts), cellular Worley bubble foam with flow-streak aging, rotated quintic gradient noise and IGN dithering are adapted from `noniv/web-ocean`. It is painted twice: behind the tiles, and over them for drifted sand, the wash of a wave and the drops it throws. Each tile is drawn as a slab with a short soft shadow and a visible side.
- **`shaders/dunes.frag`:** the wind-sculpted coastal sand dunes and interdune lagoons behind the Components, Charts and Foundations slides. Draws a ray-intersected 3D asymmetric barchan/transverse dune field with sharp S-curve brinks, bifurcating windward ripples, smooth leeward slip-faces, trade-wind sand streamers and wind-rippled emerald lagoons cradling sunlit sand spits, driven by one shared clock at 80% speed, paused when covered by another desktop section. The narrow layout also shares one animated lagoon; reduced motion freezes it.
- **`shaders/horizon.frag`:** the perspective horizon sea, sun/moon glitter column, trade-wind cloud wisps and haze behind the Themes and "Use it" slides, tinted live from Fortal's resolved tokens and paused whenever another slide is showing; static in the narrow scrolling layout.
- **`lib/shore.dart`:** paints one layer of the shader and passes it the time, the page's scale and the tile boxes. `waveNudge` follows the shader's waves so a tile gives a little when a wave reaches it; its constants must stay in step with the shader's.
- **`lib/bento.dart`:** the eight cards of the first slide, built from Fortal components with no restyling, each as tall as its content, and the columns the hero stacks them in. `hero.dart` lays the columns out and hands the shore the boxes the cards really take, after every layout (see "The hero's eight cards" in `SHOWCASE-PLAN.md`).
- **Fortal:** application-owned source in `lib/ui`, installed with `remix_cli` from the Remix registry at the revision in `remix.yaml` (the November 10 registry, on Remix 1.0.0-rc.1). 41 components are installed, the calendar, date pickers and charts among them; generated, so don't edit by hand. The "Use it" slide shows the documented global install (`dart pub global activate remix_cli '^1.0.0-beta.1'`, then `remix init --preset fortal` and `remix add <names>`). This app runs the same commands through its dev dependency, as `dart run remix_cli:remix init` and `dart run remix_cli:remix add`.

## Found in Fortal while building this

Each was checked in Fortal's source and in a render of this site. They are for the Remix repository to decide; nothing in `lib/ui` was changed here.

- **The touch target changes layout.** `uiTouchTarget()` gives every control a 40 × 40 minimum box with the control centred in it. A checkbox beside a label is pushed in about 12 units, rows of small buttons take 40 units of height however small they are drawn, and a text link gets the same box.
- **Text field and select borders differ.** The surface text field strokes with `controlBorder`; the select trigger strokes with `gray7`, which is lighter. Side by side in one form they don't match.
- **Code uses system fonts only.** `UiCode` names Menlo and other system faces, which Flutter web cannot load, so code falls back to the default face. There is no token for the code face; this site sets its own on the one chip it shows.
- **Generated adapters trip a lint.** The `.g.dart` files put `child` before other arguments, which `sort_child_properties_last` reports (9 notes in this app).
- **The slider's track is inset.** It stops short of its box by the thumb's radius, so it doesn't line up with a progress bar of the same width.
- **Text has no muted option.** `UiText` offers size, weight, accent and high contrast, but no gray or muted colour, so a secondary line can only be had with a `style:` override. This site draws its muted lines as its own text from Fortal's tokens (`Muted` in `kit.dart`).
- **The calendar has no smaller size.** `UiCalendar` takes no size and is 332 wide with its own padding, wider than a 284-wide hero card (236 inside). The first slide therefore uses the date picker, which opens the calendar at Fortal's own size, rather than shrinking it.
- **The radio's label has no size.** `UiRadio` draws its label in whatever text style surrounds it, so beside a `UiText` of size 2 it comes out larger (16 against 14). The first slide sets the surrounding text to Fortal's `text2` token around its radio group.
- **Chart grid and axis steps are set apart.** The grid's step is only in the style (`ChartGridStyler.horizontalInterval`); when it is unset, `mix_chart` hands fl_chart no interval and fl_chart picks its own from the plot's height. An axis given its own `ChartAxis.interval` then labels lines the grid does not draw. This site leaves the axis step unset, so labels and lines come from the same calculation, and sets the bounds instead.
- **No grid line at the plot's edges.** fl_chart draws no grid line at the minimum or maximum, and Fortal hides the frame, so a label at the top bound floats with no line under it. This site sets the top bound just above the last label.
- **The axis formatter also writes the tooltip.** `mix_chart` uses the y axis's `labelFormatter` for the tooltip's value, so a formatter that hides some labels also empties the tooltip.
- **The categorical palette leaves the theme.** `resolveUiChartPalette` follows the accent with Orla, Mar, Céu and the other families at step 9, so a three-slice pie in Mar is teal, grey and a saturated blue. This site passes three steps of the accent scale as the pie's `palette`.
- **The pie has no legend and does not size to its box.** Labels are off by default and there is no legend widget; the radius is fixed at 80 whatever room it has. This site builds a legend from Fortal text beside a pie given exactly its width.
- **The line chart's pointer line is heavy.** Hovering a point draws fl_chart's default indicator, a thick line in the series colour from the point to the axis; Fortal's recipe does not style it.

## Shader practice followed here

- One `FragmentShader` per layer, made once and reused every frame; uniforms are set by name.
- The clock wraps every hour on a whole number of waves, so the shader's time stays precise however long the page is open. Everything else that moves (the sea's breathing, the light, the bent sand, the foam's drift) repeats over the hour too, so the wrap shows nothing.
- The layer behind the tiles skips the pixels a tile hides; the layer over them paints only the tile boxes and returns early away from their edges, and away from their rims whenever no wave is washing over them.
- Work that cannot show is skipped: the sand under water deep enough to hide it, foam too thin to pass its pattern, what a wave leaves on the sand where water covers it, the swell away from the sea, and refraction, light and wet-sand streaks on dry sand.
- The output is premultiplied, as Flutter expects.
- No booleans, unsigned integers or extra samplers, which Flutter's shaders don't support; loops have fixed counts.
- With reduced motion requested, the clock stops.

## Checking a change

```sh
flutter test
```

- **`test/rules_test.dart`** reads the site's source (everything in `lib` but `lib/ui`) and fails on a gap off the spacing scale: a `spacing:` or `runSpacing:`, a `SizedBox` with no child, or any `EdgeInsets` value. A gap may be a number on the scale, a `Gap` step, or a sum of `Gap` steps and grid measures; anything else fails, unless its line carries `// off-scale: <reason>` (one does: the ring around a theme dot). It does not read `Positioned` coordinates, the sizes of boxes with a child, or spacing inside Fortal's components. It also holds slide titles to one line of 34 characters, detail lines to 80, card titles to 24 and card detail lines to 44, counting characters rather than measuring them.
- **`test/layout_test.dart`** lays out every slide in both layouts with the site's fonts, at 90%, 100% and 110% scaling with no, medium and full radius, and fails on any overflow, or on a card that ends less than 48 above the foot of a wide slide (12 at 110%, where the two components slides need that room).

```sh
fvm flutter build web --release --wasm --no-web-resources-cdn
uv run --offline --no-project --with playwright==1.63.0 python -I tool/shots.py OUT_DIR 0.8 1.6 2.8 4.6 6.2 9.4
```

The screenshots are drawn in software, so they show the look but say nothing about speed. `SHOT_SCALE=2` checks a double-density screen.

`--wasm` builds the WebAssembly app (skwasm renderer) and a JavaScript fallback for browsers without WasmGC. Measured November 11 in headless Chromium on this Mac's graphics card, cold cache, uncompressed, first frame (median of three): wasm 0.30 s locally, 1.6 s at 50 Mbps/20 ms and 5.4 s at 12 Mbps/70 ms; JavaScript 0.51, 1.95 and 7.0 s. Wasm downloads 7.1 MB before its first frame (about 3.0 MB gzipped), mostly `skwasm.wasm` and `main.dart.wasm`. The page shows nothing until then.

Measured November 10 in headless Chromium on this Mac's graphics card (Apple M2 Max, Metal): a steady 60 frames a second at 1440 × 900, at single and double density. Without the frame limit, at 3840 × 2400 and double density, a frame took 20.6 ms on average after the shore's cleanup against 26.4 ms before (3.9 ms with the shader doing nothing). Slower machines and phones are untested.

## Not done

- Leo has not approved the look or the wording; every line of copy is a first draft.
- Reviewed on November 10 as stills at 1440 × 900, 1280 × 720, 1920 × 1080, 430 × 932 and 820 × 1180, with every control used once in headless Chromium (no page errors), and a ten-second wave sequence. The motion of the shore has only been judged by Leo.
- Two layouts: wide screens get the slides on a 1440 × 900 canvas scaled to fit; screens narrower than 900 or taller than wide get one scrolling page with every section stacked. Checked at phone, tablet, laptop and wide sizes in a desktop browser, not on a real phone.
- The links and buttons that would leave the site lead nowhere.
- At 110% scaling the two components slides end 12 above the foot rather than 48.
- The narrow layout is a 480-wide column scaled to the screen's width, so on a tablet everything, components included, is drawn about 1.7 times larger.
- With a theme other than Mar, the first slide's sea stays teal.
- No photograph of Fortaleza; the backgrounds are drawn.
- Untested on slower graphics cards, phones and Flutter's other platforms.

## Licences

- **Geist:** SIL Open Font License, in `assets/fonts/OFL.txt`.
- **Roboto Mono:** SIL Open Font License, in `assets/fonts/OFL-RobotoMono.txt`; copied from `apps/showcase`.
- **Shader adaptations (`shaders/shore.frag`, `shaders/dunes.frag`, `shaders/horizon.frag`):** surface optics, cellular foam structure, cloud FBM and dithering adapted from [`noniv/web-ocean`](https://github.com/noniv/web-ocean), MIT License (Copyright (c) 2026 Maksymilian Dendura).

## November 11 integration

Imported the dunes, horizon and shore work from `fortal-web-ocean` without changing that checkout. Three-way integration preserves the newer content-sized hero cards, measured shader bounds, chart configuration and spacing scale. The horizon/night backgrounds remain static on narrow layouts; the dune sections now share one animated shader clock, as requested in the follow-up below; reduced motion also disables the theme-color tween. `test/backdrops_test.dart` exercises real shader loading, idle/reduced-motion settling and disposal.

Leo’s follow-up replaces the sand-only scenes with one shared, fixed dunes-and-lagoon canvas behind Components, Charts and Foundations. Foreground content moves independently; a beige gradient prioritizes heading readability. Hero, Themes and Use it keep their own scenery. A later follow-up from Leo enables subtle sand-ripple, wind-blown sand and lagoon-wavelet motion at 80% of the original speed on both layouts. The camera and large dune shapes stay fixed; only the shader surface details move. The clock persists across dune sections, pauses when covered by another desktop section, and stops under reduced motion.

The latest visual tuning strengthens wind-blown sand and ripple relief, adds a broader crossing water wave, and places the sun-glitter reflection on the visible right-hand lagoon. The heading fade, fixed camera, shoreline and section-transition behavior are unchanged.

A later pass, at Leo's request, makes the scene cleaner and less soft. The dunes have sharper crests, shadow edges and ripple lines, and wind shows as thin streamers rather than haze. The water has finer, crisper chop with tighter glitter, clear aqua shallows and a thin wet shoreline. Its wavelets now visibly drift, about 0.3 m/s where they had barely moved. The beige fade is as strong behind headings and clears faster below them. Every drift is a whole number of noise periods per hour, so the clock's wrap is seamless.
