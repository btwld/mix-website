// The shore of the Fortal landing page, seen from above: sea at the top, sand
// below, and waves that run down the sand, break against the cards and drain
// back.
//
// It is painted twice. Layer 0 is the shore behind the cards. Layer 1 is drawn
// over the cards and is clear except at their edges: sand that has drifted
// over the rims, and the thin wash of a wave that runs a little way onto a
// card before it falls back.
//
// Everything is a function of uTime, so a frame can be reproduced exactly.
// Lengths are in the page's design units (a 1440-wide canvas); uOrigin and
// uScale map the screen to it. The cards are passed as rectangles, so the
// water and sand follow their real positions.
//
// Open-sea surface optics (Fresnel reflection, anisotropic Gaussian slope
// glitter with Smith masking, backlit subsurface crest scatter, cat's-paw wind
// gusts), domain-warped cellular foam micro-structure with flow-streak aging,
// quintic rotated gradient noise, and IGN dithering are adapted from
// noniv/web-ocean (MIT License, Copyright (c) 2026 Maksymilian Dendura).
#version 460 core

#include <flutter/runtime_effect.glsl>

precision highp float;

uniform vec2 uOrigin;
uniform float uScale;
uniform float uTime; // seconds, wrapped by the page so it stays precise
uniform float uRadius;
uniform float uLayer; // 0: behind the cards, 1: over them
uniform vec4 uCard0; // left, top, right, bottom
uniform vec4 uCard1;
uniform vec4 uCard2;
uniform vec4 uCard3;
uniform vec4 uCard4;
uniform vec4 uCard5;
uniform vec4 uCard6;
uniform vec4 uCard7;

out vec4 fragColor;

// ── Tuning ───────────────────────────────────────────────────────────────────
const float kPi = 3.14159265;
const vec2 kDown = vec2(0.0599, 0.9982); // the way the waves travel
const vec2 kPivot = vec2(720.0, 0.0); // the shore line turns about the page's middle
const float kShore = 290.0; // where the sea rests
// A spent wave drains back under the sea's edge, so the next one rises out of
// the sea instead of appearing on the sand.
const float kSink = 40.0;
const float kPeriod = 10.0; // seconds between waves of one train
// The page's clock wraps every hour (shoreLoop in shore.dart). Everything that
// moves repeats over it, so the wrap lands on the same picture.
const float kLoop = 3600.0;
const float kOmega0 = 6.2831853 / kLoop;
const float kLoopWaves = kLoop / kPeriod;
const float kBreath = 6.2831853 * 315.0 / kLoop; // the sea breathes 315 times an hour
const float kReachBig = 400.0; // how far the big wave runs up the sand
const float kReachSmall = 122.0;
const float kSwellFrom = 330.0; // how far out a coming wave first shows
const float kWash = 16.0; // how far a wave runs onto a card: it stays clear of the card's text
const float kDrops = 36.0; // how far onto a card a wave throws drops when it strikes
const vec2 kToLight = vec2(-0.55, -0.83); // the sun is up and to the left
const vec3 kSunDir = vec3(-0.4450, -0.6715, 0.5924); // unit vector toward the sun
const float kLift = 7.0; // how far a card's shadow falls from it
const float kThick = 2.2; // how much of a card's side shows on the edges turned from the sun
const mat2 kRot = mat2(0.8, 0.6, -0.6, 0.8); // Pythagorean octave rotation (web-ocean sky.js)
const mat2 kRotInv = mat2(0.8, -0.6, 0.6, 0.8);

// Mar, Fortal's teal scale.
const vec3 kDeep = vec3(0.014, 0.205, 0.192);
const vec3 kMid = vec3(0.000, 0.515, 0.448);
const vec3 kShallow = vec3(0.390, 0.855, 0.795);
const vec3 kSss = vec3(0.085, 0.780, 0.665); // backlit emerald subsurface crest scatter
const vec3 kSkyZenith = vec3(0.420, 0.745, 0.760);
const vec3 kSkyHorizon = vec3(0.760, 0.915, 0.895);
const vec3 kSunTint = vec3(1.000, 0.975, 0.920);
const vec3 kFoam = vec3(0.968, 0.989, 0.983);
const vec3 kSandDry = vec3(0.925, 0.868, 0.765);
const vec3 kSandWet = vec3(0.770, 0.722, 0.632);
const vec3 kSky = vec3(0.700, 0.870, 0.850); // what wet sand mirrors
const vec3 kCardSide = vec3(0.790, 0.825, 0.815); // a card's side, in shade

// ── Noise ────────────────────────────────────────────────────────────────────
// Kept identical to shore.dart's _hash and _noise so waveShape and cardAround
// stay frame-for-frame in step with CPU waveNudge.
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

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

// Quintic C2 2D gradient noise (adapted from web-ocean common.js gnoise without
// bitwise uint ops, so SkSL and Impeller both compile it cleanly).
float gnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  vec2 g00 = hash2(i) * 2.0 - 1.0;
  vec2 g10 = hash2(i + vec2(1.0, 0.0)) * 2.0 - 1.0;
  vec2 g01 = hash2(i + vec2(0.0, 1.0)) * 2.0 - 1.0;
  vec2 g11 = hash2(i + vec2(1.0, 1.0)) * 2.0 - 1.0;
  float a = dot(g00, f);
  float b = dot(g10, f - vec2(1.0, 0.0));
  float c = dot(g01, f - vec2(0.0, 1.0));
  float d = dot(g11, f - vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

// Gradient noise that drifts with time and repeats cleanly over kLoop.
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

// Noise that drifts with time and still repeats every hour.
float loopNoise(vec2 p, vec2 cells) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  vec2 wraps = step(1.0, cells);
  vec2 period = max(cells, 1.0);
  vec2 a = i - wraps * period * floor((i + 0.5) / period);
  vec2 b = i + 1.0;
  b -= wraps * period * floor((b + 0.5) / period);
  return mix(
    mix(hash(a), hash(vec2(b.x, a.y)), u.x),
    mix(hash(vec2(a.x, b.y)), hash(b), u.x),
    u.y
  );
}

