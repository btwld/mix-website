// Wind-sculpted Ceará coastal sand dunes and interdune lagoons for Fortal's
// Component, Chart, and Foundation slides.
//
// Combines a 3D ray-intersected asymmetric barchan/transverse dune heightfield
// (razor-sharp sinuous S-curve brinks with analytical silhouette anti-aliasing,
// bifurcating aeolian wind ripples on sunlit stoss slopes, smooth warm-ochre
// leeward slip-faces, and brisk trade-wind sand spindrift streamers) with
// noniv/web-ocean's water surface optics (LEAN multi-octave wind-ripple
// covariance, anisotropic Gaussian sun glitter with Smith masking, Schlick
// Fresnel dune/sky reflection, Beer-Lambert shallow sandbar absorption, and IGN
// dithering) where interdune valleys dip below the lagoon water table.
//
// Water optics & noise primitives adapted from noniv/web-ocean
// (MIT License, Copyright (c) 2026 Maksymilian Dendura).
#version 460 core

#include <flutter/runtime_effect.glsl>

precision highp float;

uniform vec2 uSize;
uniform float uTime;   // seconds, wrapped at 3600.0 (shoreLoop)
uniform float uScene;  // 0: Dunes A, 1: Dunes B, 2: Lagoon Overlook, 3: Lagoon Shore
uniform vec3 uWater;
uniform vec3 uDeepWater;
uniform vec3 uTint;    // multiplies the finished scene: deep green dunes

out vec4 fragColor;

const float kPi = 3.14159265;
const float kLoop = 3600.0;
const float kOmega0 = 6.2831853 / kLoop;
const mat2 kRot = mat2(0.8, 0.6, -0.6, 0.8);

// Warm Ceará coastal dune palette (inspired by Jericoacoara / Lençóis dunes),
// tinted green at the end by `uTint` behind the site's white headings.
const vec3 kSandBright = vec3(0.990, 0.950, 0.862);
const vec3 kSandLit = vec3(0.956, 0.892, 0.772);
const vec3 kSandFlank = vec3(0.892, 0.800, 0.646);
const vec3 kSandShadow = vec3(0.760, 0.622, 0.438);
const vec3 kSandDeepShade = vec3(0.682, 0.538, 0.358);
const vec3 kSandDampRim = vec3(0.665, 0.518, 0.322);
const vec3 kSkyZenith = vec3(0.680, 0.865, 0.895);
const vec3 kSkyHaze = vec3(0.964, 0.922, 0.830);
const vec3 kSunTint = vec3(1.000, 0.980, 0.920);

float hash(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * 0.1031);
  q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}

vec2 hash2(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
  q += dot(q, q.yzx + 33.33);
  return fract((q.xx + q.yz) * q.zy);
}

float gnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  vec2 g00 = hash2(i) * 2.0 - 1.0;
  vec2 g10 = hash2(i + vec2(1.0, 0.0)) * 2.0 - 1.0;
  vec2 g01 = hash2(i + vec2(0.0, 1.0)) * 2.0 - 1.0;
  vec2 g11 = hash2(i + vec2(1.0, 1.0)) * 2.0 - 1.0;
  return mix(
    mix(dot(g00, f), dot(g10, f - vec2(1.0, 0.0)), u.x),
    mix(dot(g01, f - vec2(0.0, 1.0)), dot(g11, f - vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float loopGNoise(vec2 p, vec2 cells) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  vec2 wraps = step(1.0, cells);
  vec2 period = max(cells, 1.0);
  vec2 a = i - wraps * period * floor((i + 0.5) / period);
  vec2 b = i + 1.0;
  b -= wraps * period * floor((b + 0.5) / period);
  vec2 g00 = hash2(a) * 2.0 - 1.0;
  vec2 g10 = hash2(vec2(b.x, a.y)) * 2.0 - 1.0;
  vec2 g01 = hash2(vec2(a.x, b.y)) * 2.0 - 1.0;
  vec2 g11 = hash2(b) * 2.0 - 1.0;
  return mix(
    mix(dot(g00, f), dot(g10, f - vec2(1.0, 0.0)), u.x),
    mix(dot(g01, f - vec2(0.0, 1.0)), dot(g11, f - vec2(1.0, 1.0)), u.x),
    u.y
  );
}

vec3 loopGNoiseGrad(vec2 p, vec2 cells) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  vec2 du = 30.0 * f * f * (f * (f - 2.0) + 1.0);
  vec2 wraps = step(1.0, cells);
  vec2 period = max(cells, 1.0);
  vec2 a = i - wraps * period * floor((i + 0.5) / period);
  vec2 b = i + 1.0;
  b -= wraps * period * floor((b + 0.5) / period);
  vec2 g00 = hash2(a) * 2.0 - 1.0;
  vec2 g10 = hash2(vec2(b.x, a.y)) * 2.0 - 1.0;
  vec2 g01 = hash2(vec2(a.x, b.y)) * 2.0 - 1.0;
  vec2 g11 = hash2(b) * 2.0 - 1.0;

  float va = dot(g00, f);
  float vb = dot(g10, f - vec2(1.0, 0.0));
  float vc = dot(g01, f - vec2(0.0, 1.0));
  float vd = dot(g11, f - vec2(1.0, 1.0));

  float k0 = va;
  float k1 = vb - va;
  float k2 = vc - va;
  float k3 = va - vb - vc + vd;

  float val = k0 + k1 * u.x + k2 * u.y + k3 * u.x * u.y;
  vec2 grad =
    g00 + u.x * (g10 - g00) + u.y * (g01 - g00) +
    u.x * u.y * (g00 - g10 - g01 + g11) +
    du * (vec2(k1, k2) + k3 * u.yx);
  return vec3(val, grad);
}

float fresnelWater(float c) {
  float x = 1.0 - clamp(c, 0.0, 1.0);
  float x2 = x * x;
  return 0.02 + 0.98 * x2 * x2 * x;
}

float lambdaSmith(vec3 w, vec3 cov) {
  float xz2 = max(dot(w.xz, w.xz), 1e-8);
  float il = inversesqrt(xz2);
  vec2 az = w.xz * il;
  float sig2 = az.x * az.x * cov.x + az.y * az.y * cov.y + 2.0 * az.x * az.y * cov.z;
  float cotT = w.y * il;
  float a = max(cotT, 1e-3) / sqrt(2.0 * max(sig2, 1e-7));
  if (a >= 1.6) {
    return 0.0;
  }
  return (1.0 - 1.259 * a + 0.396 * a * a) / (3.535 * a + 2.181 * a * a);
}

float ign(vec2 p) {
  return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715))));
}

// C1-seamless asymmetric barchan/transverse dune wave:
// gentle convex windward stoss climb on [0, 0.70], razor-sharp rounded brink
// at 0.70, and steep smooth leeward slip-face on [0.70, 1.0].
// Returns vec3(profileHeight, slipFaceMask, brinkMask).
vec3 barchanWave(float s, float kBrink) {
  float u = fract(s);
  const float w = 0.70;
  float tw = u / w;
  float a = tw * tw * (1.45 - 0.45 * tw);
  float rw = (1.0 - u) / (1.0 - w);
  float b = rw * rw * (1.10 - 0.10 * rw);
  float h = clamp(0.5 + 0.5 * (b - a) / max(kBrink, 1e-3), 0.0, 1.0);
  float prof = mix(b, a, h) - kBrink * h * (1.0 - h);
  float slip = 1.0 - h;
  float brink = 4.0 * h * (1.0 - h);
  return vec3(max(prof, 0.0), slip, brink);
}

// Calm sanctuary mask where UI navigation & headings sit (`xz` in world metres):
// lifts terrain onto a gentle sunlit windward flank so heading text never
// crosses dark water or harsh slip-face boundaries.
float uiSanctuary(vec2 xz) {
  // Full-width top navigation bar (`z > 68m`).
  float navBand = smoothstep(68.0, 98.0, xz.y);
  // Top-left SlideHeading title + subtitle (`x < 10m, z = 40..95m`).
  float headBox =
    (1.0 - smoothstep(-2.0, 14.0, xz.x)) *
    smoothstep(35.0, 48.0, xz.y);
  return clamp(max(navBand, headBox), 0.0, 1.0);
}

