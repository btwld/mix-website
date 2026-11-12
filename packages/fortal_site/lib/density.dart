// Full-screen shaders cost one evaluation per device pixel, every frame they
// are drawn. That held scrolling at about 40 fps on a 2x screen. So:
//
// - a backdrop that moves (the hero's shore) is drawn offscreen at
//   [shaderDensity] and stretched to the screen ([paintAtDensity]);
// - a backdrop that stays still is drawn once and kept as an image, then
//   only that image is drawn ([StillPicture]).
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

/// The most texture pixels per logical pixel a [StillPicture] keeps.
const stillDensity = 2.0;

/// One drawing kept as an image, redrawn only when its inputs change.
///
/// A still shader backdrop costs its shader once, not once per frame: later
/// frames, and the frames of a page transition over it, draw the image.
class StillPicture {
  ui.Image? _image;
  Object? _inputs;

  /// Draws the picture for [inputs] over [size].
  ///
  /// [draw] runs only when [inputs], [size] or the screen's density differ
  /// from the kept image's. It works in logical pixels.
  void paint(
    Canvas canvas,
    Size size,
    Object inputs,
    void Function(Canvas canvas) draw,
  ) {
    if (size.isEmpty) return;
    final views = WidgetsBinding.instance.platformDispatcher.views;
    final deviceRatio = views.isEmpty ? 1.0 : views.first.devicePixelRatio;
    final density = deviceRatio < stillDensity ? deviceRatio : stillDensity;
    final width = (size.width * density).ceil();
    final height = (size.height * density).ceil();
    final wanted = (inputs, width, height);
    var image = _image;
    if (image == null || _inputs != wanted) {
      final recorder = ui.PictureRecorder();
      draw(Canvas(recorder)..scale(density));
      final picture = recorder.endRecording();
      image = picture.toImageSync(width, height);
      picture.dispose();
      _image?.dispose();
      _image = image;
      _inputs = wanted;
    }
    canvas.drawImageRect(
      image,
      Rect.fromLTWH(0, 0, width.toDouble(), height.toDouble()),
      Offset.zero & size,
      Paint()..filterQuality = FilterQuality.low,
    );
  }

  /// Releases the kept image.
  void dispose() {
    _image?.dispose();
    _image = null;
    _inputs = null;
  }
}
