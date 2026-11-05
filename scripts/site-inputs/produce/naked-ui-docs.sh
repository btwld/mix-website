#!/usr/bin/env bash
# Stage canonical Naked UI docs from an exact btwld/remix commit. No package
# behavior is changed. Compile complete examples before publishing the input.
set -euo pipefail
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
[ $# -eq 3 ] || { echo 'usage: naked-ui-docs.sh <remix-checkout> <commit> <output-dir>' >&2; exit 1; }
src="$(cd "$1" && pwd)"
commit="$2"
out="$(mkdir -p "$3" && cd "$3" && pwd)"
[ "$(git -C "$src" rev-parse HEAD)" = "$commit" ]
[ -z "$(git -C "$src" status --porcelain --untracked-files=no)" ]
if [ -n "${FLUTTER_BIN:-}" ]; then PATH="$(dirname "$FLUTTER_BIN"):$PATH"; fi
expected="$(node -p "require('$here/../toolchains.json')['naked-ui-docs'].flutter")"
flutter_json="$(flutter --version --machine)"
[ "$(node -p "JSON.parse(process.argv[1]).frameworkVersion" "$flutter_json")" = "$expected" ]
(cd "$src" && flutter pub get --enforce-lockfile && python3 tool/check_naked_ui_docs.py)
stage="$(mktemp -d)"
trap 'rm -rf "$stage"' EXIT
python3 "$src/tool/prepare_naked_ui_docs.py" "$stage"
producer="${PRODUCER_COMMIT:-$(git -C "$here" rev-parse HEAD)}"
node - "$stage" "$commit" "$producer" "$flutter_json" <<'NODE'
const fs = require('node:fs');
const path = require('node:path');
const [stage, commit, producer, flutterJson] = process.argv.slice(2);
const flutter = JSON.parse(flutterJson);
fs.writeFileSync(path.join(stage, 'site-input.json'), JSON.stringify({
  schemaVersion: 1, name: 'naked-ui-docs',
  source: { repository: 'btwld/remix', commit, path: 'naked_ui_docs', license: 'BSD-3-Clause' },
  toolchain: { flutter: flutter.frameworkVersion, flutterRevision: flutter.frameworkRevision, dart: flutter.dartSdkVersion },
  producer: { repository: 'btwld/mix-website', script: 'scripts/site-inputs/produce/naked-ui-docs.sh', commit: producer },
  payload: { content: 'content/', references: 'SOURCES.json' },
}, null, 2) + '\n');
NODE
node "$here/../pack.mjs" "$stage" "$out/naked-ui-docs-${commit:0:12}.tar.gz"