// 3D macro dune heightfield in metres (`xz.x` across, `xz.y` depth forward).
// Returns vec3(height, slipFaceMask, brinkMask).
vec3 duneField(vec2 xz, float kBrink) {
  float calm = uiSanctuary(xz);

  float shift = uScene * 0.34;
  vec2 seedOff = vec2(uScene * 1.7 + 2.1, uScene * 2.3 + 5.8);

  // Graceful sinuous S-curve planform (Photo 1 & Photo 2) using C-infinity
  // multi-harmonic wave warps so 3D raymarching runs at locked 60 fps on Retina.
  float sCurve =
    0.38 * sin(xz.y * 0.056 - 0.55 + uScene * 1.1) +
    0.14 * sin(xz.x * 0.031 + xz.y * 0.043 + seedOff.x) +
    0.08 * cos(xz.x * 0.057 - xz.y * 0.029 + seedOff.y);
  float s1 = (xz.x * 0.92 - xz.y * 0.25) / 24.0 + sCurve + shift;
  vec3 b1 = barchanWave(s1, mix(kBrink, 0.24, calm));

  // Secondary oblique crescent arm creates 3D saddles, bowls, and dune horns.
  float s2Warp =
    0.15 * sin(xz.x * 0.027 - xz.y * 0.034 + seedOff.y) +
    0.09 * cos(xz.x * 0.049 + xz.y * 0.021 + seedOff.x);
  float s2 = (xz.x * 0.54 + xz.y * 0.56) / 33.0 + s2Warp - shift * 0.6;
  vec3 b2 = barchanWave(s2, mix(kBrink * 1.5, 0.28, calm));

  float swell =
    0.28 * sin(xz.x * 0.019 + xz.y * 0.023 + seedOff.x) +
    0.20 * cos(xz.x * 0.033 - xz.y * 0.017 + seedOff.y);
  float relief = (2.95 * b1.x + 1.15 * b2.x + swell) * mix(1.0, 0.28, calm);
  float h = 0.95 + relief + calm * 1.85;

  // Scenes 2 (Charts) & 3 (Foundations) sculpt Photo 2's iconic Ceará interdune
  // lagoon: sweeping foreground rippled dune on the left plunging diagonally
  // into deep emerald-teal water cradling sunlit sand-dune peninsulas!
  float hasLagoon = step(1.5, uScene);
  const float kWaterLevel = 2.05;
  if (hasLagoon > 0.5) {
    // Keep the uncarved foreground dune safely above `kWaterLevel` everywhere
    // outside `inBasin` so left margins & credits never collect stray puddles.
    float dryH = 2.62 + 0.80 * relief + calm * 1.35;

    float diagEdge = mix(
      -4.2 + (xz.y - 22.0) * 0.22,
      -3.4 + (xz.y - 22.0) * 0.25,
      step(2.5, uScene)
    );
    float curveBank =
      2.5 * sin(xz.y * 0.11 + uScene) +
      1.15 * sin(xz.y * 0.067 - xz.x * 0.052 + 2.1) +
      0.60 * cos(xz.y * 0.165 + xz.x * 0.078 + 0.9);
    float leftGuard = smoothstep(-5.2, -0.4, xz.x);
    float inBasin =
      leftGuard *
      smoothstep(diagEdge - 2.5, diagEdge + 6.5, xz.x + curveBank) *
      (1.0 - smoothstep(54.0, 70.0, xz.y)) *
      (1.0 - calm);

    // On Foundations (`uScene = 3`), let the lagoon open across the bottom-right
    // while keeping bottom-left ("Built with Mix and Remix.") on sunlit sand.
    if (uScene > 2.5) {
      float bottomShore =
        smoothstep(-2.6, 3.2, xz.x) *
        (1.0 - smoothstep(17.8, 21.2, xz.y + 0.9 * sin(xz.x * 0.20))) *
        (1.0 - calm);
      inBasin = clamp(max(inBasin, bottomShore), 0.0, 1.0);
    }

    // Carve the interdune lagoon floor smoothly below `kWaterLevel = 2.05m`,
    // then sculpt a sinuous sunlit golden sand-dune spit rising out of the
    // emerald lagoon water (Photo 2!).
    float lagoonFloor = 0.80 + 0.30 * b1.x + 0.16 * swell;
    float spitCenterZ = mix(
      27.5 - (xz.x - 5.5) * 0.32,
      20.6 - (xz.x - 7.5) * 0.16,
      step(2.5, uScene)
    );
    float spitAxis = xz.y - (spitCenterZ + 2.0 * sin(xz.x * 0.19));
    float spitReach = mix(
      smoothstep(-0.5, 7.5, xz.x),
      smoothstep(1.2, 7.8, xz.x),
      step(2.5, uScene)
    );
    float spit =
      exp(-(spitAxis * spitAxis) / 20.0) *
      spitReach *
      (1.92 + 0.58 * b1.x);
    float carvedH = lagoonFloor + spit;
    h = mix(dryH, carvedH, inBasin);
  }

  float dryDune = hasLagoon > 0.5 ? smoothstep(kWaterLevel + 0.12, kWaterLevel + 0.65, h) : 1.0;
  float slip = clamp(b1.y * 0.88 + b2.y * 0.24, 0.0, 1.0) * (1.0 - calm * 0.88) * dryDune;
  float brink = clamp(b1.z + b2.z * 0.45, 0.0, 1.0) * (1.0 - calm * 0.80) * dryDune;
  return vec3(h, slip, brink);
}

