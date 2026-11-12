// Full-screen shaders cost one evaluation per device pixel. On a 2x screen
// that is four per logical pixel, which held scrolling at about 40 fps while
// the backdrops animated. Their soft water and sand look the same drawn at
// a lower density and scaled up, so they are drawn offscreen at
// [shaderDensity] and stretched to the screen.
import 'dart:ui' as ui;

import 'package:flutter/widgets.dart';

/// Texture pixels per logical pixel for full-screen shader backdrops.
const shaderDensity = 1.0;

/// Paints [draw], which works in logical pixels over [size], at [density]
/// texture pixels per logical pixel when the screen is denser than that,
/// then draws the result scaled to fill [size].
///
/// On a screen no denser than [density], [draw] paints straight to [canvas].
void paintAtDensity(
  Canvas canvas,
  Size size,
  void Function(Canvas canvas) draw, {
  double density = shaderDensity,
}) {
  final views = WidgetsBinding.instance.platformDispatcher.views;
  final deviceRatio = views.isEmpty ? 1.0 : views.first.devicePixelRatio;
  final width = (size.width * density).ceil();
  final height = (size.height * density).ceil();
  if (deviceRatio <= density || width <= 0 || height <= 0) {
    draw(canvas);
    return;
  }
  final recorder = ui.PictureRecorder();
  final offscreen = Canvas(recorder)..scale(density);
  draw(offscreen);
  final picture = recorder.endRecording();
  final image = picture.toImageSync(width, height);
  picture.dispose();
  canvas.drawImageRect(
    image,
    Rect.fromLTWH(0, 0, width.toDouble(), height.toDouble()),
    Offset.zero & size,
    Paint()..filterQuality = FilterQuality.low,
  );
  image.dispose();
}
