// Perspective horizon sea and sky for the Themes and "Use it" slides.
//
// Adapts noniv/web-ocean's perspective ocean surface shading (multi-scale
// directional swell + rotated capillary slope spectrum with LEAN energy-
// conserving variance transfer, anisotropic Gaussian slope glitter with Smith
// masking, grazing-angle facet-tilt Fresnel sky reflection, backlit subsurface
// crest glow, Mie/Henyey-Greenstein atmospheric scattering, and IGN dithering)
// to a single-pass Flutter fragment shader tinted by Fortal's resolved theme
// tokens.
//
// Adapted from noniv/web-ocean (MIT License, Copyright (c) 2026 Maksymilian Dendura).
#version 460 core

#include <flutter/runtime_effect.glsl>

precision highp float;

uniform vec2 uSize;
uniform float uTime; // seconds, wrapped at 3600.0 (shoreLoop)
uniform float uMode; // 0.0 = day theme horizon (Themes), 1.0 = night sea (Use it)
uniform vec3 uSky;
uniform vec3 uHaze;
uniform vec3 uSea;
uniform vec3 uDeep;

out vec4 fragColor;

const float kPi = 3.14159265;
const float kLoop = 3600.0;
const float kOmega0 = 6.2831853 / kLoop;
const mat2 kRot = mat2(0.8, 0.6, -0.6, 0.8);

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

// Periodic quintic gradient noise returning vec3(value, dval/dx, dval/dy) so a
// single evaluation yields both wave elevation and exact surface slope.
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

// Footprint-filtered billowy cloud FBM (web-ocean sky.js cloudFbm).
float cloudFbm(vec2 p, float fp) {
  float s = 0.0;
  float a = 0.5;
  vec2 q = p;
  float f = 1.0;
  for (int i = 0; i < 4; i++) {
    float w = 1.0 - smoothstep(0.08, 0.30, fp * f);
    float n = gnoise(q);
    if (i >= 2) {
      n = mix(n, abs(n) * 2.0 - 0.38, 0.35);
    }
    s += a * n * w;
    q = kRot * q * 2.03 + vec2(13.1, 7.7);
    f *= 2.03;
    a *= 0.5;
  }
  return s;
}