float surfaceHeight(vec2 xz, float waterLevel, float hasLagoon) {
  float dh = duneField(xz, 0.055).x;
  return hasLagoon > 0.5 ? max(dh, waterLevel) : dh;
}

// Shade sunlit rippled windward sand, warm-ochre slip-faces, and damp shore rim.
vec3 shadeSand(
  vec2 xz,
  float dist,
  float fp,
  float hasLagoon,
  float waterLevel,
  vec3 V,
  vec3 sunDir
) {
  float kBrink = 0.022 + clamp(fp * 0.28, 0.0, 0.12);
  vec3 d0 = duneField(xz, kBrink);
  float eps = max(0.07, fp * 0.85);
  float hx1 = duneField(xz + vec2(eps, 0.0), kBrink).x;
  float hz1 = duneField(xz + vec2(0.0, eps), kBrink).x;
  vec2 macroSl = vec2(hx1 - d0.x, hz1 - d0.x) / eps;

  float hAboveWater = hasLagoon > 0.5 ? max(d0.x - waterLevel, 0.0) : 10.0;
  float dampRim = hasLagoon > 0.5 ? 1.0 - smoothstep(0.0, 0.09 + fp * 0.45, hAboveWater) : 0.0;

  float calm = uiSanctuary(xz);

  // Aeolian wind ripples wrap naturally around the dune slope and vanish on
  // steep avalanching leeward slip-faces (Photo 1 & Photo 2).
  vec2 windDir = normalize(vec2(0.92, -0.39) - macroSl * 0.26);
  vec2 windPerp = vec2(-windDir.y, windDir.x);
  float alongW = dot(xz, windDir);
  float acrossW = dot(xz, windPerp);

  float ripMask =
    (1.0 - 0.90 * d0.y) *
    (1.0 - 0.82 * dampRim) *
    mix(1.0, 0.24, calm);

  // Primary ~0.46m bifurcating sand ripples + secondary ~1.35m mega-ripples.
  float visFine = (1.0 - smoothstep(0.10, 0.32, fp)) * ripMask;
  float visMed = (1.0 - smoothstep(0.26, 0.82, fp)) * ripMask;
  vec2 ripSl = vec2(0.0);
  float ripCrest = 0.5;
  if (visFine > 0.004) {
    float fork = gnoise(vec2(acrossW * 0.42, alongW * 0.14) + vec2(4.1, 8.7)) * 2.55;
    float wRip = floor(1.65 / kOmega0 + 0.5) * kOmega0;
    float ph = alongW * 13.5 + fork - wRip * uTime;
    // Extra harmonics give each ripple a crisp crest line; they fade out
    // before they would alias at the pixel footprint.
    float h2 = 1.0 - smoothstep(0.035, 0.070, fp);
    float dWave = cos(ph) + (0.44 + 0.16 * h2) * cos(2.0 * ph - 0.40) +
      0.30 * h2 * cos(3.0 * ph - 0.80);
    ripCrest = 0.5 + 0.5 * sin(ph);
    ripSl += windDir * (dWave * 0.165 * visFine);
  }
  if (visMed > 0.004) {
    float fork2 = gnoise(vec2(acrossW * 0.16, alongW * 0.06) + vec2(9.3, 2.4)) * 1.8;
    float wMed = floor(0.65 / kOmega0 + 0.5) * kOmega0;
    float ph2 = alongW * 4.6 + fork2 - wMed * uTime;
    ripSl += windDir * (cos(ph2) * 0.065 * visMed);
  }

  // Fine quartz sand grain micro-texture in the close foreground.
  float grainVis = (1.0 - smoothstep(0.04, 0.12, fp)) * (1.0 - 0.7 * dampRim);
  float grain = 0.0;
  if (grainVis > 0.01) {
    grain = (hash(floor(xz * 42.0)) - 0.5) * grainVis;
    ripSl += vec2(grain, -grain) * 0.042;
  }

  vec2 totSl = macroSl + ripSl;
  vec3 nrm = normalize(vec3(-totSl.x, 1.0, -totSl.y));

  float ndl = dot(nrm, sunDir);
  float direct = smoothstep(-0.02, 0.58, ndl);
  float slipWarmth = smoothstep(0.15, 0.85, d0.y);
  vec3 shadowTone = mix(kSandShadow, kSandDeepShade, slipWarmth * 0.48);
  // Lit tone follows the raw slope so ripples keep their relief on sunlit
  // faces, while `direct` gives the slip-face shadow a crisp edge.
  vec3 litTone = mix(kSandFlank, kSandLit, smoothstep(0.16, 0.66, ndl));
  litTone = mix(litTone, kSandBright, pow(clamp(ndl, 0.0, 1.0), 3.2) * 0.55);

  vec3 sand = mix(shadowTone, litTone, smoothstep(0.06, 0.52, direct));
  sand = mix(sand, kSandBright, d0.z * smoothstep(0.2, 0.7, direct) * 0.40);
  sand *= 0.986 + 0.028 * ripCrest * visFine + 0.024 * grain;

  // Sparkling quartz micro-glints on sun-facing foreground sand grains.
  if (grainVis > 0.02) {
    vec3 Hv = normalize(V + sunDir);
    float specG = pow(max(dot(nrm, Hv), 0.0), 48.0);
    float sparkle = step(0.86, hash(floor(xz * 36.0)));
    sand += kSunTint * (specG * (0.09 + 0.16 * sparkle) * grainVis * (1.0 - d0.y));
  }

  // Warm golden-ochre damp shoreline rim (Photo 2 — natural damp quartz sand,
  // never muddy dark brown).
  if (dampRim > 0.002) {
    float damp = smoothstep(0.0, 1.0, dampRim);
    vec3 dampCol = mix(kSandFlank, kSandDampRim, damp);
    float FrWet = fresnelWater(max(dot(nrm, V), 0.0)) * damp * 0.28;
    dampCol = mix(dampCol, mix(kSkyHaze, kSkyZenith, 0.40), FrWet);
    sand = mix(sand, dampCol, damp * 0.62);
  }

  float haze = 1.0 - exp(-max(dist - 26.0, 0.0) * 0.0050);
  sand = mix(sand, kSkyHaze, haze * 0.48);
  return sand;
}

