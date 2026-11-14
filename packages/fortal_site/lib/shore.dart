// The shore: `shaders/shore.frag`, painted behind the tiles and again over them.
//
// The shader gets the time, the mapping from the screen to the page's design
// canvas, and the tiles' boxes, so the water and sand follow the real cards.
// `waveNudge` follows the shader's waves so a card gives a little when a wave
// reaches it; the shader is given the nudged boxes, so its sand and wash move
// with the cards.
import 'dart:math' as math;
import 'dart:ui' as ui;

import 'package:flutter/widgets.dart';

import 'density.dart';

// Keep these in step with the constants and functions in shore.frag.
const _shore = 290.0;
const _sink = 40.0;
const _down = Offset(0.0599, 0.9982);
const _pivot = Offset(720, 0);
const _period = 10.0;
const _waves = [(offset: 0.0, reach: 400.0), (offset: 0.52, reach: 122.0)];

/// The shader's clock wraps here, on a whole number of waves, so its time
/// stays precise however long the page is left open. Everything the shader
/// moves repeats over it.
const shoreLoop = 3600.0;

/// Texture pixels per logical pixel for the foam over the cards. Screens no
/// denser than this draw it directly, at their own density.
const foamDensity = 2.0;

/// One of the shader's two layers. The layer behind the tiles fills the
/// screen; the layer over them paints only the tiles' boxes, where it draws
/// drifted sand and the wash of a wave and is clear everywhere else.
class Shore extends StatelessWidget {
  const Shore({
    super.key,
    required this.shader,
    required this.time,
    required this.origin,
    required this.scale,
    required this.cards,
    required this.radius,
    this.over = false,
    this.scroll,
  });

  /// The narrow page's scroll, when the shore is at the top of a page taller
  /// than the screen: only the part on the screen is drawn.
  final ScrollController? scroll;

  final ui.FragmentShader shader;
  final ValueNotifier<double> time;
  final Offset origin;
  final double scale;
  final List<Rect> cards;
  final double radius;
  final bool over;

  @override
  Widget build(BuildContext context) => RepaintBoundary(
    child: CustomPaint(
      painter: _ShorePainter(
        shader: shader,
        time: time,
        origin: origin,
        scale: scale,
        cards: cards,
        radius: radius,
        over: over,
        scroll: scroll,
      ),
      size: Size.infinite,
    ),
  );
}

class _ShorePainter extends CustomPainter {
  _ShorePainter({
    required this.shader,
    required this.time,
    required this.origin,
    required this.scale,
    required this.cards,
    required this.radius,
    required this.over,
    this.scroll,
  }) : assert(cards.length == 8, 'shore.frag takes eight cards'),
       super(repaint: Listenable.merge([time, ?scroll]));

  final ui.FragmentShader shader;
  final ValueNotifier<double> time;
  final Offset origin;
  final double scale;
  final List<Rect> cards;
  final double radius;
  final bool over;
  final ScrollController? scroll;

  /// What the page shows of the shore, in its own coordinates; all of it when
  /// it does not scroll.
  Rect? _onScreen(Size size) {
    final scroll = this.scroll;
    if (scroll == null || !scroll.hasClients) return null;
    final position = scroll.position;
    if (!position.hasPixels || !position.hasViewportDimension) return null;
    return Rect.fromLTWH(
      0,
      position.pixels,
      size.width,
      position.viewportDimension,
    );
  }

  @override
  void paint(Canvas canvas, Size size) {
    final t = time.value;
    // Where the cards are now, nudged as the page moves them.
    final boxes = [
      for (final card in cards)
        card.shift(Offset(0, waveNudge(card, cards, t))),
    ];
    shader.getUniformFloat('uOrigin', 0).set(origin.dx);
    shader.getUniformFloat('uOrigin', 1).set(origin.dy);
    shader.getUniformFloat('uScale').set(scale);
    shader.getUniformFloat('uTime').set(t);
    shader.getUniformFloat('uRadius').set(radius);
    shader.getUniformFloat('uLayer').set(over ? 1 : 0);
    for (final (i, box) in boxes.indexed) {
      final edges = [box.left, box.top, box.right, box.bottom];
      for (final (j, edge) in edges.indexed) {
        shader.getUniformFloat('uCard$i', j).set(edge);
      }
    }
    final paint = Paint()..shader = shader;
    final onScreen = _onScreen(size);
    if (!over) {
      // The water behind the cards is soft enough to draw at a lower density;
      // the foam over them stays sharp. On a page taller than the screen,
      // only the part on the screen is drawn.
      paintAtDensity(
        canvas,
        size,
        (canvas) => canvas.drawRect(Offset.zero & size, paint),
        region: onScreen,
      );
      return;
    }
    final drawn = [
      for (final box in boxes)
        Rect.fromLTRB(
          origin.dx + box.left * scale,
          origin.dy + box.top * scale,
          origin.dx + box.right * scale,
          origin.dy + box.bottom * scale,
        ).inflate(1),
    ].where((card) => onScreen == null || card.overlaps(onScreen)).toList();
    if (drawn.isEmpty) return;
    // The foam over the cards stays sharp, at up to [foamDensity] texture
    // pixels per logical pixel: on a 3x phone, drawing it at the screen's
    // density would shade every card pixel nine times a frame.
    paintAtDensity(
      canvas,
      size,
      (canvas) {
        for (final card in drawn) {
          canvas.drawRect(card, paint);
        }
      },
      density: foamDensity,
      region: switch (drawn.reduce((a, b) => a.expandToInclude(b))) {
        final cards when onScreen != null => cards.intersect(onScreen),
        final cards => cards,
      },
    );
  }