// Rotated gradient FBM (web-ocean sky.js): eliminates X/Y lattice streaks.
float gfbm(vec2 p) {
  float sum = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 4; i++) {
    sum += amp * gnoise(p);
    p = kRot * p * 2.03 + vec2(13.1, 7.7);
    amp *= 0.5;
  }
  return sum;
}

// "Swiss-cheese" cellular foam (adapted from web-ocean sim.js bubbles()):
// 0 inside round bubbles with per-cell random radius, 1 in the foam web.
float foamBubbles(vec2 p, float salt) {
  vec2 ip = floor(p);
  vec2 fp = fract(p);
  float v = 4.0;
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 o = vec2(float(i), float(j));
      vec2 cell = ip + o;
      vec2 hh = hash2(cell + salt);
      vec2 r = o + hh * 0.86 + 0.07 - fp;
      float rad = mix(0.16, 0.48, hash(cell * 1.31 + salt + 7.3));
      v = min(v, length(r) / rad);
    }
  }
  return smoothstep(0.78, 1.24, v);
}

// ── Water optics (adapted from web-ocean ocean.js & post.js) ─────────────────
float fresnelWater(float c) {
  // Schlick approximation with F0 = 0.02 for water (n = 1.333).
  float x = 1.0 - clamp(c, 0.0, 1.0);
  float x2 = x * x;
  return 0.02 + 0.98 * x2 * x2 * x;
}

float lambdaSmith(vec3 w, vec3 cov) {
  float xy2 = max(dot(w.xy, w.xy), 1e-8);
  float il = inversesqrt(xy2);
  vec2 az = w.xy * il;
  float sig2 = az.x * az.x * cov.x + az.y * az.y * cov.y + 2.0 * az.x * az.y * cov.z;
  float cotT = w.z * il;
  float a = max(cotT, 1e-3) / sqrt(2.0 * max(sig2, 1e-7));
  if (a >= 1.6) {
    return 0.0;
  }
  return (1.0 - 1.259 * a + 0.396 * a * a) / (3.535 * a + 2.181 * a * a);
}

float ign(vec2 p) {
  return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715))));
}

// ── Cards ────────────────────────────────────────────────────────────────────
float cardDistance(vec2 p, vec4 card) {
  vec2 centre = 0.5 * (card.xy + card.zw);
  vec2 q = abs(p - centre) - 0.5 * (card.zw - card.xy) + uRadius;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - uRadius;
}

// Distance to the nearest card's edge: negative inside a card.
float cardsDistance(vec2 p) {
  float d = cardDistance(p, uCard0);
  d = min(d, cardDistance(p, uCard1));
  d = min(d, cardDistance(p, uCard2));
  d = min(d, cardDistance(p, uCard3));
  d = min(d, cardDistance(p, uCard4));
  d = min(d, cardDistance(p, uCard5));
  d = min(d, cardDistance(p, uCard6));
  d = min(d, cardDistance(p, uCard7));
  return d;
}

// What one card does around a point. It adds its way out and how far it holds
// a wave back behind it.
void cardAround(vec2 p, vec4 card, float wobble, inout vec3 out3, inout float held) {
  vec2 size = 0.5 * (card.zw - card.xy);
  vec2 d = p - 0.5 * (card.xy + card.zw);
  vec2 q = abs(d) - size + uRadius;
  vec2 m = max(q, 0.0);
  float corner = length(m);
  float dist = corner + min(max(q.x, q.y), 0.0) - uRadius;
  float side = step(q.y, q.x);
  vec2 way = mix(vec2(side, 1.0 - side), m / max(corner, 1e-4), step(1e-4, corner)) * sign(d);
  float outside = max(dist, 0.0);
  float weight = 1.0 / (16.0 + outside * outside);
  out3 += vec3(way * weight, weight);

  float off = d.x / size.x;
  float below = p.y - card.w;
  float len = 1.2 * size.x + 40.0;
  float shelter = 1.0 - off * off - max(below, 0.0) / len + wobble;
  held = max(held, 0.4 * len * smoothstep(0.0, 1.0, shelter) * smoothstep(-12.0, 0.0, below));
}

vec2 cardInset(vec2 p, vec4 card) {
  float on = step(card.x, p.x) * step(p.x, card.z) * step(card.y, p.y) * step(p.y, card.w);
  return on * vec2(p.y - card.y, min(p.x - card.x, card.z - p.x));
}

vec2 cardsInset(vec2 p) {
  return cardInset(p, uCard0) + cardInset(p, uCard1) + cardInset(p, uCard2) +
    cardInset(p, uCard3) + cardInset(p, uCard4) + cardInset(p, uCard5) +
    cardInset(p, uCard6) + cardInset(p, uCard7);
}

// ── Waves ────────────────────────────────────────────────────────────────────
float runUp(float phase) {
  float rush = 1.0 - pow(1.0 - clamp(phase / 0.26, 0.0, 1.0), 3.0);
  float drain = smoothstep(0.32, 0.80, phase);
  return rush * (1.0 - drain * drain * (3.0 - 2.0 * drain));
}

struct Wave {
  float front; // how far down the sand the water reaches here
  float peak; // the furthest it has reached this cycle
  float phase;
  float seed;
  float ebb; // 0 as it runs in, 1 once it drains
  float extent; // how far this wave runs in all, from where it starts under the sea
};

