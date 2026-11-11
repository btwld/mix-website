# Fortal site

The Fortal showcase served at `/fortal/`: a browsable, slide-by-slide site for
Fortal, the design system built with Remix, made from real Fortal components.

This package is copied from its source repository; `SOURCES.json` records the
repository and commit. Do not edit it here. Refresh it with
`node scripts/migrate/sync-fortal-site.mjs <source checkout> [<commit>]`, then
publish and pin the `fortal-site` site input
(`scripts/site-inputs/produce/fortal-site.sh`).

## Licences

- **Geist:** SIL Open Font License, in `assets/fonts/OFL.txt`.
- **Roboto Mono:** SIL Open Font License, in `assets/fonts/OFL-RobotoMono.txt`.
- **Shader adaptations (`shaders/shore.frag`, `shaders/dunes.frag`,
  `shaders/horizon.frag`):** surface optics, cellular foam structure, cloud FBM
  and dithering adapted from [`noniv/web-ocean`](https://github.com/noniv/web-ocean),
  MIT License (Copyright (c) 2026 Maksymilian Dendura); see
  `shaders/LICENSE-web-ocean.txt`.
