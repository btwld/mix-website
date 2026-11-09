# mix_showcase

The live Flutter app behind the `/v2/` tour: five cards, four looks, and one
running instance that the page drives as the reader scrolls. It is kept apart
from `mix_docs_preview` so it can use current Mix, Remix and Naked UI APIs without
touching the published docs-preview bundle. It is not published to pub.dev.

It uses Mix 2.3.1, Remix 1.0.0-beta.17 and Naked UI 2.0.0-beta.1 from pub.dev.
It needs Flutter 3.44+ and Dart 3.12+ for dot shorthand.

| Path | Holds |
| --- | --- |
| `lib/tokens.dart` | Tokens, the four looks, and the `CutCorners` shape |
| `lib/token_example.dart` | Standalone token lifecycle example, with no showcase helpers |
| `lib/styles.dart` | Shared Mix styles, written only against tokens |
| `lib/cards.dart` | The five cards and their layouts |
| `lib/showcase.dart` | Local demo state. Nothing reaches a server |
| `lib/app.dart`, `lib/main.dart` | The frame, X-ray overlay and entry point |
| `lib/bridge*.dart` | The JSON patch bridge to the website |

## What the website reads

`lib/showcase-source.ts` publishes the code between `#docregion` markers as site
excerpts, and `/v2/source/` publishes each file whole, so this code is reader-facing.
Keep `styles.dart` in Mix's fluent style: no `Prop`, `.create()` or `BuildContext`.
A test enforces it.

`ShapeToken` and `LiftToken` in `tokens.dart` are showcase adapters, not Mix APIs.
Mix 2.3.1 has no built-in shape token, and its `BoxShadowToken` does not fit
`.shadow()` or `.shadows()`.

## Check

```bash
flutter analyze
flutter test
```

## Run it on its own

From the repository root at the revision shown on `/v2/source/`:

```bash
cd packages/mix_showcase
flutter pub get
flutter run -d chrome
```

For a smaller starting point, run `flutter run -d chrome -t lib/token_example.dart`.
It declares built-in color, spacing, and typography tokens, provides values through
`MixScope` above the app, and swaps named value sets without changing the styles.
Its token-styled control works by pointer, or Tab followed by Enter or Space.
`MixScope.inherit` merges partial overrides; a plain nested `MixScope` replaces the
available token set. The optional `FortalTheme` deliberately owns a separate scope.

The website's Fortal comparison affects Today only, within the Remix chapter.
Other chapters use the custom look styles shown in their excerpts. Returning to
Remix restores its remembered comparison; feature previews choose the appropriate
custom or Fortal implementation explicitly.

## Run it on the site

The website does not build this app, so `/v2/` needs a local bundle. Without one it
offers a retry and the source explorer. Copy the bundle's contents, not an extra
nested `web` directory:

```bash
flutter build web --release --wasm --no-web-resources-cdn --no-source-maps
cd ../..
mkdir -p public/v2-flutter
cp -R packages/mix_showcase/build/web/. public/v2-flutter/
pnpm build
pnpm start --port 3200
```

Then open <http://127.0.0.1:3200/v2/>. `public/v2-flutter` is ignored build output.
Browser tests skip their live cases when it is missing. While Flutter starts, the
stage draws card outlines in CSS. It requests no loading image, so replacing this
directory with a fresh build cannot leave a broken poster behind.