// The outline one wave has along the shore (kept identical to shore.dart).
float waveShape(float across, float seed) {
  return (noise(vec2(across * 0.0042, seed)) - 0.5) * 150.0 +
    (noise(vec2(across * 0.0150, seed + 3.7)) - 0.5) * 46.0;
}

Wave waveAt(float across, float offset, float reach, float held) {
  float cycle = uTime / kPeriod + offset;
  float phase = fract(cycle);
  float n = floor(cycle);
  n -= kLoopWaves * floor((n + 0.5) / kLoopWaves);
  float seed = n * 7.31 + offset * 41.7;
  float extent = max(reach + waveShape(across, seed), 30.0) + kSink;
  Wave w;
  w.front = kShore - kSink + extent * runUp(phase) - held;
  w.peak = kShore - kSink + extent * runUp(min(phase, 0.30)) - held;
  w.phase = phase;
  w.seed = seed;
  w.ebb = smoothstep(0.32, 0.50, phase);
  w.extent = extent;
  return w;
}

float waveWater(Wave w, float along) {
  return smoothstep(0.0, mix(2.0, 26.0, w.ebb), w.front - along);
}

float waveSheet(Wave w, float along) {
  return smoothstep(0.0, 150.0, w.front - along) * mix(0.34, 0.15, w.ebb);
}

float waveRise(Wave w, float rest) {
  return 0.35 * (w.front - rest) * (1.0 - 0.5 * w.ebb);
}

float waveShown(Wave w, Wave other, float rest) {
  return (1.0 - smoothstep(8.0, 60.0, other.front - w.front)) *
    smoothstep(-12.0, 20.0, w.front - rest) * smoothstep(0.0, 0.035, w.phase);
}

float waveShade(Wave w, float along, float covered) {
  return (1.0 - w.ebb) * smoothstep(9.0, 0.0, along - w.front) * (1.0 - covered);
}

// Returns vec3(foamMask, submergedBubbleCover, fineBubbleDetail).
vec3 waveFoam(
  Wave w,
  vec2 p,
  float along,
  float rest,
  float water,
  float shown,
  float edge,
  float upstream
) {
  float behind = w.front - along;
  float stranded = 0.0;
  // Stranded bubble line and burst clusters left on wet sand where water drained.
  if (w.phase > 0.30 && w.phase < 0.90 && water < 1.0) {
    float left = w.peak - along;
    float line = smoothstep(9.5, 0.0, abs(left - 3.0));
    float fade = smoothstep(0.30, 0.36, w.phase) * (1.0 - smoothstep(0.50, 0.90, w.phase));
    float cluster = smoothstep(0.04, 0.28, gfbm(p * 0.065 + w.seed));
    float web = foamBubbles(p * 0.12 + w.seed, w.seed);
    float left2 = smoothstep(0.32, 0.44, w.phase) * (1.0 - smoothstep(0.52, 0.86, w.phase));
    float trail =
      web * smoothstep(0.14, 0.36, gfbm(p * 0.045 + w.seed * 1.3)) *
      exp(min(behind, 0.0) / 105.0) * smoothstep(-6.0, 6.0, left) * left2;
    stranded = max(line * fade * cluster * (0.45 + 0.55 * web) * 0.38, trail * 0.46) * (1.0 - water);
  }
  if (behind < 0.0 || w.phase > 0.80 || shown <= 0.0) {
    return vec3(stranded, 0.0, 0.5);
  }
  float rushing = 1.0 - smoothstep(0.22, 0.60, w.phase);
  float alive = 1.0 - smoothstep(0.50, 0.80, w.phase);
  float softEdge = smoothstep(0.0, mix(4.0, 42.0, w.ebb), behind);
  // Surf aeration builds as the wave shoals over the sandbar near `rest`,
  // keeping deep offshore water behind the hero header & CTA buttons rich dark teal.
  float surfZone = smoothstep(rest - 68.0, rest - 4.0, along);

  float lip = 0.0;
  if (behind < 68.0) {
    float width = mix(14.0, 46.0, rushing) * (0.58 + 0.84 * (gnoise(vec2(p.x * 0.018, w.seed)) * 0.5 + 0.5));
    lip =
      smoothstep(0.0, 2.5, behind) * (1.0 - smoothstep(width * 0.35, width, behind)) *
      (1.0 - w.ebb);
  }
  float sheet = exp(-behind / 148.0) * mix(0.26, 0.58, rushing) * alive * softEdge * surfZone;
  float splash =
    smoothstep(30.0, 2.0, edge) * mix(0.22, 0.95, clamp(upstream, 0.0, 1.0)) *
    exp(-behind / 210.0) * mix(0.50, 1.0, rushing) * alive * softEdge;
  float density = max(lip * mix(0.45, 1.0, rushing) * mix(0.45, 1.0, surfZone), sheet) + splash;
  if (density < 0.035) {
    return vec3(stranded, 0.0, 0.5);
  }

  // Foam travels in with the rush and lags as the sheet drains.
  vec2 flow = p - kDown * (mix(w.front, w.peak, 0.52 * w.ebb) - kShore) * 0.85;
  // Two-regime aging (web-ocean ocean.js): fresh breaking crests stay dense,
  // while draining foam breaks into down-slope streaks.
  vec2 flowAligned = vec2(dot(flow, vec2(kDown.y, -kDown.x)), dot(flow, kDown));
  float streak = gfbm(flowAligned * vec2(0.070, 0.017) + w.seed * 1.3) * 0.5 + 0.5;
  float freshK = clamp((lip * 1.35 + splash * 0.95) * (1.0 - 0.72 * w.ebb), 0.0, 1.0);
  float cover = clamp(density * mix(smoothstep(0.24, 0.76, streak) * 1.42, 1.0, freshK), 0.0, 1.35);

  // Domain-warped ragged foam sheets + cellular Worley bubbles (web-ocean sim.js).
  vec2 warp = vec2(
    gnoise(flow * 0.026 + w.seed),
    gnoise(flow * 0.026 + w.seed + vec2(5.2, 1.3))
  );
  float holes = smoothstep(-0.22, 0.12, gfbm(flow * 0.032 + warp * 1.25 + w.seed));
  float bubBig = foamBubbles(flow * 0.078 + warp * 0.70, w.seed);
  float bubFine = 0.5 + 0.5 * gnoise(flow * 0.34 + warp * 0.5 + w.seed * 2.1);
  float lace = clamp(holes * (0.48 + 0.52 * bubBig) * 0.82 + bubBig * 0.18, 0.0, 1.0);

  // Density-dependent soft margin + analytical pixel footprint AA (web-ocean ocean.js).
  float fw = 0.028 / max(uScale, 0.5) + 0.022;
  float soft = 0.035 + 0.15 * (1.0 - clamp(cover, 0.0, 1.0));
  float fm = smoothstep(1.0 - cover - fw - soft, 1.0 - cover + fw + soft, lace);
  float mask =
    clamp(fm * smoothstep(0.0, 0.44, cover), 0.0, 1.0) *
    (0.70 + 0.30 * smoothstep(0.28, 0.88, cover));
  // Freshly broken lip core stays crisp and nearly opaque.
  mask = max(mask, smoothstep(0.32, 0.86, freshK * density) * smoothstep(0.22, 0.58, lace + 0.26) * 0.96);
  float carried = mask * shown;
  float sub = clamp(cover * 0.68, 0.0, 1.0) * shown * surfZone;
  return vec3(max(stranded, carried), sub, mix(bubBig, bubFine, 0.45));
}