vec3 shadeLagoon(
  vec2 xz,
  float wDepth,
  float dist,
  float fp,
  float waterLevel,
  vec3 V,
  vec3 glitterSunDir,
  float gust
) {
  // Multi-scale wind-driven lagoon wavelets (`noniv/web-ocean` LEAN spectrum).
  // Finer, crisper chop: energy sits in the short wavelets, so the near water
  // reads as sharp facets and points of light rather than broad soft blobs.
  float unres = 0.0011 * (0.65 + 0.50 * gust);
  vec2 sl = vec2(0.0);
  mat2 basis = mat2(0.92, -0.39, 0.39, 0.92);
  float freq = 0.95;
  float amp = 0.052;
  float shoreCalm = smoothstep(0.02, 0.22, wDepth);
  for (int i = 0; i < 4; i++) {
    float gk = mix(0.75, gust, 0.65) * mix(0.35, 1.0, shoreCalm);
    float a = amp * gk;
    vec2 sc = vec2(freq * 1.45, freq * 0.65);
    float slRms = a * length(sc) * 0.62;
    float vis = 1.0 - smoothstep(0.14, 0.45, fp * freq);
    unres += (1.0 - vis * vis) * slRms * slRms * 0.55;
    if (vis > 0.004) {
      float steps = floor(96.0 + float(i) * 54.0 + 0.5);
      vec2 cells = vec2(steps, steps);
      // Whole lattice periods per loop (seamless wrap), fast enough to read
      // as moving water: about 0.3 m/s for the longest wavelets, slower for
      // the finer ones, each octave crossing at its own angle.
      vec2 drift = vec2(-16.0, 8.0) * (steps / kLoop) * uTime;
      vec2 m0 = basis[0] * sc.x;
      vec2 m1 = basis[1] * sc.y;
      vec2 q = vec2(dot(xz, m0), dot(xz, m1)) + drift + float(i) * vec2(7.9, 13.1);
      vec3 ng = loopGNoiseGrad(q, cells);
      vec2 dWorld = ng.y * m0 + ng.z * m1;
      sl += (a * vis) * dWorld;
    }
    basis = kRot * basis;
    freq *= 1.95;
    amp *= 0.62;
  }

  // A broad crossing wave makes the moving surface legible through the beige
  // veil. It bends the reflection, not the shoreline or the camera.
  vec2 swellDir = normalize(vec2(0.88, -0.48));
  float swellSpeed = floor(1.15 / kOmega0 + 0.5) * kOmega0;
  float swellPhase = dot(xz, swellDir) * 1.9 - swellSpeed * uTime;
  float swellVisible = 1.0 - smoothstep(0.18, 0.65, fp);
  sl += swellDir * cos(swellPhase) * 0.040 * shoreCalm * swellVisible;

  vec3 nrm = normalize(vec3(-sl.x, 1.0, -sl.y));
  vec3 cov = vec3(unres * 1.15, unres * 0.88, -0.0005 * gust);

  // Natural Photo 2 Beer-Lambert sand-to-lagoon depth transition:
  // warm submerged amber sandbar near the rim -> deep jewel-toned lagoon teal!
  vec2 refrXz = xz - nrm.xz * clamp(wDepth * 0.35, 0.0, 0.28);
  float subMottle = gnoise(refrXz * 0.65) * 0.5 + 0.5;
  // Clean pale-aqua shallows over light sand, not a muddy ochre band.
  vec3 subSand =
    mix(kSandFlank, kSandLit, 0.30 + 0.25 * subMottle) * vec3(0.84, 0.98, 0.95);

  vec3 lagoonMid = mix(uWater, vec3(0.055, 0.365, 0.415), 0.58);
  vec3 lagoonDeep = mix(uDeepWater, vec3(0.022, 0.215, 0.265), 0.64);
  vec3 waterBody = mix(lagoonMid, lagoonDeep, smoothstep(0.12, 0.95, wDepth));
  // Subtle facet relief on upwelling lagoon water (matches Photo 2's crisp chop).
  float chopShade = clamp(0.5 + 2.4 * dot(nrm.xz, vec2(-0.74, -0.47)), 0.0, 1.0);
  waterBody *= mix(0.88, 1.12, chopShade);

  vec3 trans = exp(-wDepth * vec3(9.0, 5.6, 4.6));
  vec3 body = mix(waterBody, subSand, trans);

  // Grazing Fresnel reflection: mirrors sky + smooth golden glow from nearby dunes.
  vec3 R = reflect(-V, nrm);
  R.y = max(R.y, 0.01);
  R = normalize(R);
  vec3 skyRefl = mix(kSkyHaze, kSkyZenith, smoothstep(0.02, 0.55, R.y));
  float bankGlow = exp(-wDepth * 3.2) * 0.40 + (1.0 - smoothstep(0.02, 0.30, R.y)) * 0.28;
  vec3 refl = mix(skyRefl, mix(kSandShadow, kSandLit, 0.62), clamp(bankGlow, 0.0, 0.66));
  vec3 nF = normalize(mix(nrm, vec3(0.0, 1.0, 0.0), 0.42));
  float Fr = fresnelWater(max(dot(nF, V), 0.0)) * mix(0.35, 0.88, shoreCalm);

  // Anisotropic Gaussian sun glitter with Smith masking (web-ocean ocean.js).
  vec3 Hv = normalize(V + glitterSunDir);
  vec2 hs = -Hv.xz / max(Hv.y, 1e-3);
  vec2 dsl = hs - sl;
  float det = max(cov.x * cov.y - cov.z * cov.z, 1e-9);
  float ex = (dsl.x * dsl.x * cov.y + dsl.y * dsl.y * cov.x - 2.0 * dsl.x * dsl.y * cov.z) / det;
  float pdf = exp(-0.5 * ex) / (2.0 * kPi * sqrt(det));
  float hy2 = Hv.y * Hv.y;
  float Dm = pdf / max(hy2 * hy2, 1e-5);
  float G = 1.0 / (1.0 + lambdaSmith(V, cov) + lambdaSmith(glitterSunDir, cov));
  float Fh = fresnelWater(dot(V, Hv));
  vec3 spec = kSunTint * (Fh * Dm * G / (4.0 * max(V.y, 0.06))) * 0.30 * shoreCalm;

  vec3 col = body * (1.0 - Fr) + refl * Fr + min(spec, vec3(0.85));
  float haze = 1.0 - exp(-max(dist - 26.0, 0.0) * 0.0050);
  return mix(col, kSkyHaze, haze * 0.52);
}

