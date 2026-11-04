# Mix producer ownership verification

Verified locally on 2026-11-04 with Flutter 3.44.0.

The canonical preview source now lives at `packages/mix_docs_preview`, and the
producer workflow checks out `btwld/mix-website` at the requested full commit.
The archive records both source SHA and producer SHA. The lock records that
provenance; extraction checks it along with archive SHA-256, size and toolchain.

The initial consumed baseline was built from site commit
`07f167db8124ce0870ad5736b54512506c0f0df2` (historical evidence). In an isolated checkout, a one-line
change to the Box demo label was committed and rebuilt. Verification found the
changed label in both its exported source snippet and compiled `main.dart.wasm`,
and confirmed the WASM bytes differed from baseline. That throwaway input was
never pinned or published. The canonical checkout was restored to baseline.

`pnpm audit:inputs` compares all 74 manifest source files byte for byte with
canonical authoring files, checks the 30 used preview IDs and verifies the
105-page inventory. An ordinary source edit now fails this parity check until
the producer builds the matching input; it cannot silently keep using the
previous owner's artifact.

The legacy `btwld/website@509c4a9` preview pin has been replaced. Its pilot
commits/evidence remain historical. This closes local producer ownership; it
does not close archive publication or clean remote rebuild verification.

The current archive is rebuilt from canonical source and producer commit
`23a73c6c0ddad669f2feafa9ede2ba7b7351a4f7`. It records a deterministic
`build-inputs.json` fingerprint of the whole authored Flutter package and the
producer/toolchain recipe. Consumer prebuild and the independent input audit
recompute it. The check covers registry/main/helpers, web/assets, dependency
locks and file additions/deletions, while excluding generated caches/build
outputs. Unit regressions independently change non-snippet registry/helper
files and verify rejection. Display-snippet parity remains a separate check.
