#!/usr/bin/env bash
# Build an exact showcase checkout into a verified deployment input.
set -euo pipefail
if [ -n "${FLUTTER_BIN:-}" ]; then PATH="$(dirname "$FLUTTER_BIN"):$PATH"; fi
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
[ $# -eq 3 ] || { echo 'usage: showcase.sh <checkout> <commit> <output-dir>' >&2; exit 1; }
src="$(cd "$1" && pwd)"
commit="$2"
out="$(mkdir -p "$3" && cd "$3" && pwd)"
[ "$(git -C "$src" rev-parse HEAD)" = "$commit" ]
[ -z "$(git -C "$src" status --porcelain --untracked-files=no)" ]
flutter_json="$(flutter --version --machine)"
[ "$(node -p 'JSON.parse(process.argv[1]).frameworkVersion' "$flutter_json")" = "$(node -p "require('$here/../toolchains.json').showcase.flutter")" ]
(cd "$src/packages/mix_showcase" && flutter pub get --enforce-lockfile && flutter build web --release --wasm --no-web-resources-cdn --no-source-maps)
stage="$(mktemp -d)"
trap 'rm -rf "$stage"' EXIT
cp -R "$src/packages/mix_showcase/build/web" "$stage/bundle"
rm -f "$stage/bundle/flutter_service_worker.js"
node --input-type=module - "$src" "$stage" "$commit" "$flutter_json" "$here" <<'NODE'
import { writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
const [root, stage, commit, raw, here] = process.argv.slice(2);
const { mixBuildInputs } = await import(pathToFileURL(`${here}/../mix-build-inputs.mjs`).href);
await writeFile(`${stage}/bundle/build-inputs.json`, JSON.stringify(await mixBuildInputs(root, 'mix_showcase'), null, 2) + '\n');
const flutter = JSON.parse(raw);
await writeFile(`${stage}/site-input.json`, JSON.stringify({
  schemaVersion: 1, name: 'showcase',
  source: { repository: 'btwld/mix-website', commit, path: 'packages/mix_showcase' },
  toolchain: { flutter: flutter.frameworkVersion, flutterRevision: flutter.frameworkRevision, dart: flutter.dartSdkVersion, engineRevision: flutter.engineRevision },
  producer: { repository: 'btwld/mix-website', script: 'scripts/site-inputs/produce/showcase.sh', commit: process.env.PRODUCER_COMMIT ?? commit },
  payload: { bundle: 'bundle/' },
}, null, 2) + '\n');
NODE
node "$here/../pack.mjs" "$stage" "$out/showcase-${commit:0:12}.tar.gz"