float waveWet(Wave w, float along, float uneven) {
  float reached = smoothstep(-34.0, 12.0, w.peak - along + uneven);
  float fresh = 1.0 - 0.72 * smoothstep(0.0, 230.0, along - w.front);
  return reached * fresh * smoothstep(0.0, 0.03, w.phase) * (1.0 - smoothstep(0.62, 0.99, w.phase));
}

vec2 waveStay(Wave w, float along, float edge) {
  float struck = smoothstep(0.0, 24.0, w.peak - along - edge) * smoothstep(0.02, 0.10, w.phase);
  return struck * vec2(
    1.0 - smoothstep(0.72, 0.97, w.phase),
    1.0 - smoothstep(0.50, 0.86, w.phase)
  );
}

float wavePush(Wave w, float along) {
  return smoothstep(0.0, 110.0, w.front - along) * (1.0 - smoothstep(0.30, 0.58, w.phase));
}

float strikePower(Wave w, float along, float edge) {
  float needed = clamp((along + edge - kShore + kSink) / w.extent, 0.0, 1.0);
  return pow(1.0 - needed, 0.67);
}

float waveStrike(Wave w, float along, float edge) {
  float past = w.front - along - edge;
  return smoothstep(0.0, 10.0, past) * (1.0 - smoothstep(50.0, 230.0, past)) *
    strikePower(w, along, edge) * (1.0 - smoothstep(0.24, 0.40, w.phase));
}

float waveDrops(Wave w, vec2 p, float along, float into) {
  float power = strikePower(w, along, -into);
  vec2 g = p / 6.5;
  vec2 cell = floor(g) + w.seed;
  float thrown = step(1.0 - 0.75 * power * exp(-into / (5.0 + 9.0 * power)), hash(cell));
  vec2 at = 0.28 + 0.44 * vec2(hash(cell + 1.3), hash(cell + 7.9));
  float size = 0.10 + 0.17 * hash(cell + 3.3);
  float bead = smoothstep(size, size * 0.55, length(fract(g) - at));
  float past = w.peak - along + into;
  float landed = smoothstep(0.0, 8.0, past - into * 1.5 - 26.0 * hash(cell + 5.1));
  return bead * thrown * landed * (1.0 - smoothstep(0.30, 0.55, w.phase));
}

// Incoming swell out at sea: returns vec3(height, dHeight/dAlong, crestFactor)
// so it drives real surface normals, Fresnel reflection, and backlit SSS glow.
vec3 swellField(Wave w, float across, float along) {
  float coming = clamp((w.phase - 0.64) / 0.36, 0.0, 1.0);
  if (coming <= 0.0) {
    return vec3(0.0);
  }
  float at =
    along - kShore + kSwellFrom * (1.0 - coming * coming) -
    waveShape(across, w.seed + 7.31) * 0.22 * (1.0 - coming);
  float show = smoothstep(0.0, 0.16, coming) * (1.0 - smoothstep(0.91, 1.0, coming));
  float crest = exp(-at * at / 560.0);
  float trough = exp(-(at + 36.0) * (at + 36.0) / 1180.0);
  float h = (crest - 0.72 * trough) * show;
  float dh = (-2.0 * at / 560.0 * crest + 1.44 * (at + 36.0) / 1180.0 * trough) * show;
  return vec3(h, dh, crest * show);
}

