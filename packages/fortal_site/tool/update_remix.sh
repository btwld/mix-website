#!/usr/bin/env bash
# Bring the site up to the latest Remix main: pin the registry to main's
# current commit, reinstall every Fortal item from it, and move the remix
# package to main's current commit. Run from anywhere; review the diff after.
set -euo pipefail
cd "$(dirname "$0")/.."

fvm dart run remix_cli:remix registry update @remix --ref main

# Every item this app has installed, read from the ownership record.
items=$(python3 -c '
import json
targets = json.load(open("remix.ownership.json"))["targets"]
print(" ".join(sorted({t.split("/")[-1] for t in targets.values()})))
')
# shellcheck disable=SC2086
fvm dart run remix_cli:remix add --overwrite $items

fvm flutter pub upgrade remix
fvm dart format lib >/dev/null
