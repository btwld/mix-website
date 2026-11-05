#!/usr/bin/env bash
# Build the Mix preview site input from a btwld/mix-website checkout.
#
# Usage: mix-previews.sh <mix-website-checkout> <expected-commit> <output-dir>
#
# The archive holds the multi-view Flutter bundle, previews-manifest.json and
# the Dart sources the manifest points at, so previews and their snippets
# always come from the same build. It reuses the checkout's own
# build_web_previews.sh rather than re-implementing the Mix build.
# Set FLUTTER_BIN to choose the SDK (defaults to `flutter` on PATH); its
# directory goes first on PATH because the upstream script calls flutter/dart.
set -euo pipefail
if [ -n "${FLUTTER_BIN:-}" ]; then PATH="$(cd "$(dirname "$FLUTTER_BIN")" && pwd):$PATH"; fi

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
toolchains="$here/../toolchains.json"
fail() { echo "error: $*" >&2; exit 1; }

[ $# -eq 3 ] || fail "usage: $0 <mix-website-checkout> <expected-commit> <output-dir>"
src="$(cd "$1" && pwd)"
commit="$2"
out="$(mkdir -p "$3" && cd "$3" && pwd)"

actual="$(git -C "$src" rev-parse HEAD)"
[ "$actual" = "$commit" ] || fail "checkout is at $actual, expected $commit"
[ -z "$(git -C "$src" status --porcelain --untracked-files=no)" ] || fail "checkout has tracked changes"

expected_flutter="$(node -p "require('$toolchains')['mix-previews'].flutter")"
flutter_json="$(flutter --version --machine)"
flutter_version="$(node -p "JSON.parse(process.argv[1]).frameworkVersion" "$flutter_json")"
[ "$flutter_version" = "$expected_flutter" ] || fail "Flutter $expected_flutter required, found $flutter_version"

pkg="$src/packages/mix_docs_preview"
(cd "$pkg" && flutter pub get --enforce-lockfile)
# build_web_previews.sh builds into build/web, exports lib/ to sources/,
# generates and checks the manifest, and patches the bootstrap for multi-view.
(cd "$src" && bash packages/mix_docs_preview/scripts/build_web_previews.sh --local)

stage="$(mktemp -d)"
trap 'rm -rf "$stage"' EXIT
cp -R "$pkg/build/web" "$stage/bundle"
# The bundle is embedded, never installed as an app; a worker file inside a
# versioned directory would only invite a stray registration.
rm -f "$stage/bundle/flutter_service_worker.js"
# Record package sources, registry/helpers, web/assets, dependency locks and
# exact producer/toolchain recipe. The consumer independently recomputes this.
node --input-type=module - "$src" "$stage/bundle/build-inputs.json" "$here/../mix-build-inputs.mjs" <<'NODE'
import { writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
const [root, output, helper] = process.argv.slice(2);
const { mixBuildInputs } = await import(pathToFileURL(helper).href);
await writeFile(output, JSON.stringify(await mixBuildInputs(root), null, 2) + '\n');
NODE
commit_date="$(git -C "$src" show -s --format=%cI "$commit")"

PRODUCER_COMMIT="${PRODUCER_COMMIT:-$(git -C "$here" rev-parse HEAD)}" node - "$stage" "$commit" "$flutter_json" "$commit_date" <<'NODE'
const fs = require('node:fs');
const path = require('node:path');
const [stage, commit, flutterJson, commitDate] = process.argv.slice(2);
const flutter = JSON.parse(flutterJson);
// Reproducibility: the Flutter output is byte-stable for a given commit and
// SDK; only the manifest's build timestamp is not. Use the commit date.
const manifestPath = path.join(stage, 'bundle/previews-manifest.json');
const manifestText = fs.readFileSync(manifestPath, 'utf8');
const normalizedText = manifestText.replace(/("generatedAt"\s*:\s*)"[^"]*"/, `$1${JSON.stringify(commitDate)}`);
if (normalizedText === manifestText && !manifestText.includes(commitDate)) throw new Error('previews-manifest.json has no generatedAt to normalize');
fs.writeFileSync(manifestPath, normalizedText);
const manifest = JSON.parse(normalizedText);
const config = JSON.parse(fs.readFileSync(path.join(stage, 'bundle/flutter-build-config.json'), 'utf8'));
for (const entry of manifest.entries) {
  if (!fs.existsSync(path.join(stage, 'bundle/sources', entry.sourcePath))) {
    throw new Error(`Manifest source is missing from the bundle: ${entry.sourcePath}`);
  }
}
const metadata = {
  schemaVersion: 1,
  name: 'mix-previews',
  source: { repository: 'btwld/mix-website', commit, path: 'packages/mix_docs_preview', license: null },
  toolchain: { flutter: flutter.frameworkVersion, flutterRevision: flutter.frameworkRevision, dart: flutter.dartSdkVersion, engineRevision: config.engineRevision },
  producer: { repository: 'btwld/mix-website', script: 'scripts/site-inputs/produce/mix-previews.sh', commit: process.env.PRODUCER_COMMIT ?? commit },
  normalized: ['bundle/previews-manifest.json generatedAt = source commit date'],
  payload: { bundle: 'bundle/', manifest: 'bundle/previews-manifest.json', sources: 'bundle/sources/', previewIds: manifest.entries.map(entry => entry.previewId) },
};
fs.writeFileSync(path.join(stage, 'site-input.json'), JSON.stringify(metadata, null, 2) + '\n');
NODE

node "$here/../pack.mjs" "$stage" "$out/mix-previews-${commit:0:12}.tar.gz"
