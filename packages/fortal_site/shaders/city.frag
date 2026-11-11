// The Beira-Mar photograph behind the Foundations slide, with its sea set in
// motion. Only the water moves: a feathered mask picked out of the photo
// marks the bay and the strip below the breakwater. Inside it, wavelets
// drawn on the sea's own ground plane bend the photo (so its surf lines
// sway), shade it with their facets, and catch small points of sun.
//
// The photo is cover-fitted to the frame, aligned by `uAlign`. Every wave
// runs a whole number of cycles per loop, so the hourly clock wrap is seamless.
//
// Gradient-noise primitives adapted from noniv/web-ocean
// (MIT License, Copyright (c) 2026 Maksymilian Dendura).
#version 460 core

#include <flutter/runtime_effect.glsl>

precision highp float;

uniform vec2 uSize;
uniform float uTime;   // seconds, wrapped at 3600.0 (shoreLoop)
uniform vec2 uImage;   // photo size in pixels
uniform vec2 uAlign;   // cover-crop alignment, 0..1 on each axis
uniform sampler2D uPhoto;
uniform sampler2D uSea;

out vec4 fragColor;

const float kLoop = 3600.0;
const float kOmega0 = 6.2831853 / kLoop;
const mat2 kRot = mat2(0.8, 0.6, -0.6, 0.8);
// Where the sea meets the sky in the photo, as a fraction of its height.
const float kHorizon = 0.155;

vec2 hash2(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
  q += dot(q, q.yzx + 33.33);
  return fract((q.xx + q.yz) * q.zy);
}

float ign(vec2 p) {
  return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715))));
}

// Gradient noise with its derivative, tiling every `cells` lattice steps.
vec3 loopGNoiseGrad(vec2 p, vec2 cells) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  vec2 du = 30.0 * f * f * (f * (f - 2.0) + 1.0);
  vec2 a = i - cells * floor((i + 0.5) / cells);
  vec2 b = i + 1.0;
  b -= cells * floor((b + 0.5) / cells);
  vec2 g00 = hash2(a) * 2.0 - 1.0;
  vec2 g10 = hash2(vec2(b.x, a.y)) * 2.0 - 1.0;
  vec2 g01 = hash2(vec2(a.x, b.y)) * 2.0 - 1.0;
  vec2 g11 = hash2(b) * 2.0 - 1.0;
  float va = dot(g00, f);
  float vb = dot(g10, f - vec2(1.0, 0.0));
  float vc = dot(g01, f - vec2(0.0, 1.0));
  float vd = dot(g11, f - vec2(1.0, 1.0));
  float k1 = vb - va;
  float k2 = vc - va;
  float k3 = va - vb - vc + vd;
  vec2 grad =
    g00 + u.x * (g10 - g00) + u.y * (g01 - g00) +
    u.x * u.y * (g00 - g10 - g01 + g11) +
    du * (vec2(k1, k2) + k3 * u.yx);
  return vec3(va + k1 * u.x + k2 * u.y + k3 * u.x * u.y, grad);
}

float loopSpeed(float w) {
  return floor(w / kOmega0 + 0.5) * kOmega0;
}

void main() {
  vec2 frag = FlutterFragCoord().xy;
  vec2 size = max(uSize, vec2(1.0));
  float scale = max(size.x / uImage.x, size.y / uImage.y);
  vec2 drawn = uImage * scale;
  vec2 uv = (frag - (size - drawn) * uAlign) / drawn;

  vec3 col = texture(uPhoto, uv).rgb;
  float sea = texture(uSea, uv).r;

  if (sea > 0.003) {
    // The sea's ground plane: the photo looks down at it from the air, so
    // distance grows towards the horizon and the waves shrink with it.
    float aspect = uImage.x / uImage.y;
    float dy = max(uv.y - kHorizon, 0.03);
    float depth = 1.0 / dy;
    vec2 ground = vec2((uv.x - 0.42) * aspect * depth, depth);
    // How much ground one screen pixel covers, to fade waves before they alias.
    float footprint = depth * depth / drawn.y;

    // Long swells rolling in towards the beach, then short wind chop.
    vec2 slope = vec2(0.0);
    vec2 swellDir = normalize(vec2(0.62, -0.78));
    float swellK = 9.0;
    float swellPhase = dot(ground, swellDir) * swellK - loopSpeed(1.3) * uTime;
    // Fade the swell before its crests crowd into stripes in the distance.
    slope += swellDir * (cos(swellPhase) * 0.105 * (1.0 - smoothstep(0.12, 0.34, footprint * swellK)));
    vec2 swell2Dir = normalize(vec2(0.95, -0.30));
    float swell2Phase = dot(ground, swell2Dir) * 15.0 - loopSpeed(1.9) * uTime;
    slope += swell2Dir * (cos(swell2Phase) * 0.050 * (1.0 - smoothstep(0.06, 0.16, footprint * 15.0)));

    mat2 basis = mat2(0.92, -0.39, 0.39, 0.92);
    float freq = 26.0;
    float amp = 0.0075;
    for (int i = 0; i < 3; i++) {
      float vis = 1.0 - smoothstep(0.10, 0.30, footprint * freq);
      if (vis > 0.004) {
        float steps = floor(80.0 + float(i) * 44.0 + 0.5);
        vec2 cells = vec2(steps, steps);
        vec2 drift = vec2(18.0, -10.0) * (steps / kLoop) * uTime;
        vec2 q = vec2(dot(ground, basis[0]), dot(ground, basis[1])) * freq +
          drift + float(i) * vec2(7.9, 13.1);
        vec3 ng = loopGNoiseGrad(q, cells);
        slope += (ng.y * basis[0] + ng.z * basis[1]) * (amp * freq * vis);
      }
      basis = kRot * basis;
      freq *= 2.1;
      amp *= 0.5;
    }

    // Bend the photo by the wave slopes, less in the distance, and only where
    // the bent sample is still water, so the beach never smears into the sea.
    vec2 bend = vec2(slope.x, -slope.y) * (0.022 / depth) * vec2(1.0 / aspect, 1.0);
    vec2 bentUv = uv + bend * sea;
    float bentSea = texture(uSea, bentUv).r;
    vec3 moved = texture(uPhoto, mix(uv, bentUv, bentSea)).rgb;

    // Facet light and dark, then small points of sun on facets tilted to it.
    vec3 n = normalize(vec3(-slope.x, 1.0, -slope.y));
    float facet = dot(slope, normalize(vec2(-0.55, 0.83)));
    moved *= 1.0 + clamp(facet, -0.24, 0.24) * 1.9;
    vec3 h = normalize(vec3(0.20, 1.0, 0.34));
    float glint = pow(max(dot(n, h), 0.0), 600.0) * (1.0 - smoothstep(0.02, 0.12, footprint * 26.0));
    moved += vec3(1.0, 0.98, 0.92) * min(glint * 1.1, 0.7);

    col = mix(col, moved, sea);
  }

  float dither = ign(frag) + ign(frag * 1.37 + 17.0) - 1.0;
  fragColor = vec4(clamp(col + dither / 255.0, 0.0, 1.0), 1.0);
}