void main() {
  vec2 size = max(uSize, vec2(1.0));
  vec2 uv = FlutterFragCoord().xy / size;
  float aspect = size.x / size.y;

  float focal = 1.22;
  float horizonY = -0.15;
  vec2 ndc = vec2((uv.x - 0.5) * aspect, horizonY - uv.y);
  vec3 dir = normalize(vec3(ndc.x, ndc.y, focal));
  vec3 camPos = vec3(0.0, 17.5, 0.0);
  float rayDown = max(-dir.y, 0.04);

  vec3 sunDir = normalize(vec3(-0.74, 0.48, -0.47));
  // Aim the soft glitter lobe into the visible right-hand lagoon, away from
  // the heading. Its facets move with the waves instead of a painted glow.
  vec3 glitterSunDir = normalize(vec3(0.60, 0.94, 1.22));

  float hasLagoon = step(1.5, uScene);
  float waterLevel = 2.05;

  // 20-step tight-slab raymarch + 4-step bisection, tracking the closest
  // foreground sand-crest graze (`grazeClear`) so 3D dune-over-water occlusion
  // silhouettes anti-alias smoothly across sub-pixel boundaries at 60 fps.
  const float kMaxH = 6.6;
  float minH = hasLagoon > 0.5 ? waterLevel - 0.05 : 0.45;
  float t0 = max((camPos.y - kMaxH) / rayDown, 1.0);
  float t1 = min((camPos.y - minH) / rayDown, 220.0);

  float ta = t0;
  float tb = t1;
  float grazeClear = 10.0;
  float grazeT = t0;
  const int kSteps = 20;
  for (int i = 1; i <= kSteps; i++) {
    float t = mix(t0, t1, float(i) / float(kSteps));
    vec3 p = camPos + dir * t;
    float dh = duneField(p.xz, 0.055).x;
    float sh = hasLagoon > 0.5 ? max(dh, waterLevel) : dh;
    if (p.y <= sh) {
      tb = t;
      break;
    }
    float fpStep = t / max(size.y * focal, 1.0);
    float clearPx = (p.y - dh) / max(fpStep * 1.4, 0.015);
    if (clearPx < grazeClear) {
      grazeClear = clearPx;
      grazeT = t;
    }
    ta = t;
  }
  for (int b = 0; b < 4; b++) {
    float tm = 0.5 * (ta + tb);
    vec3 pm = camPos + dir * tm;
    if (pm.y <= surfaceHeight(pm.xz, waterLevel, hasLagoon)) {
      tb = tm;
    } else {
      ta = tm;
    }
  }

  float dist = 0.5 * (ta + tb);
  vec3 hit = camPos + dir * dist;
  vec2 xz = hit.xz;
  float fp = dist / max(size.y * focal, 1.0);
  vec3 V = -dir;

  vec2 gustCells = vec2(72.0, 36.0);
  float gustN = loopGNoise(
    xz * 0.024 - vec2(1.0, -1.0) * (gustCells / kLoop) * uTime,
    gustCells
  ) * 0.5 + 0.5;
  float gust = mix(0.42, 1.25, smoothstep(0.26, 0.74, gustN));

  float kBrink = 0.038 + clamp(fp * 0.34, 0.0, 0.16);
  vec3 dHit = duneField(xz, kBrink);

  // Footprint-aware shoreline AA between dry/damp sand and lagoon water.
  float edgeBand = max(0.018, fp * 0.75);
  float waterMask =
    hasLagoon * smoothstep(-edgeBand, edgeBand, waterLevel - dHit.x);

  vec3 col;
  if (waterMask <= 0.001) {
    col = shadeSand(xz, dist, fp, hasLagoon, waterLevel, V, sunDir);
  } else if (waterMask >= 0.999) {
    col = shadeLagoon(
      xz,
      max(waterLevel - dHit.x, 0.0),
      dist,
      fp,
      waterLevel,
      V,
      glitterSunDir,
      gust
    );
  } else {
    vec3 sCol = shadeSand(xz, dist, fp, hasLagoon, waterLevel, V, sunDir);
    vec3 wCol = shadeLagoon(
      xz,
      max(waterLevel - dHit.x, 0.0),
      dist,
      fp,
      waterLevel,
      V,
      glitterSunDir,
      gust
    );
    col = mix(sCol, wCol, waterMask);
  }

  // Analytical sub-pixel anti-aliasing where a foreground dune ridge grazes in
  // front of a distant surface (`dist - grazeT > 4m`).
  if (grazeClear < 1.0 && dist - grazeT > 4.0) {
    vec2 gXz = (camPos + dir * grazeT).xz;
    float gFp = grazeT / max(size.y * focal, 1.0);
    vec3 crestCol = shadeSand(gXz, grazeT, gFp, hasLagoon, waterLevel, V, sunDir);
    col = mix(col, crestCol, (1.0 - smoothstep(0.0, 1.0, grazeClear)) * 0.85);
  }

  // ── Trade-Wind Blowing Sand Streamers (`vento` / saltation spindrift) ──────
  vec2 wDir = normalize(vec2(0.92, -0.39));
  vec2 wPerp = vec2(-wDir.y, wDir.x);
  // Broad crest bands, so streamers crossing a brink stay long lines
  // instead of being clipped into short bars.
  float upBrink1 = duneField(xz - wDir * 1.4, 0.55).z;
  float upBrink2 = duneField(xz - wDir * 3.4, 0.70).z;
  float ridgeLift = smoothstep(2.4, 4.4, dHit.x) * (1.0 - dHit.y * 0.7);
  float plumeZone =
    clamp(dHit.z * 0.55 + upBrink1 * 0.78 + upBrink2 * 0.52 + ridgeLift * 0.32, 0.0, 1.25) *
    (1.0 - waterMask * 0.86);

  // Thin, sharp-edged streamers rather than a milky veil: a fine cross-wind
  // frequency and a narrow threshold keep each gust a crisp moving line.
  // Drifts are whole lattice periods per loop, so the hourly wrap is seamless.
  vec2 wCoord = vec2(dot(xz, wDir), dot(xz, wPerp));
  vec2 cellsFast = vec2(420.0, 96.0);
  vec2 cellsSwirl = vec2(588.0, 60.0);
  float sSwirl = loopGNoise(
    wCoord * vec2(0.09, 0.85) + vec2(3.7, 9.1) - vec2(1.0, 0.0) * (cellsSwirl / kLoop) * uTime,
    cellsSwirl
  ) * 0.5 + 0.5;
  // Warping the along-wind lattice by the swirl hides the noise grid, which
  // would otherwise show as rungs across neighbouring streaks.
  vec2 fastP = wCoord * vec2(0.07, 3.4) - vec2(1.0, 0.0) * (cellsFast / kLoop) * uTime;
  fastP.x += 1.2 * sSwirl + 0.35 * sin(fastP.y * 0.37);
  float sFast = loopGNoise(fastP, cellsFast) * 0.5 + 0.5;

  float streakAa = clamp(fp * 3.4 * 0.6, 0.02, 0.12);
  float ribbon = smoothstep(0.60 - streakAa, 0.66 + streakAa, sFast * 0.70 + sSwirl * 0.40);
  float textProtect =
    1.0 - 0.72 * (1.0 - smoothstep(0.0, 0.62, uv.x)) * (1.0 - smoothstep(0.06, 0.26, uv.y));
  float spindrift =
    ((0.16 + 0.84 * smoothstep(0.0, 1.1, plumeZone)) * ribbon * 0.46 * (1.0 - waterMask * 0.86) *
        (1.0 - 0.75 * smoothstep(0.2, 0.8, dHit.y)) +
      smoothstep(0.66, 0.84, sFast * sSwirl * 1.45) * 0.05 * (1.0 - waterMask)) *
    gust * textProtect * (1.0 - smoothstep(95.0, 145.0, dist));
  vec3 blownSand = mix(kSandLit, kSandBright, 0.85);
  col = mix(col, blownSand, clamp(spindrift, 0.0, 0.38));

  // Tint the scene, keeping its relief: the slides draw it in the dark green
  // of the Beira-Mar photo slides. The tint is full behind the headings and
  // clears towards the foot, where the dunes and lagoon show nearly as drawn.
  float tintAmount = mix(1.0, 0.08, smoothstep(0.24, 0.72, uv.y));
  col *= mix(vec3(1.0), uTint, tintAmount);

  // Highlight desaturation + triangular IGN dithering (web-ocean post.js).
  float lum = dot(col, vec3(0.2126, 0.7152, 0.0722));
  col = mix(col, vec3(lum), smoothstep(0.84, 2.0, lum) * 0.35);
  float dither = ign(FlutterFragCoord().xy) + ign(FlutterFragCoord().xy * 1.37 + 17.0) - 1.0;
  col = clamp(col + dither / 255.0, vec3(0.0), vec3(1.0));
  fragColor = vec4(col, 1.0);
}
