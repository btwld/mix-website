# mix_showcase

The live Flutter app behind the `/v2/` tour: five cards, four looks, and one
running instance that the page drives as the reader scrolls. It is kept apart
from `mix_docs_preview` so it can use current Mix, Remix and Naked UI APIs without
touching the 43 docs previews. It is not published to pub.dev.

It uses Mix 2.3.1, Remix 1.0.0-beta.17 and Naked UI 2.0.0-beta.1 from pub.dev.
It needs Flutter 3.44+ and Dart 3.12+ for dot shorthand.

| Path | Holds |
| --- | --- |
| `lib/tokens.dart` | Tokens, the four looks, and the `CutCorners` shape |
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

```bash
git clone https://github.com/btwld/mix-website.git
cd mix-website/packages/mix_showcase
flutter run -d chrome
```

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
Browser tests skip their live cases when it is missing. This build does not produce
the stage's loading posters (`poster-wide.png`, `poster-compact.png`), so the stage
stays empty until Flutter starts unless they are captured separately.