// Accumulate one loop-quantized directional Gerstner/chop component (sim.js),
// gently phase-warped so offshore swells curve organically rather than forming
// straight planar stripes.
void addChopWave(
  vec2 p,
  vec2 dir,
  float wl,
  float amp,
  float chop,
  float speedScale,
  float warpPhase,
  inout float h,
  inout vec2 sl,
  inout vec3 jac
) {
  float k = 6.2831853 / wl;
  // Dispersion quantized to kOmega0 = 2*pi/kLoop so t = 3600s wraps seamlessly.
  float omega = sqrt(9.81 * k) * speedScale;
  float w = floor(omega / kOmega0 + 0.5) * kOmega0;
  float ph = dot(p, dir) * k + warpPhase - w * uTime;
  float c = cos(ph);
  float s = sin(ph);
  h += amp * c;
  sl += -amp * k * s * dir;
  float jk = -chop * amp * k * c;
  jac += vec3(jk * dir.x * dir.x, jk * dir.y * dir.y, jk * dir.x * dir.y);
}

void main() {
  vec2 p = (FlutterFragCoord().xy - uOrigin) / uScale;
  float edge = cardsDistance(p);

  if (uLayer > 0.5 && (edge > 0.5 || edge < -(kDrops + 2.0))) {
    fragColor = vec4(0.0);
    return;
  }
  if (uLayer < 0.5 && edge < -10.0) {
    fragColor = vec4(kSandDry, 1.0);
    return;
  }

  vec2 acrossDir = vec2(kDown.y, -kDown.x);
  float along = dot(p - kPivot, kDown);
  float across = dot(p - kPivot, acrossDir);

  float wobble = (noise(p * 0.012 + 5.3) - 0.5) * 0.2;
  vec3 out3 = vec3(0.0);
  float held = 0.0;
  cardAround(p, uCard0, wobble, out3, held);
  cardAround(p, uCard1, wobble, out3, held);
  cardAround(p, uCard2, wobble, out3, held);
  cardAround(p, uCard3, wobble, out3, held);
  cardAround(p, uCard4, wobble, out3, held);
  cardAround(p, uCard5, wobble, out3, held);
  cardAround(p, uCard6, wobble, out3, held);
  cardAround(p, uCard7, wobble, out3, held);
  vec2 out2 = out3.xy / out3.z;
  float upstream = -dot(out2, kDown);

  // The resting sea breathes a little.
  float rest =
    kShore + 9.0 * sin(across * 0.011 + uTime * kBreath) +
    (loopNoise(vec2(across * 0.006, uTime * 0.12), vec2(0.0, 0.12 * kLoop)) - 0.5) * 34.0;

  Wave big = waveAt(across, 0.0, kReachBig, held);
  Wave small = waveAt(across, 0.52, kReachSmall, held);

  float push = max(wavePush(big, along), wavePush(small, along));
  if (uLayer > 0.5 && edge < -9.5 && push <= 0.0) {
    fragColor = vec4(0.0);
    return;
  }

  float bigWater = waveWater(big, along);
  float smallWater = waveWater(small, along);
  float seaWater = smoothstep(0.0, 2.0, rest - along);
  float water = max(seaWater, max(bigWater, smallWater));

  float rise = max(0.0, max(waveRise(big, rest), waveRise(small, rest)));
  float sea = clamp((rest + rise - along) / (240.0 + rise), 0.0, 1.0);
  float sheet = max(waveSheet(big, along) * bigWater, waveSheet(small, along) * smallWater);
  float deep = sea * water;
  float blend = 0.15 * smoothstep(0.0, 0.1, min(sheet, deep)) + 1e-4;
  float depth = mix(sheet, deep, smoothstep(-blend, blend, deep - sheet));
  float bigShown = waveShown(big, small, rest);
  float smallShown = waveShown(small, big, rest);

  // Base water body scatter colour by depth.
  vec3 tint = mix(kShallow, kMid, smoothstep(0.04, 0.52, depth));
  tint = mix(tint, kDeep, smoothstep(0.42, 1.0, depth));
  float cover = clamp((1.0 - exp(-depth * 4.2)) * 0.97 + 0.08 * water, 0.0, 1.0);
  vec3 col = tint;

  if (cover < 1.0) {
    // Sand, refracted through shallow moving water.
    vec2 s = p;
    if (water > 0.0) {
      vec2 bend = vec2(
        loopGNoise(p * 0.032 + vec2(uTime * 0.34, 0.0), vec2(0.34 * kLoop, 0.0)),
        loopGNoise(p * 0.032 + vec2(4.7, uTime * 0.30), vec2(0.0, 0.30 * kLoop))
      );
      s += bend * 14.0 * water * (1.0 - 0.45 * sea);
    }
    float mottle = gfbm(s * 0.0065);
    float grain = noise(s * 2.3) - 0.5;
    float ripple = sin(dot(s, kDown) * 0.30 + 5.5 * gnoise(s * 0.011)) * 0.5 + 0.5;
    vec3 sand = kSandDry * (0.986 + 0.042 * mottle + 0.020 * grain + 0.006 * ripple);

    float wet = water;
    if (water < 1.0) {
      float uneven = gnoise(p * 0.028 + 8.4) * 44.0;
      float seaWet = smoothstep(46.0, -4.0, along - rest);
      wet = max(
        max(waveWet(big, along, uneven), waveWet(small, along, uneven)),
        max(seaWet, water)
      );
    }
    float pool = 0.0;
    if (uLayer < 0.5 && edge < 40.0) {
      vec2 stay = max(waveStay(big, along, edge), waveStay(small, along, edge));
      wet = max(wet, stay.x * exp(-max(edge, 0.0) / 9.0));
      float width = 5.0 + 8.0 * (gnoise(p * 0.050 + 2.0) * 0.5 + 0.5);
      pool = stay.y * clamp(upstream * 1.4, 0.0, 1.0) * smoothstep(width, width * 0.35, edge);
    }
    vec3 ground = sand;
    if (wet > 0.0) {
      vec3 wetSand = kSandWet * (0.985 + 0.06 * mottle + 0.018 * grain);
      float runoff = gnoise(vec2(across * 0.058, along * 0.009 + 2.0)) * 0.5 + 0.5;
      wetSand = mix(wetSand, kSky, wet * wet * (0.20 + 0.22 * runoff));
      ground = mix(sand, wetSand, wet * mix(0.82, 0.40, water));
    }

    if (uLayer < 0.5 && edge < 150.0) {
      float drift = gnoise(p * 0.030 + 11.0) * 0.5 + 0.5;
      float bank = exp(-max(edge, 0.0) / (8.0 + 6.0 * drift));
      ground *= 1.0 + 0.085 * dot(out2, kToLight) * bank * (1.0 - 0.5 * water);
      ground *= 1.0 - 0.13 * exp(-max(edge, 0.0) / 5.0);
    }

    ground = mix(ground, mix(kShallow, kSky, 0.55) * 0.94, pool * 0.62);

    float shade = max(
      waveShade(big, along, bigWater) * bigShown,
      waveShade(small, along, smallWater) * smallShown
    );
    ground *= 1.0 - 0.13 * shade;

    col = mix(ground, tint, cover);
  }

  // Shallow-water caustics: focused sunlight on the sand floor, fading out as
  // the sea deepens so deep water reads as surface waves rather than a pool.
  float lit = 0.0;
  if (water > 0.0 && depth < 0.82) {
    float shallowVis = (1.0 - smoothstep(0.28, 0.80, depth)) * smoothstep(0.0, 0.07, depth);
    if (shallowVis > 0.002) {
      vec2 c1 = kRot * (p * 0.024) + vec2(uTime * 0.11, uTime * 0.07);
      vec2 c2 = kRotInv * (p * 0.033) - vec2(uTime * 0.08, -uTime * 0.05);
      float warp = loopGNoise(p * 0.013 + uTime * 0.05, vec2(0.05 * kLoop)) * 1.8;
      float light = min(
        1.0 - abs(loopGNoise(c1 + warp, vec2(0.11, 0.07) * kLoop) * 2.1),
        1.0 - abs(loopGNoise(c2 - warp, vec2(0.08, 0.05) * kLoop) * 2.1)
      );
      light = pow(clamp(light, 0.0, 1.0), 4.5);
      lit = light * water * shallowVis * 0.115;
      col += lit * vec3(0.82, 1.0, 0.95);
    }
  }

  // Open-sea & swash surface optics (web-ocean ocean.js): directional wave
  // slopes, cat's-paw wind gusts, Schlick Fresnel sky reflection, anisotropic
  // Gaussian sun glitter with Smith masking, and backlit subsurface crests.
  float openWhitecap = 0.0;
  if (water > 0.0 && uLayer < 0.5) {
    float seaFade = smoothstep(0.02, 0.38, depth);
    // Cat's-paw wind gusts modulate short ripples across the surface.
    float gustN = loopGNoise(
      p * 0.0042 + vec2(-0.035, 0.022) * uTime,
      vec2(0.035, 0.022) * kLoop
    ) * 0.5 + 0.5;
    float gust = mix(0.45, 1.22, smoothstep(0.28, 0.74, gustN));

    float h = 0.0;
    vec2 sl = vec2(0.0);
    vec3 jac = vec3(0.0);
    if (seaFade > 0.01) {
      // Gentle spatial phase warp curves offshore swells like a real coastline.
      float wp0 = gnoise(p * 0.0052 + vec2(3.1, 7.4)) * 1.15;
      float wp1 = gnoise(p * 0.0085 + vec2(9.2, 1.8)) * 0.95;
      // Trade-wind swell and cross-chop (Fortaleza ESE breeze + shoreward swell).
      addChopWave(p, normalize(vec2(0.16, 0.987)), 148.0, 1.55 * seaFade, 0.75, 4.4, wp0, h, sl, jac);
      addChopWave(p, normalize(vec2(-0.22, 0.975)), 94.0, 0.95 * seaFade, 0.72, 4.4, -wp0 * 0.85, h, sl, jac);
      addChopWave(p, normalize(vec2(-0.52, 0.854)), 52.0, 0.52 * seaFade * gust, 0.68, 4.6, wp1, h, sl, jac);
      addChopWave(p, normalize(vec2(0.38, 0.925)), 31.0, 0.28 * seaFade * gust, 0.60, 4.8, -wp1 * 1.1, h, sl, jac);
      addChopWave(p, normalize(vec2(-0.68, 0.733)), 18.0, 0.15 * seaFade * gust, 0.55, 5.0, wp0 + wp1, h, sl, jac);

      // Two rotated capillary wavelet octaves break up planar reflections into
      // crisp 3D ocean facets.
      vec2 capUv = kRot * (p * 0.072) + vec2(-0.20, 0.15) * uTime;
      vec2 capSl = vec2(
        loopGNoise(capUv, vec2(0.20, 0.15) * kLoop),
        loopGNoise(capUv + vec2(7.3, 2.9), vec2(0.20, 0.15) * kLoop)
      );
      vec2 capUv2 = kRotInv * (p * 0.155) + vec2(0.28, 0.22) * uTime;
      vec2 capSl2 = vec2(
        loopGNoise(capUv2, vec2(0.28, 0.22) * kLoop),
        loopGNoise(capUv2 + vec2(4.1, 8.6), vec2(0.28, 0.22) * kLoop)
      );
      sl += (capSl * 0.058 + capSl2 * 0.036) * (gust * seaFade);
    }

    // Incoming swell train adds long-wave elevation, slope, and backlit crest.
    vec3 sw = vec3(0.0);
    if (sea > 0.0) {
      sw = swellField(big, across, along) + 0.62 * swellField(small, across, along);
      h += sw.x * 2.4;
      sl += -kDown * (sw.y * 5.8);
    }
    // Arriving beach-wave front steepens slightly just behind its lip.
    float rushSlope =
      (1.0 - big.ebb) * exp(-max(big.front - along, 0.0) / 38.0) * bigWater * 0.10 +
      (1.0 - small.ebb) * exp(-max(small.front - along, 0.0) / 30.0) * smallWater * 0.07;
    sl += -kDown * rushSlope;

    float jx = max(1.0 + jac.x, 0.22);
    float jy = max(1.0 + jac.y, 0.22);
    vec2 slope = vec2(sl.x / jx, sl.y / jy);
    vec3 nrm = normalize(vec3(-slope.x, -slope.y, 1.0));
    float J = (1.0 + jac.x) * (1.0 + jac.y) - jac.z * jac.z;

    // High-oblique view vector: steeper over the beach, more grazing out at sea.
    float vz = mix(0.42, 0.90, clamp(p.y / 520.0, 0.0, 1.0));
    float vy = sqrt(max(1.0 - vz * vz, 0.04));
    vec3 V = normalize(vec3((720.0 - p.x) * 0.00018, vy, vz));

    // LEAN slope covariance: tight in resolved near-field so individual facets
    // sparkle, widened by pixel footprint anti-aliasing.
    float px = 1.0 / max(uScale, 0.5);
    float unres = (0.0055 + 0.0095 * gust * gust) * mix(0.45, 1.0, seaFade) + 0.0018 * px * px;
    vec3 cov = vec3(unres * 1.15, unres * 0.90, -0.0012 * gust);

    // Keep glints and bright sky reflection calm directly behind the Fortal
    // wordmark and top-right headline + soft "Components" button.
    float leftCalm = 1.0 - 0.72 * (1.0 - smoothstep(460.0, 650.0, p.x)) * (1.0 - smoothstep(170.0, 245.0, p.y));
    float rightCalm = 1.0 - 0.76 * smoothstep(880.0, 990.0, p.x) * (1.0 - smoothstep(195.0, 268.0, p.y));

    // Grazing-angle facet-tilt sky reflection + Schlick water Fresnel.
    float sig = sqrt(cov.x);
    vec3 vh = normalize(vec3(V.x, V.y, 0.0) + vec3(1e-5, 0.0, 0.0));
    vec3 nV = normalize(nrm + vh * (0.24 * sig * (1.0 - vz)));
    vec3 R = reflect(-V, nV);
    float skyMix = clamp(R.z * 0.85 + 0.15, 0.0, 1.0);
    vec3 skyRefl = mix(kSkyHorizon, kSkyZenith, smoothstep(0.0, 0.75, skyMix));
    // Warm sunlight sheen toward the upper-left sun azimuth.
    float sunAz = clamp(dot(normalize(R.xy + vec2(1e-5)), kToLight) * 0.5 + 0.5, 0.0, 1.0);
    skyRefl = mix(skyRefl, kSunTint, pow(sunAz, 4.0) * 0.18 * (1.0 - skyMix * 0.5));
    vec3 nF = normalize(mix(nrm, vec3(0.0, 0.0, 1.0), 0.42));
    float Fr =
      fresnelWater(max(dot(nF, V), 0.0)) *
      mix(0.30, 1.0, seaFade) *
      mix(0.68, 1.0, leftCalm * rightCalm);

    // Backlit subsurface glow through thin swell & wave crests (ocean.js:206-210).
    float crest = clamp(h * 0.24 + sw.z * 0.85, 0.0, 1.25);
    float thin = pow(clamp(0.54 - 0.46 * dot(kSunDir, nrm), 0.0, 1.0), 2.4);
    vec3 sss =
      kSss * (crest * crest * thin * 0.25 + sw.z * 0.10) *
      smoothstep(0.0, 0.22, sea) *
      mix(0.55, 1.0, rightCalm);

    // Anisotropic Gaussian slope sun glitter with Smith masking (ocean.js:168-178).
    vec3 Hv = normalize(V + kSunDir);
    vec2 hs = -Hv.xy / max(Hv.z, 1e-3);
    vec2 dsl = hs - slope;
    float det = max(cov.x * cov.y - cov.z * cov.z, 1e-9);
    float ex = (dsl.x * dsl.x * cov.y + dsl.y * dsl.y * cov.x - 2.0 * dsl.x * dsl.y * cov.z) / det;
    float pdf = exp(-0.5 * ex) / (2.0 * kPi * sqrt(det));
    float hz2 = Hv.z * Hv.z;
    float Dm = pdf / max(hz2 * hz2, 1e-4);
    float G = 1.0 / (1.0 + lambdaSmith(V, cov) + lambdaSmith(kSunDir, cov));
    float Fh = fresnelWater(dot(V, Hv));
    float specScale = seaFade * leftCalm * rightCalm;
    vec3 spec = kSunTint * (Fh * Dm * G / (4.0 * max(V.z, 0.12))) * 2.15 * specScale;

    col = (col + sss) * (1.0 - Fr) + skyRefl * Fr + min(spec, vec3(0.88));

    // Subtle open-sea whitecap wisps where total surface Jacobian folds on gusts.
    float fold = clamp((0.68 - J) * 2.2, 0.0, 1.0) * smoothstep(0.45, 0.85, sea) * gust;
    if (fold > 0.02) {
      float wcBub = foamBubbles(p * 0.09 + vec2(0.04, 0.08) * uTime, 19.3);
      openWhitecap = smoothstep(0.45, 0.88, wcBub * fold * 1.6) * 0.55 * leftCalm * rightCalm;
    }
  }

  // Foam: both breaking waves, submerged aerated glow, and the resting shoreline.
  vec3 fBig = waveFoam(big, p, along, rest, water, bigShown, edge, upstream);
  vec3 fSmall = waveFoam(small, p, along, rest, water, smallShown, edge, upstream);
  float foam = max(fBig.x, fSmall.x);
  float subBubble = max(fBig.y, fSmall.y);
  float bubDetail = mix(fSmall.z, fBig.z, step(fSmall.x, fBig.x));

  // Aerated turquoise water glow right beneath breaking surf (web-ocean ocean.js:240).
  if (subBubble > 0.0 && water > 0.0) {
    col += vec3(0.036, 0.135, 0.122) * subBubble * water * (1.0 - 0.55 * foam);
  }

  float restBehind = rest - along;
  if (restBehind > 0.0 && restBehind < 16.0) {
    float broken = loopGNoise(p * 0.065 + vec2(uTime * 0.25, 0.0), vec2(0.25 * kLoop, 0.0)) * 0.5 + 0.5;
    float restLine =
      smoothstep(0.0, 2.0, restBehind) * (1.0 - smoothstep(4.0, 16.0, restBehind)) *
      smoothstep(0.32, 0.62, broken);
    float passed = smoothstep(rest - 4.0, rest + 12.0, max(big.front, small.front));
    foam = max(foam, restLine * 0.78 * (1.0 - passed));
  }

  float strike = max(waveStrike(big, along, edge), waveStrike(small, along, edge));
  if (strike > 0.0 && edge < 24.0) {
    float facing = clamp(upstream, 0.0, 1.0);
    float torn = 0.55 + 0.45 * (gnoise(p * 0.18 + big.seed) * 0.5 + 0.5);
    foam = max(foam, strike * facing * water * smoothstep(24.0 * torn, 3.0, edge));
  }
  foam = clamp(max(foam, openWhitecap), 0.0, 1.0);

  // Bubbly brightness micro-structure inside the foam (web-ocean ocean.js:244).
  vec3 foamLit = kFoam * (0.91 + 0.10 * bubDetail);

  if (uLayer < 0.5) {
    col = mix(col, foamLit, foam * 0.95);
    if (edge < 24.0) {
      float lifted = cardsDistance(p + kToLight * kLift);
      float shadow = smoothstep(5.0, -4.0, lifted) * smoothstep(-1.0, 1.0, edge);
      col *= 1.0 - 0.21 * shadow * (1.0 - 0.35 * water);
      float away = clamp(-dot(out2, kToLight) * 1.6, 0.0, 1.0);
      float side = smoothstep(kThick + 0.7, kThick - 0.3, edge) * smoothstep(-0.5, 0.5, edge) * away;
      col = mix(col, kCardSide, side * 0.92);
    }
    // Darker far out, so the title reads clearly.
    col *= mix(0.78, 1.0, smoothstep(-40.0, 264.0, p.y));
    // Highlight desaturation + triangular IGN dithering (web-ocean post.js).
    float lum = dot(col, vec3(0.2126, 0.7152, 0.0722));
    col = mix(col, vec3(lum), smoothstep(0.78, 1.80, lum) * 0.45);
    float dither = ign(FlutterFragCoord().xy) + ign(FlutterFragCoord().xy * 1.37 + 17.0) - 1.0;
    col = clamp(col + dither / 255.0, vec3(0.0), vec3(1.0));
    fragColor = vec4(col, 1.0);
    return;
  }

  // ── Over the cards ─────────────────────────────────────────────────────────
  float inside = -edge;
  float card = smoothstep(-0.5, 0.5, inside);

  float reach = 0.9 + 2.2 * smoothstep(0.10, 0.58, gnoise(p * 0.016 + 3.1) * 0.5 + 0.5);
  float spill = smoothstep(reach, reach - 1.4, inside);
  float spillShade = smoothstep(reach + 4.0, reach, inside) * 0.08;
  vec3 spilled = mix(col, foamLit, foam * 0.95);

  float lap =
    kWash * push *
    (0.62 + 0.48 * (loopGNoise(p * 0.012 + vec2(big.seed, uTime * 0.25), vec2(0.0, 0.25 * kLoop)) * 0.5 + 0.5));
  vec2 from = cardsInset(p);
  vec2 inset = from / max(lap * vec2(1.0, 0.34), 0.001);
  float h = clamp(0.5 + 0.5 * (inset.y - inset.x) / 0.6, 0.0, 1.0);
  float into = mix(inset.y, inset.x, h) - 0.6 * h * (1.0 - h);
  float fine = 3.0 / max(lap, 3.0);
  float washed = water * smoothstep(1.0, 1.0 - fine, into) * smoothstep(1.0, 3.0, lap);
  float lip = washed * smoothstep(1.0 - 1.8 * fine, 1.0 - 0.5 * fine, into);
  float white = clamp(lip * 0.72 + foam * 0.18 * washed, 0.0, 1.0);
  float glaze = washed * (0.46 + 0.5 * lit);

  float facing = clamp(upstream, 0.0, 1.0);
  white = max(white, strike * facing * smoothstep(10.0, 2.0, from.x) * (0.6 + 0.4 * foam));
  float drops = max(waveDrops(big, p, along, from.x), waveDrops(small, p, along, from.x));

  vec4 layer = vec4(0.0, 0.0, 0.0, spillShade);
  layer = layer * (1.0 - glaze) + vec4(mix(kShallow, kMid, 0.22) * glaze, glaze);
  layer = layer * (1.0 - white) + vec4(foamLit * white, white);
  float bead = drops * 0.85;
  layer = layer * (1.0 - bead) + vec4(mix(foamLit, kShallow, 0.30) * bead, bead);
  layer = layer * (1.0 - spill) + vec4(spilled * spill, spill);
  fragColor = layer * card;
}
