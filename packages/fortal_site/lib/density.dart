// Full-screen shaders cost one evaluation per device pixel, every frame they
// are drawn. That held scrolling at about 40 fps on a 2x screen. So:
//
// - a backdrop that moves (the hero's shore) is drawn offscreen at
//   [shaderDensity] and stretched to the screen ([paintAtDensity]);
// - a backdrop that stays still is drawn once and kept as an image, then
//   only that image is drawn ([StillPicture]).
import 'dart:ui' as ui;

import 'package:flutter/foundation.dart' show kIsWasm;
import 'package:flutter/widgets.dart';

/// Whether drawing a picture into an image, to draw a shader at a lower
/// density, is cheap. In the WebAssembly build the renderer draws on its own
/// thread and it is. In the JavaScript build (CanvasKit, what every iPhone
/// browser gets) it blocks the page's only thread: measured in WebKit, a frame
/// of the hero's water took about 8 ms that way against 1 ms drawn directly.
/// There, shaders are drawn straight to the screen. `?offscreen=on` draws
/// through an image in both builds, for comparing on a phone.
final offscreenIsCheap =
    kIsWasm || Uri.base.queryParameters['offscreen'] == 'on';

/// Texture pixels per logical pixel for full-screen shader backdrops.
const shaderDensity = 1.0;

/// Paints [draw], which works in logical pixels over [size], at [density]
/// texture pixels per logical pixel when the screen is denser than that,
/// then draws the result scaled to fill [size].
///
/// With a [region], only that part of [size] is drawn: what a scrolling page
/// shows of a backdrop taller than the screen.
///
/// With [throughTexture], it draws through an image even on a screen no denser
/// than [density]: a backdrop that changes less often than the screen's frames
/// then costs its shader once per change, not once per frame.
///
/// On a screen no denser than [density], or where [offscreenIsCheap] is false,
/// [draw] paints straight to [canvas].
void paintAtDensity(
  Canvas canvas,
  Size size,
  void Function(Canvas canvas) draw, {
  double density = shaderDensity,
  Rect? region,
  bool throughTexture = false,
}) {
  final area = (region ?? Offset.zero & size).intersect(Offset.zero & size);
  if (area.width <= 0 || area.height <= 0) return;
  final views = WidgetsBinding.instance.platformDispatcher.views;
  final deviceRatio = views.isEmpty ? 1.0 : views.first.devicePixelRatio;
  final width = (area.width * density).ceil();
  final height = (area.height * density).ceil();
  if ((deviceRatio <= density && !throughTexture) || !offscreenIsCheap) {
    canvas
      ..save()
      ..clipRect(area);
    draw(canvas);
    canvas.restore();
    return;
  }
  final recorder = ui.PictureRecorder();
  final offscreen = Canvas(recorder)
    ..scale(density)
    ..translate(-area.left, -area.top);
  draw(offscreen);
  final picture = recorder.endRecording();
  final image = picture.toImageSync(width, height);
  picture.dispose();
  canvas.drawImageRect(
    image,
    Rect.fromLTWH(0, 0, width.toDouble(), height.toDouble()),
    Rect.fromLTWH(area.left, area.top, width / density, height / density),
    Paint()..filterQuality = FilterQuality.low,
  );
  image.dispose();
}

/// What [paintAtDensity] drew last for one layer, kept so that while its
/// inputs stay the same (still water, scrolled), it can be drawn again
/// without drawing the shader again.
class HeldPaint {
  ui.Image? _image;
  Rect? _area;
  Object? _inputs;

  /// Releases the kept image.
  void dispose() {
    _image?.dispose();
    _image = null;
    _area = null;
    _inputs = null;
  }
}

bool _covers(Rect outer, Rect inner) =>
    outer.left <= inner.left &&
    outer.top <= inner.top &&
    outer.right >= inner.right &&
    outer.bottom >= inner.bottom;

/// Like [paintAtDensity], keeping what it draws in [hold].
///
/// While [inputs] (everything [draw] depends on) stay the same, a [region]
/// inside the kept area is drawn from the kept image. When the same inputs
/// need a new area, as a scroll over still water does, [margin] more is drawn
/// above and below it, so the frames that follow can reuse it.
void paintAtDensityHeld(
  Canvas canvas,
  Size size,
  void Function(Canvas canvas) draw, {
  required HeldPaint hold,
  required Object inputs,
  double density = shaderDensity,
  Rect? region,
  double margin = 0,
}) {
  final bounds = Offset.zero & size;
  final area = (region ?? bounds).intersect(bounds);
  if (area.width <= 0 || area.height <= 0) return;
  final views = WidgetsBinding.instance.platformDispatcher.views;
  final deviceRatio = views.isEmpty ? 1.0 : views.first.devicePixelRatio;
  if (deviceRatio <= density || !offscreenIsCheap) {
    hold.dispose();
    paintAtDensity(canvas, size, draw, density: density, region: region);
    return;
  }
  final same = hold._inputs == inputs;
  final kept = hold._image;
  final keptArea = hold._area;
  if (same && kept != null && keptArea != null && _covers(keptArea, area)) {
    _drawHeld(canvas, kept, keptArea, density);
    return;
  }
  final drawn =
      (same
              ? Rect.fromLTRB(
                  area.left,
                  area.top - margin,
                  area.right,
                  area.bottom + margin,
                )
              : area)
          .intersect(bounds);
  final width = (drawn.width * density).ceil();
  final height = (drawn.height * density).ceil();
  final recorder = ui.PictureRecorder();
  final offscreen = Canvas(recorder)
    ..scale(density)
    ..translate(-drawn.left, -drawn.top);
  draw(offscreen);
  final picture = recorder.endRecording();
  final image = picture.toImageSync(width, height);
  picture.dispose();
  hold
    ..dispose()
    .._image = image
    .._area = drawn
    .._inputs = inputs;
  _drawHeld(canvas, image, drawn, density);
}

void _drawHeld(Canvas canvas, ui.Image image, Rect area, double density) =>
    canvas.drawImageRect(
      image,
      Rect.fromLTWH(0, 0, image.width.toDouble(), image.height.toDouble()),
      Rect.fromLTWH(
        area.left,
        area.top,
        image.width / density,
        image.height / density,
      ),
      Paint()..filterQuality = FilterQuality.low,
    );

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
