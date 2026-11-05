# Temporary preview lifecycle verification

This file exists only to exercise the standard same-repository pull-request
pipeline after deployment activation. It does not change application routes,
content, styling or pinned source inputs.

Acceptance: CI produces a clean artifact, the default-branch deployment workflow
publishes a distinct noindex URL with this commit's identity, and closing this PR
removes the preview channel and marks its deployment inactive.

Close this verification PR without merging after collecting the evidence.
