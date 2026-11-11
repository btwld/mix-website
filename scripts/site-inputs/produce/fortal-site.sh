#!/usr/bin/env bash
# Build an exact Fortal site checkout into a verified deployment input,
# served by the website at /fortal/.
set -euo pipefail
if [ -n "${FLUTTER_BIN:-}" ]; then PATH="$(dirname "$FLUTTER_BIN"):$PATH"; fi
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
[ $# -eq 3 ] || { echo 'usage: fortal-site.sh <checkout> <commit> <output-dir>' >&2; exit 1; }
src="$(cd "$1" && pwd)"
commit="$2"
out="$(mkdir -p "$3" && cd "$3" && pwd)"
pkg="$src/packages/fortal_site"
[ "$(git -C "$src" rev-parse HEAD)" = "$commit" ]
[ -z "$(git -C "$src" status --porcelain --untracked-files=no)" ]
# The SDK pin travels with the source and its lockfile.
flutter_json="$(flutter --version --machine)"
[ "$(node -p 'JSON.parse(process.argv[1]).frameworkVersion' "$flutter_json")" = "$(node -p "JSON.parse(require('fs').readFileSync('$pkg/.fvmrc', 'utf8')).flutter")" ]
(cd "$pkg" && flutter pub get --enforce-lockfile && flutter build web --release --wasm --no-web-resources-cdn --no-source-maps --base-href /fortal/)
[ -z "$(git -C "$src" status --porcelain --untracked-files=no)" ] || { echo "Build changed tracked sources; commit them and rebuild." >&2; exit 1; }
stage="$(mktemp -d)"
trap 'rm -rf "$stage"' EXIT
cp -R "$pkg/build/web" "$stage/bundle"
# The fonts and shaders ship in the bundle, so their licences ship beside them.
mkdir -p "$stage/bundle/licenses"
cp "$pkg/assets/fonts/OFL.txt" "$stage/bundle/licenses/Geist-OFL.txt"
cp "$pkg/assets/fonts/OFL-RobotoMono.txt" "$stage/bundle/licenses/RobotoMono-OFL.txt"
cp "$pkg/shaders/LICENSE-web-ocean.txt" "$stage/bundle/licenses/web-ocean-MIT.txt"
# The photograph is CC BY; its credit ships with it, as well as on the slide.
cp "$pkg/assets/photos/CREDIT.md" "$stage/bundle/licenses/photo-credit.md"
node --input-type=module - "$src" "$stage" "$commit" "$flutter_json" "$here" <<'NODE'
import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
const [root, stage, commit, raw, here] = process.argv.slice(2);
const { FORTAL_SITE, packageBuildInputs } = await import(pathToFileURL(`${here}/../package-build-inputs.mjs`).href);
await writeFile(`${stage}/bundle/build-inputs.json`, JSON.stringify(await packageBuildInputs(root, FORTAL_SITE), null, 2) + '\n');
const upstream = JSON.parse(await readFile(`${root}/${FORTAL_SITE.package}/SOURCES.json`, 'utf8'));
const flutter = JSON.parse(raw);
await writeFile(`${stage}/site-input.json`, JSON.stringify({
  schemaVersion: 1, name: 'fortal-site',
  source: { repository: 'btwld/mix-website', commit, path: FORTAL_SITE.package },
  upstream,
  toolchain: { flutter: flutter.frameworkVersion, flutterRevision: flutter.frameworkRevision, dart: flutter.dartSdkVersion, engineRevision: flutter.engineRevision },
  producer: { repository: 'btwld/mix-website', script: 'scripts/site-inputs/produce/fortal-site.sh', commit: process.env.PRODUCER_COMMIT ?? commit },
  payload: { bundle: 'bundle/' },
}, null, 2) + '\n');
NODE
node "$here/../pack.mjs" "$stage" "$out/fortal-site-${commit:0:12}.tar.gz"
