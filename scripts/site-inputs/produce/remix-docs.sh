#!/usr/bin/env bash
# Build the Remix docs site input from a btwld/remix checkout.
#
# Usage: remix-docs.sh <remix-checkout> <expected-commit> <output-dir>
# Set FLUTTER_BIN to choose the SDK (defaults to `flutter` on PATH).
#
# The archive holds the docs snapshot that btwld/remix's own staging script
# produces (canonical MDX with tutorial sources and catalog panels expanded,
# plus navigation and assets) and the Widgetbook catalog compiled for its
# public mount, /remix/catalog/. Remix remains the owner of both.
set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
toolchains="$here/../toolchains.json"
fail() { echo "error: $*" >&2; exit 1; }
flutter="${FLUTTER_BIN:-flutter}"

[ $# -eq 3 ] || fail "usage: $0 <remix-checkout> <expected-commit> <output-dir>"
src="$(cd "$1" && pwd)"
commit="$2"
out="$(mkdir -p "$3" && cd "$3" && pwd)"

actual="$(git -C "$src" rev-parse HEAD)"
[ "$actual" = "$commit" ] || fail "checkout is at $actual, expected $commit"
[ -z "$(git -C "$src" status --porcelain --untracked-files=no)" ] || fail "checkout has tracked changes"

expected_flutter="$(node -p "require('$toolchains')['remix-docs'].flutter")"
flutter_json="$("$flutter" --version --machine)"
flutter_version="$(node -p "JSON.parse(process.argv[1]).frameworkVersion" "$flutter_json")"
[ "$flutter_version" = "$expected_flutter" ] || fail "Flutter $expected_flutter required, found $flutter_version"
dart="$(dirname "$(command -v "$flutter")")/dart"

(cd "$src" && "$flutter" pub get --enforce-lockfile)
# Same content contract as the Remix site: validate, then stage generated MDX
# into apps/docs/.generated/content and assets into apps/docs/public/assets.
(cd "$src" && "$dart" run tool/validate_docs.dart)
(cd "$src" && python3 tool/prepare_docs_site.py)

stage="$(mktemp -d)"
trap 'rm -rf "$stage"' EXIT
cp -R "$src/apps/docs/.generated/content" "$stage/content"
cp -R "$src/apps/docs/public/assets" "$stage/assets"
cp "$src/LICENSE" "$stage/LICENSE"
(cd "$src/apps/demo" && "$flutter" build web --release --base-href /remix/catalog/ --output "$stage/catalog")

grep -q '<base href="/remix/catalog/">' "$stage/catalog/index.html" || fail "catalog index.html does not use /remix/catalog/"

# Reproducibility: Flutter writes a random build ID and a random service
# worker version on every build. The ID is tool metadata; the version only
# cache-busts the self-unregistering worker, so derive it from the commit.
rm -f "$stage/catalog/.last_build_id"
sw_version="$((16#${commit:0:8}))"
grep -qE 'serviceWorkerVersion: "[0-9]+"' "$stage/catalog/flutter_bootstrap.js" || fail "flutter_bootstrap.js has no serviceWorkerVersion to normalize"
sed -E -i "s/serviceWorkerVersion: \"[0-9]+\"/serviceWorkerVersion: \"$sw_version\"/" "$stage/catalog/flutter_bootstrap.js"

node - "$stage" "$commit" "$flutter_json" <<'NODE'
const fs = require('node:fs');
const path = require('node:path');
const [stage, commit, flutterJson] = process.argv.slice(2);
const flutter = JSON.parse(flutterJson);
const pages = [];
const walk = dir => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const child = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(child);
    else if (entry.name.endsWith('.mdx')) pages.push(path.relative(path.join(stage, 'content'), child).replace(/\.mdx$/, ''));
  }
};
walk(path.join(stage, 'content'));
const metadata = {
  schemaVersion: 1,
  name: 'remix-docs',
  source: { repository: 'btwld/remix', commit, path: 'docs', license: 'BSD-3-Clause' },
  toolchain: { flutter: flutter.frameworkVersion, flutterRevision: flutter.frameworkRevision, dart: flutter.dartSdkVersion, engineRevision: flutter.engineRevision },
  producer: { script: 'scripts/site-inputs/produce/remix-docs.sh', commit: process.env.PRODUCER_COMMIT ?? null },
  normalized: ['catalog/.last_build_id removed', 'catalog/flutter_bootstrap.js serviceWorkerVersion = decimal of the first 8 hex digits of the source commit'],
  payload: { content: 'content/', assets: 'assets/', catalog: 'catalog/', catalogBaseHref: '/remix/catalog/', pages: pages.sort() },
};
fs.writeFileSync(path.join(stage, 'site-input.json'), JSON.stringify(metadata, null, 2) + '\n');
NODE

node "$here/../pack.mjs" "$stage" "$out/remix-docs-${commit:0:12}.tar.gz"