  @override
  bool shouldRepaint(_ShorePainter old) =>
      old.shader != shader ||
      old.origin != origin ||
      old.scale != scale ||
      old.radius != radius ||
      old.over != over ||
      old.scroll != scroll ||
      old.cards != cards;
}

/// How far, in design units, the waves push a card down the sand at time `t`:
/// a small shove when a wave's front reaches the card's top, then a settle.
/// It follows the shader's waves, each with its own outline and held back
/// behind the other `cards`, so a card moves only when water reaches it.
double waveNudge(Rect card, List<Rect> cards, double t) {
  var nudge = 0.0;
  for (final wave in _waves) {
    final cycle = t / _period + wave.offset;
    // Waves are counted around the clock's hour, as in the shader.
    final seed =
        cycle.floorToDouble() % (shoreLoop / _period) * 7.31 +
        wave.offset * 41.7;
    // The share of its run the wave needs to reach the nearest part of the
    // card's top edge.
    var needed = double.infinity;
    for (var k = 0; k < 5; k++) {
      final point = Offset(card.left + card.width * (0.1 + 0.2 * k), card.top);
      final p = point - _pivot;
      final along = p.dx * _down.dx + p.dy * _down.dy;
      final across = p.dx * _down.dy - p.dy * _down.dx;
      final extent =
          math.max(wave.reach + _waveShape(across, seed), 30.0) + _sink;
      final held = _held(point, cards);
      needed = math.min(needed, (along - _shore + _sink + held) / extent);
    }
    if (needed >= 0.97) continue;
    // Invert the shader's rush, 1 - (1 - phase / 0.26)^3.
    final hitPhase =
        0.26 * (1 - math.pow(1 - math.max(needed, 0.0), 1 / 3).toDouble());
    final since = (cycle % 1.0 - hitPhase) * _period;
    if (since <= 0) continue;
    final strength = 2.2 + 2.6 * (1 - needed);
    nudge += strength * math.exp(-1.9 * since) * math.sin(5.2 * since);
  }
  return nudge;
}

// shore.frag's hash, noise, waveShape and the shelter behind each card.
double _fract(double x) => x - x.floorToDouble();

double _hash(double x, double y) {
  var qx = _fract(x * 0.1031), qy = _fract(y * 0.1031), qz = qx;
  final d = qx * (qy + 33.33) + qy * (qz + 33.33) + qz * (qx + 33.33);
  qx += d;
  qy += d;
  qz += d;
  return _fract((qx + qy) * qz);
}

double _noise(double x, double y) {
  final ix = x.floorToDouble(), iy = y.floorToDouble();
  final fx = x - ix, fy = y - iy;
  final ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
  final a = _hash(ix, iy), b = _hash(ix + 1, iy);
  final c = _hash(ix, iy + 1), d = _hash(ix + 1, iy + 1);
  return (a + (b - a) * ux) * (1 - uy) + (c + (d - c) * ux) * uy;
}

double _waveShape(double across, double seed) =>
    (_noise(across * 0.0042, seed) - 0.5) * 150 +
    (_noise(across * 0.0150, seed + 3.7) - 0.5) * 46;

double _smoothstep(double e0, double e1, double x) {
  final t = ((x - e0) / (e1 - e0)).clamp(0.0, 1.0);
  return t * t * (3 - 2 * t);
}

double _held(Offset p, List<Rect> cards) {
  final wobble = (_noise(p.dx * 0.012 + 5.3, p.dy * 0.012 + 5.3) - 0.5) * 0.2;
  var held = 0.0;
  for (final card in cards) {
    final half = card.width / 2;
    final off = (p.dx - card.center.dx) / half;
    final below = p.dy - card.bottom;
    final len = 1.2 * half + 40;
    final shelter = 1 - off * off - math.max(below, 0.0) / len + wobble;
    held = math.max(
      held,
      0.4 * len * _smoothstep(0, 1, shelter) * _smoothstep(-12, 0, below),
    );
  }
  return held;
}