float phaseHG(float c, float g) {
  float g2 = g * g;
  return (1.0 - g2) / (4.0 * kPi * pow(max(1.0 + g2 - 2.0 * g * c, 1e-4), 1.5));
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

// Curved coastal swell train: gentle phase domain-warping prevents straight
// planar stripes while footprint filtering transfers sub-pixel slope variance
// cleanly into LEAN `unres`.
void addSwellWave(
  vec2 xz,
  vec2 dir,
  float wl,
  float amp,
  float chop,
  float warpPhase,
  float fp,
  inout float h,
  inout vec2 sl,
  inout vec3 jac,
  inout float unres
) {
  float k = 6.2831853 / wl;
  float slRms = 0.7071 * amp * k;
  float vis = 1.0 - smoothstep(wl * 0.18, wl * 0.52, fp);
  unres += (1.0 - vis * vis) * slRms * slRms * 0.5;
  if (vis <= 0.002) {
    return;
  }
  float omega = sqrt(9.81 * k);
  float w = floor(omega / kOmega0 + 0.5) * kOmega0;
  float ph = dot(xz, dir) * k + warpPhase - w * uTime;
  float a = amp * vis;
  float c = cos(ph);
  float s = sin(ph);
  h += a * c;
  sl += -a * k * s * dir;
  float jk = -chop * a * k * c;
  jac += vec3(jk * dir.x * dir.x, jk * dir.y * dir.y, jk * dir.x * dir.y);
}

vec3 skyDome(vec3 dir, vec3 sunSkyDir, vec3 lightTint) {
  float up = clamp(dir.y, 0.0, 1.0);
  // Optical-depth horizon curve (web-ocean ATMO_CORE_WGSL).
  float band = 1.0 - exp(-up * mix(4.4, 6.2, uMode));
  vec3 col = mix(uHaze, uSky, band);
  float cosT = dot(dir, sunSkyDir);
  float mie = phaseHG(cosT, mix(0.78, 0.84, uMode));
  float glowScale = mix(0.16, 0.035, uMode);
  col += lightTint * min(mie * glowScale, mix(0.32, 0.06, uMode));
  return col;
}

void main() {
  vec2 size = max(uSize, vec2(1.0));
  vec2 uv = FlutterFragCoord().xy / size;
  float aspect = size.x / size.y;
  float horizonY = mix(0.74, 0.50, uMode);
  float focal = 1.15;

  // Camera ray: y > 0 above the horizon, y < 0 onto the ocean plane.
  vec2 ndc = vec2((uv.x - 0.5) * aspect, horizonY - uv.y);
  vec3 dir = normalize(vec3(ndc.x, ndc.y, focal));

  // Sun (Themes, right of centre) or calm low moon (Use it, between cards 2 & 3).
  float lightAzX = (mix(0.66, 0.52, uMode) - 0.5) * aspect;
  vec3 sunSkyDir = normalize(vec3(lightAzX, mix(0.46, 0.22, uMode), focal));
  // Low grazing glitter elevation produces web-ocean's broken facet sparkles.
  vec3 glitterSunDir = normalize(vec3(lightAzX, mix(0.088, 0.082, uMode), focal));
  vec3 lightTint = mix(vec3(1.00, 0.985, 0.94), vec3(0.68, 0.95, 0.89), uMode);

  vec3 skyDir = normalize(vec3(dir.x, max(dir.y, 0.002), dir.z));
  vec3 skyCol = skyDome(skyDir, sunSkyDir, lightTint);

  // Soft trade-wind cumulus wisps in daylight mode only; night sky stays clean
  // so white headline typography on Slide 5 has uninterrupted dark contrast.
  if (uMode < 0.5 && ndc.y >= 0.02) {
    float mu = max(skyDir.y, 0.06);
    float ct = 1.9 / mu;
    float highFade = smoothstep(0.04, 0.14, skyDir.y);
    float far = (1.0 - smoothstep(14.0, 30.0, ct)) * smoothstep(0.24, 0.68, uv.x) * highFade;
    if (far > 0.005) {
      float pixAng = 1.0 / (size.y * focal);
      float fp = ct * pixAng / mu;
      vec2 cells = vec2(18.0, 9.0);
      vec2 drift = (cells / kLoop) * uTime;
      vec2 q = skyDir.xz * ct * 0.45 + drift;
      vec2 warp = vec2(
        loopGNoiseGrad(q * 0.40 + vec2(1.7, 9.2), cells * 0.40).x,
        loopGNoiseGrad(q * 0.40 + vec2(8.3, 2.8), cells * 0.40).x
      );
      float edge = cloudFbm((q + warp * 0.75) * vec2(1.0, 1.45), fp) * 1.18 + 0.02;
      float d = clamp(edge / (0.46 + fp * 0.35), 0.0, 1.0) * far;
      if (d > 0.002) {
        vec2 sunStep = normalize(sunSkyDir.xz + vec2(1e-4)) * 0.14;
        float s1 = clamp((cloudFbm((q + sunStep + warp * 0.75) * vec2(1.0, 1.45), fp * 1.4) * 1.18 + 0.02) / 0.48, 0.0, 1.0) * far;
        float rim = clamp((d - s1) * 2.2, 0.0, 1.0);
        float alpha = (1.0 - exp(-d * 1.9)) * 0.28;
        vec3 cloudLit = mix(mix(uSky, uHaze, 0.60), lightTint, 0.45 + 0.45 * rim);
        skyCol = mix(skyCol, cloudLit, alpha);
      }
    }
  }

  // Soft pixel anti-aliasing across the horizon line.
  float seaMask = smoothstep(-0.8 / size.y, 0.8 / size.y, uv.y - horizonY);
  if (seaMask <= 0.0) {
    float dither = ign(FlutterFragCoord().xy) + ign(FlutterFragCoord().xy * 1.37 + 17.0) - 1.0;
    fragColor = vec4(clamp(skyCol + dither / 255.0, vec3(0.0), vec3(1.0)), 1.0);
    return;
  }

  // ── Perspective ocean surface (web-ocean ocean.js) ─────────────────────────
  // Coastal overlook height (~12m) gives realistic multi-swell scale across the
  // viewport instead of zooming into a single planar wave crest.
  float camH = mix(12.5, 11.5, uMode);
  float rayDown = max(-dir.y, 0.0010);
  float dist = min(camH / rayDown, 1400.0);
  vec2 xz = dir.xz / rayDown * camH;
  float fp = dist / max(size.y * focal, 1.0);

  // Cat's-paw wind-gust patches (web-ocean ocean.js:123-124).
  vec2 gustCells = vec2(54.0, 36.0);
  float gustN = loopGNoiseGrad(xz * 0.014 + (gustCells / kLoop) * uTime, gustCells).x * 0.5 + 0.5;
  float gust = mix(0.38, 1.22, smoothstep(0.28, 0.72, gustN));
  float calmNight = mix(1.0, 0.78, uMode);

  // Unresolved finest capillary slope variance (matches web-ocean waterCol.w = 0.0024).
  float unres = mix(0.0022, 0.0018, uMode) * (0.65 + 0.50 * gust);

  // Gentle spatial phase warp curves long swells organically.
  float swellWarp = gnoise(xz * 0.026 + vec2(3.1, 7.4)) * 0.85;

  float height = 0.0;
  vec2 sl = vec2(0.0);
  vec3 jac = vec3(0.0);
  addSwellWave(xz, normalize(vec2(0.22, -0.975)), 31.0, 0.28 * calmNight, 0.72, swellWarp, fp, height, sl, jac, unres);
  addSwellWave(xz, normalize(vec2(-0.38, -0.925)), 17.5, 0.16 * calmNight, 0.68, -swellWarp * 0.8, fp, height, sl, jac, unres);
  addSwellWave(xz, normalize(vec2(0.49, -0.872)), 9.6, 0.082 * gust * calmNight, 0.62, swellWarp * 1.2, fp, height, sl, jac, unres);

  // Multi-scale directional wind-sea facet spectrum (5 rotated octaves from ~4.5m
  // down to ~0.22m). Cross-wind stretch mimics Donelan-Banner spreading so wave
  // facets are broader across-wind than along-wind, and filtered-out octaves
  // deposit their exact slope variance into `unres` (LEAN energy conservation).
  mat2 basis = mat2(0.96, 0.28, -0.28, 0.96);
  float freq = 0.22;
  float amp = 0.145 * calmNight;
  for (int i = 0; i < 5; i++) {
    float gk = i >= 2 ? gust : mix(1.0, gust, 0.35);
    float a = amp * gk;
    // Anisotropic wave-packet scale: shorter wavelength along Z (towards viewer),
    // wider crests across X, rotated each octave to eliminate any grid alignment.
    vec2 sc = vec2(freq * 0.62, freq * 1.32);
    float slRms = a * length(sc) * 0.62;
    float vis = 1.0 - smoothstep(0.15, 0.46, fp * freq * 1.15);
    unres += (1.0 - vis * vis) * slRms * slRms * 0.55;
    if (vis > 0.004) {
      float rateSteps = floor((58.0 + float(i) * 37.0) + 0.5);
      vec2 cells = vec2(rateSteps, rateSteps);
      vec2 drift = vec2(0.35, -1.0) * (rateSteps / kLoop) * uTime;
      vec2 m0 = basis[0] * sc.x;
      vec2 m1 = basis[1] * sc.y;
      vec2 q = vec2(dot(xz, m0), dot(xz, m1)) + drift + float(i) * vec2(11.3, 6.7);
      vec3 ng = loopGNoiseGrad(q, cells);
      float wAmp = a * vis;
      height += wAmp * ng.x;
      // Chain rule back to world (x, z) coordinates:
      vec2 dWorld = ng.y * m0 + ng.z * m1;
      sl += wAmp * dWorld;
      jac.xy += -0.22 * wAmp * abs(dWorld) * freq;
    }
    basis = kRot * basis;
    freq *= 2.12;
    amp *= 0.49;
  }

  float jx = max(1.0 + jac.x, 0.20);
  float jz = max(1.0 + jac.y, 0.20);
  vec2 slope = vec2(sl.x / jx, sl.y / jz);
  vec3 nrm = normalize(vec3(-slope.x, 1.0, -slope.y));
  vec3 V = normalize(vec3(-dir.x, rayDown, -dir.z));

  // Far-horizon Cox-Munk floor + anisotropic cross/along-wind slope covariance.
  unres += 0.0032 * smoothstep(35.0, 480.0, dist);
  vec3 cov = vec3(unres * 0.88, unres * 1.22, 0.0004);

  // Anisotropic Gaussian slope sun/moon glitter with Smith masking (ocean.js:168-178).
  vec3 Ld = glitterSunDir;
  vec3 Hv = normalize(V + Ld);
  vec2 hs = -Hv.xz / max(Hv.y, 1e-3);
  vec2 dsl = hs - slope;
  float det = max(cov.x * cov.y - cov.z * cov.z, 1e-9);
  float ex = (dsl.x * dsl.x * cov.y + dsl.y * dsl.y * cov.x - 2.0 * dsl.x * dsl.y * cov.z) / det;
  float pdf = exp(-0.5 * ex) / (2.0 * kPi * sqrt(det));
  float hy2 = Hv.y * Hv.y;
  float Dm = pdf / max(hy2 * hy2, 1e-5);
  float G = 1.0 / (1.0 + lambdaSmith(V, cov) + lambdaSmith(Ld, cov));
  float Fh = fresnelWater(dot(V, Hv));
  // Soften sparkles directly under Slide 4's bottom code bar and Slide 5's Step 3 card.
  float uiCalm = mix(
    1.0 - 0.55 * smoothstep(0.84, 0.94, uv.y) * smoothstep(0.22, 0.34, uv.x),
    1.0 - 0.65 * smoothstep(0.60, 0.72, uv.x) * smoothstep(0.68, 0.84, uv.y),
    uMode
  );
  vec3 spec =
    lightTint * (Fh * Dm * G / (4.0 * max(V.y, 0.022))) *
    mix(0.28, 0.14, uMode) * uiCalm;

  // Grazing-angle facet-tilt sky reflection (ocean.js:183-199).
  float sig = sqrt((cov.x + cov.y) * 0.5);
  vec3 vh = normalize(vec3(V.x, 0.0, V.z) + vec3(1e-5, 0.0, 0.0));
  float aV = max(V.y, 1e-3) / max(sqrt(max(1.0 - V.y * V.y, 1e-4)), 1e-3) / (1.4142 * sig);
  float tilt = 0.32 * sig * (1.0 - smoothstep(0.0, 2.5, aV));
  vec3 nV = normalize(nrm + vh * tilt);
  vec3 R = reflect(-V, nV);
  R.y = abs(R.y) * 0.4 + max(R.y, 0.0) * 0.6;
  R = normalize(R);
  vec3 refl = skyDome(R, sunSkyDir, lightTint);
  // Preserve rich theme chroma in daylight reflections so every Fortal accent
  // (Mar, Ceu, Sol, Caju, etc.) reads vibrantly across the sea strip.
  refl = mix(refl, mix(uSea, uHaze, 0.52), (1.0 - uMode) * 0.38);
  vec3 nF = normalize(mix(nrm, vec3(0.0, 1.0, 0.0), 0.42));
  float Fr = fresnelWater(max(dot(nF, V), 0.0)) * mix(0.76, 0.88, uMode);

  // Water body scatter + backlit subsurface crest glow (ocean.js:204-210).
  float nearMix = exp(-dist / 85.0);
  vec3 body = mix(uSea, uDeep, nearMix * mix(0.64, 0.78, uMode));
  // Subtle facet shading on upwelling body light gives troughs and crests crisp 3D relief.
  float facetLift = clamp(0.5 + 1.8 * dot(nrm.xz, normalize(Ld.xz + vec2(1e-4))), 0.0, 1.0);
  body *= mix(0.88, 1.10, facetLift);

  float crest = clamp((height + 0.05) / 0.42, 0.0, 1.25);
  float thin = pow(clamp(0.55 - 0.45 * dot(Ld, nrm), 0.0, 1.0), 2.6);
  vec3 sssTint = mix(mix(uSea, uHaze, 0.38), vec3(0.11, 0.56, 0.50), uMode);
  body += sssTint * (crest * crest * thin * mix(0.30, 0.20, uMode) * exp(-dist / 260.0));

  vec3 seaCol = body * (1.0 - Fr) + refl * Fr + min(spec, vec3(mix(0.95, 0.48, uMode)));

  // Subtle whitecap lace on steep foreground crests in daylight mode.
  float J = (1.0 + jac.x) * (1.0 + jac.y) - jac.z * jac.z;
  float fresh = clamp((0.72 - J) * 2.4, 0.0, 1.0) * (1.0 - uMode) * exp(-dist / 120.0);
  if (fresh > 0.02) {
    vec2 fCells = vec2(72.0, 36.0);
    float lace = loopGNoiseGrad(xz * 1.4 + (fCells / kLoop) * uTime, fCells).x * 0.5 + 0.5;
    float fm = smoothstep(0.60 - fresh * 0.32, 0.84 - fresh * 0.32, lace) * fresh * 0.50;
    seaCol = mix(seaCol, mix(vec3(0.97, 0.99, 0.98), uHaze, 0.18), fm);
  }

  // Exponential aerial perspective blends the far ocean into the horizon band.
  float T = exp(-dist * mix(0.0022, 0.0032, uMode));
  vec3 fogCol = mix(skyDome(normalize(vec3(dir.x, 0.003, dir.z)), sunSkyDir, lightTint), uSea, (1.0 - uMode) * 0.28);
  seaCol = seaCol * T + fogCol * (1.0 - T);

  vec3 col = mix(skyCol, seaCol, seaMask);

  // Highlight desaturation + triangular IGN dithering (web-ocean post.js).
  float lum = dot(col, vec3(0.2126, 0.7152, 0.0722));
  col = mix(col, vec3(lum), smoothstep(0.78, 2.2, lum) * 0.45);
  float dither = ign(FlutterFragCoord().xy) + ign(FlutterFragCoord().xy * 1.37 + 17.0) - 1.0;
  col = clamp(col + dither / 255.0, vec3(0.0), vec3(1.0));
  fragColor = vec4(col, 1.0);
}
