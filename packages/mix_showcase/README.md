# mix_showcase

The live Flutter examples on the `/v2/` page: eleven small examples of Mix,
Naked UI and Remix in eight live views, each shown on the page next to the source it is compiled
from. It is kept apart from `mix_docs_preview` so it can use current APIs without
touching the published docs-preview bundle. It is not published to pub.dev.

It uses Mix 2.4.0, Remix 1.0.0-rc.1 and Naked UI 2.0.0-beta.2 from pub.dev.
It needs Flutter 3.44+ and Dart 3.12+ for dot shorthand.

| Path | Holds |
| --- | --- |
| `lib/theme.dart` | The tokens, four sets of values for them, and `ThemeScope` |
| `lib/colors.dart` | The plain colors every example except `demos/themed_plan` uses |
| `lib/demos/` | The examples. Reader-facing. Each is a folder named for its widget, holding the widget's file and its styles (`style.dart`, or one file per drawing in `plan_picker`), which the page opens as editor tabs. `plans.dart` is the data several share |
| `lib/starters/` | The Mix and Naked UI `main.dart` files shown under "Get started" |
| `lib/remix_starter.dart` | The Remix `main.dart` shown under "Get started". It sits in `lib/` so its `import 'ui/ui.dart';` is the line a reader's own `lib/main.dart` needs |
| `lib/ui/` | Remix components installed with the CLI defaults: prefix `Ui`, preset `vanilla`. Owned source, see `remix.yaml` |
| `lib/host/` | Website wiring: views, page controls, the message bridge |
| `lib/main.dart` | A gallery when run alone; one view per example on the website |

## What the website reads

`lib/showcase-excerpts.ts` in the website lists every excerpt the page shows:
a file, or a `#docregion` in one, and the lines its controls point at. The build
fails if a region or a marked line no longer exists, so the page cannot show
code that is not in these files. `/v2/source/` publishes each file whole.

Everything in `lib/demos`, `lib/starters`, `lib/remix_starter.dart` and
`lib/theme.dart` is read by developers, so it must read like idiomatic Mix,
Naked UI and Remix:

- no `Prop.`, `.resolve(`, `.onBuilder(` or deprecated Mix shorthands;
- no imports from `lib/host`. An example takes plain constructor arguments,
  and `lib/host/demos.dart` connects those to the page;
- plain colors from `lib/colors.dart`. Only `demos/themed_plan` uses tokens;
- styles are called to build their widget (`label('Save')`,
  `card(children: …)`, `planGrid(children: …)`), never passed as `style:`;
- layout is a Mix style too: `FlexBoxStyler` for a row or a column, merged
  into the decorated style where there is one, and `GridBoxStyler` only where
  there are real tracks. No `Row`, `Column` or `Flex` widgets, except in
  `lib/starters/naked_ui.dart`, which is plain Flutter on purpose;
- an example reuses what an earlier one on the page defined (`label`,
  `button`, `PlanCard`, `plans`) instead of restating it;
- an example keeps its styles in `style.dart` and its widget in a file of its
  own, so the page can show both as files.

`test/source_rules_test.dart` enforces these.

Style code is stacked: a chain of two or more calls reads one call per line,
and a chain passed as an argument sits inside its parentheses with each call on
its own line:

```dart
    .shadow(
      .color(shadow)
      .blurRadius(28)
      .offset(x: 0, y: 14),
    );
```

The formatter joins chains that fit on a line, so a style file starts with
`// dart format off`, which keeps the whole file as written. The page shows
that line like any other. `test/source_rules_test.dart` checks the stacking. Everything else is formatted
at 60 columns (`analysis_options.yaml`), because the code is shown beside a
live view. Format only the files written here, never the installed `lib/ui`:

```bash
dart format lib/demos lib/host lib/starters lib/theme.dart lib/colors.dart \
  lib/main.dart lib/remix_starter.dart test
```

## How the page shows it

The page keeps four Flutter views and points each at whichever example is
nearest the reader (`components/v2/flutter.tsx`). Views are never destroyed:
the engine does not release a removed view's WebGL contexts, and browsers allow
only a few. All views are the same size, because where the engine draws every
view through one shared surface, each takes the size of the newest. An example
therefore sits centered in a 400-pixel-tall view, and the page shows the band
of it that the example needs.

Values that must survive a view moving to another example live in `Host`
(`lib/host/host.dart`), not in widget state.

## Check

```bash
flutter analyze
flutter test
```

## Run it on its own

```bash
cd packages/mix_showcase
flutter pub get
flutter run -d chrome
```

That opens a gallery of every example with a theme switch. To start smaller,
run one starter: `flutter run -d chrome -t lib/starters/mix.dart`.

## Run it on the site

The website does not build this app, so `/v2/` needs a local bundle. Without
one, each example says it did not load and its code stays readable. Copy the
bundle's contents, not an extra nested `web` directory:

```bash
flutter build web --release --wasm --no-web-resources-cdn --no-source-maps
cd ../..
rm -rf public/v2-flutter && mkdir -p public/v2-flutter
cp -R packages/mix_showcase/build/web/. public/v2-flutter/
pnpm build
pnpm start --port 3200
```

Then open <http://localhost:3200/v2/>. `public/v2-flutter` is ignored build
output. Browser tests skip their live cases when it is missing.

## Adding a recipe

```bash
dart run remix_cli:remix add <component>
```

The page tells readers to install the CLI globally and type `remix add`. This
package pins the CLI as a dev dependency instead, so `dart run remix_cli:` runs
the exact version recorded in `pubspec.lock`.

This writes the recipe into `lib/ui` and generates its `Ui*` widget. In your
own app that source is yours to edit; here it stays as installed, so
`remix add --diff` shows only registry changes. `lib/ui/analysis_options.yaml`
keeps it on Dart's default formatting for the same reason. `remix.yaml` pins
the registry revision, so this installs the same recipes each time. Commit the
new files with `remix.ownership.json`.
