// The backgrounds behind the slides after the shore. Each takes a view from
// the beira-mar and Ceará coast: wind-sculpted sand dunes and interdune
// lagoons in the site's dark green, the seafront horizon, and a photograph of
// the Beira-Mar with its sea in motion.
import 'dart:async';
import 'dart:math' as math;
import 'dart:ui' as ui;

import 'package:flutter/foundation.dart' show ValueListenable;
import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';

import 'density.dart';
import 'hold.dart';
import 'kit.dart' show Gap, SlideFrame, gutter;
import 'shore.dart' show shoreLoop;
import 'theme.dart';
import 'ui/ui.dart';

const _sandLight = Color(0xFFF0E3CB);

/// Mar's darkest green, the wash over the Beira-Mar photo in the video.
const _wash = Color(0xFF0D3D38);

/// The photo slides' wash on wide screens: held dark behind the heading, then
/// eased (smoothstep) down to a lighter green that runs to the foot, with
/// enough stops that no band shows. The photo itself is tinted green too.
final _cityWash = () {
  const hold = 0.24;
  const holdAlpha = 0.66;
  const footAlpha = 0.30;
  final stops = <double>[0, hold];
  final alphas = <double>[0.80, holdAlpha];
  for (var i = 1; i <= 10; i++) {
    final t = i / 10;
    stops.add(hold + (1 - hold) * t);
    alphas.add(holdAlpha + (footAlpha - holdAlpha) * t * t * (3 - 2 * t));
  }
  return (
    stops: stops,
    colors: [for (final a in alphas) _wash.withValues(alpha: a)],
  );
}();

/// Multiplies the Beira-Mar photo, so it reads green throughout while keeping
/// its light and texture; lighter than the dunes' tint, as the photo is darker.
const _cityTint = Color(0xFF6EAFA0);

/// Multiplies the dune scene, so its sand reads as deep green ridges in the
/// photo slides' colours while keeping its light and texture.
const _duneTint = Color(0xFF468C80);
const _sand = Color(0xFFE9DAC0);
const _stillAt = 2.2;

/// How often a moving backdrop updates: thirty times a second. A slow sea
/// needs no more, and the frames in between draw nothing new.
const _backdropFrame = Duration(microseconds: 1000000 ~/ 30);

/// The clock of a wide-layout backdrop: the dunes' wavelets, the horizon's sea
/// and the city's sea.
///
/// A backdrop moves only where drawing it on each update is cheap, the
/// WebAssembly build ([offscreenIsCheap]), which draws it through a texture
/// at one texture pixel per logical pixel on the renderer's own thread, and
/// only while its tickers are enabled: the site rests them while it is off
/// the screen. Elsewhere, under reduced motion and with `?t=` (captures), it
/// is a still picture, drawn once and kept.
mixin _BackdropMotion<T extends StatefulWidget> on State<T> {
  /// The backdrop's seconds per real second.
  double get motionRate => 1;

  final _held = double.tryParse(Uri.base.queryParameters['t'] ?? '');
  late final time = ValueNotifier<double>(_held ?? _stillAt);

  /// Whether the backdrop is drawn live, rather than kept as a still picture.
  var live = false;
  Timer? _timer;
  void Function()? _unlisten;

  @override
  void initState() {
    super.initState();
    if (_held != null) {
      _unlisten = exposeShoreClock((t) => time.value = t % shoreLoop);
    }
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    live =
        _held == null &&
        offscreenIsCheap &&
        !MediaQuery.disableAnimationsOf(context);
    final run = live && TickerMode.valuesOf(context).enabled;
    if (run && _timer == null) {
      final watch = Stopwatch()..start();
      var last = Duration.zero;
      _timer = Timer.periodic(_backdropFrame, (_) {
        final now = watch.elapsed;
        final step = now - last;
        last = now;
        // A longer gap is a rest (a hidden tab): carry on from there.
        if (step < const Duration(milliseconds: 250)) {
          time.value =
              (time.value + step.inMicroseconds / 1e6 * motionRate) % shoreLoop;
        }
      });
    } else if (!run) {
      _timer?.cancel();
      _timer = null;
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    _unlisten?.call();
    time.dispose();
    super.dispose();
  }
}

/// Draws a backdrop: when [live], through a texture at one texture pixel per
/// logical pixel, again on each update; otherwise as [still]'s kept picture.
void _paintBackdrop(
  bool live,
  StillPicture still,
  Canvas canvas,
  Size size,
  Object inputs,
  void Function(Canvas canvas) draw,
) => live
    ? paintAtDensity(canvas, size, draw, throughTexture: true)
    : still.paint(canvas, size, inputs, draw);

/// The fragment shader programs the wide layout's dunes and horizon draw with,
/// once [BackdropPrograms] has loaded them. The narrow layout shows pictures
/// of those backdrops instead (see [BackdropStill]) and never loads them.
class BackdropShaders extends InheritedWidget {
  const BackdropShaders({
    super.key,
    required this.horizon,
    required this.dunes,
    required super.child,
  });

  final ui.FragmentProgram? horizon;
  final ui.FragmentProgram? dunes;

  static BackdropShaders? maybeOf(BuildContext context) =>
      context.dependOnInheritedWidgetOfExactType<BackdropShaders>();

  @override
  bool updateShouldNotify(BackdropShaders old) =>
      old.horizon != horizon || old.dunes != dunes;
}

/// `?shaders=off`: the site draws no shader at all, for comparing its speed
/// with and without them. The shore is still water, the photo a picture,
/// and the dunes and horizon plain gradients.
final shadersOff = Uri.base.queryParameters['shaders'] == 'off';

/// Loads the dunes and horizon shaders, once, for the wide layout.
abstract final class BackdropPrograms {
  /// The loaded programs, or null until [load] completes.
  static final loaded =
      ValueNotifier<({ui.FragmentProgram horizon, ui.FragmentProgram dunes})?>(
        null,
      );

  static Future<void>? _loading;

  static Future<void> load() => shadersOff
      ? Future.value()
      : _loading ??= () async {
          final (horizon, dunes) = await (
            ui.FragmentProgram.fromAsset('shaders/horizon.frag'),
            ui.FragmentProgram.fromAsset('shaders/dunes.frag'),
          ).wait;
          loaded.value = (horizon: horizon, dunes: dunes);
        }();
}

/// A pre-rendered backdrop, from `tool/render_stills_test.dart`: what the
/// narrow layout shows in place of a shader, so a phone draws no shader but
/// the shore's. A new picture, after a change of theme, fades over the last.
class BackdropStill extends StatelessWidget {
  const BackdropStill(
    this.asset, {
    super.key,
    this.alignment = Alignment.center,
  });

  /// The dune lagoons behind the narrow page, in [accent]'s water.
  BackdropStill.dunes(UiAccentColor accent, {Key? key})
    : this('assets/stills/dunes-${accent.name}.webp', key: key);

  /// The Themes section's horizon, in [accent]'s colours.
  BackdropStill.horizon(UiAccentColor accent, {Key? key})
    : this('assets/stills/horizon-${accent.name}.webp', key: key);

  /// The Beira-Mar photo with its sea, cropped as the shader crops it.
  const BackdropStill.city({Key? key})
    : this(
        'assets/stills/city.webp',
        key: key,
        alignment: const Alignment(2 * _cityAlignX - 1, 2 * _cityAlignY - 1),
      );

  final String asset;
  final Alignment alignment;

  @override
  Widget build(BuildContext context) {
    final fade = MediaQuery.disableAnimationsOf(context)
        ? Duration.zero
        : const Duration(milliseconds: 500);
    return AnimatedSwitcher(
      duration: fade,
      layoutBuilder: (current, previous) =>
          Stack(fit: StackFit.expand, children: [...previous, ?current]),
      child: Image.asset(
        asset,
        key: ValueKey(asset),
        fit: BoxFit.cover,
        alignment: alignment,
        filterQuality: FilterQuality.medium,
        gaplessPlayback: true,
        // Nothing until it has loaded, then it fades in.
        frameBuilder: (context, child, frame, synchronous) => AnimatedOpacity(
          opacity: synchronous || frame != null ? 1 : 0,
          duration: fade,
          child: child,
        ),
      ),
    );
  }
}

/// Keeps one lagoon canvas fixed while its foreground sections move.
class SharedSandBackdrop extends StatelessWidget {
  const SharedSandBackdrop({
    super.key,
    this.still = false,
    this.shown,
    required this.child,
  });

  /// Whether a dune slide is on the screen; the dunes move only then. Null
  /// is always.
  final ValueListenable<bool>? shown;

  /// Shows the pre-rendered lagoons ([BackdropStill.dunes]) instead of
  /// drawing them with their shader: the narrow layout's choice.
  final bool still;

  final Widget child;

  @override
  Widget build(BuildContext context) => Stack(
    children: [
      Positioned.fill(
        child: still
            ? ValueListenableBuilder(
                valueListenable: siteAccent,
                builder: (context, accent, _) => Stack(
                  fit: StackFit.expand,
                  children: [BackdropStill.dunes(accent), const _DuneWash()],
                ),
              )
            : switch (shown) {
                final shown? => ValueListenableBuilder(
                  valueListenable: shown,
                  builder: (context, on, dunes) =>
                      TickerMode(enabled: on, child: dunes!),
                  child: SandBackdrop(scene: 2),
                ),
                null => SandBackdrop(scene: 2),
              },
      ),
      _SharedSandScope(child: child),
    ],
  );
}

/// The dark green wash over the dunes, strongest behind the headings' white
/// text, then clear by the foot so the dunes show.
class _DuneWash extends StatelessWidget {
  const _DuneWash();

  @override
  Widget build(BuildContext context) => DecoratedBox(
    decoration: BoxDecoration(
      gradient: LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [
          for (final a in const [0.80, 0.62, 0.10, 0.0])
            _wash.withValues(alpha: a),
        ],
        stops: const [0, 0.25, 0.38, 0.62],
      ),
    ),
  );
}

class _SharedSandScope extends InheritedWidget {
  const _SharedSandScope({required super.child});

  @override
  bool updateShouldNotify(_SharedSandScope oldWidget) => false;
}

/// Wind-sculpted Ceará sand dunes (`scene` 0–1) and interdune emerald lagoons
/// (`scene` 2–3, or `shore: true`).
class SandBackdrop extends StatelessWidget {
  const SandBackdrop({super.key, this.shore = false, this.scene, this.program});

  final bool shore;
  final double? scene;

  final ui.FragmentProgram? program;

  @override
  Widget build(BuildContext context) {
    if (context.dependOnInheritedWidgetOfExactType<_SharedSandScope>() !=
        null) {
      return const SizedBox.expand();
    }
    final dunesProgram = program ?? BackdropShaders.maybeOf(context)?.dunes;
    if (dunesProgram == null) {
      return CustomPaint(painter: _SandPainter(shore), size: Size.infinite);
    }
    final water = tokenColor(context, UiTokens.accent9);
    final deepWater = tokenColor(context, UiTokens.accent11);
    return Stack(
      fit: StackFit.expand,
      children: [
        TweenAnimationBuilder<(Color, Color)>(
          tween: _WaterTween(end: (water, deepWater)),
          duration: MediaQuery.disableAnimationsOf(context)
              ? Duration.zero
              : const Duration(milliseconds: 500),
          curve: Curves.easeInOut,
          builder: (context, colors, _) => _DuneField(
            program: dunesProgram,
            scene: scene ?? (shore ? 3.0 : 0.0),
            water: colors.$1,
            deepWater: colors.$2,
          ),
        ),
        const _DuneWash(),
      ],
    );
  }
}

class _WaterTween extends Tween<(Color, Color)> {
  _WaterTween({super.end});

  @override
  (Color, Color) lerp(double t) =>
      (Color.lerp(begin!.$1, end!.$1, t)!, Color.lerp(begin!.$2, end!.$2, t)!);
}

class _SandPainter extends CustomPainter {
  const _SandPainter(this.shore);

  final bool shore;

  @override
  void paint(Canvas canvas, Size size) {
    final all = Offset.zero & size;
    canvas.drawRect(
      all,
      Paint()
        ..shader = const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [_sandLight, _sand],
        ).createShader(all),
    );
    if (!shore) return;
    // The water's edge: wet sand, a soft curve of foam, then the shallows.
    final top = size.height * 0.885;
    Path edge(double lift) {
      final path = Path()..moveTo(0, size.height);
      path.lineTo(0, top + lift);
      for (var i = 0; i <= 48; i++) {
        final x = size.width * i / 48;
        final wave =
            math.sin(i * 0.42) * 0.004 + math.sin(i * 0.17 + 1.3) * 0.009;
        path.lineTo(x, top + lift + size.height * wave);
      }
      return path
        ..lineTo(size.width, size.height)
        ..close();
    }

    canvas.drawPath(edge(-10), Paint()..color = const Color(0x33B9A98C));
    canvas.drawPath(edge(0), Paint()..color = const Color(0xFFF6FCFA));
    canvas.drawPath(
      edge(9),
      Paint()
        ..shader = const LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [Color(0xFF7FD9CB), Color(0xFF1FA493)],
        ).createShader(Rect.fromLTRB(0, top, size.width, size.height)),
    );
  }

  @override
  bool shouldRepaint(_SandPainter old) => old.shore != shore;
}

class _DuneField extends StatefulWidget {
  const _DuneField({
    required this.program,
    required this.scene,
    required this.water,
    required this.deepWater,
  });

  final ui.FragmentProgram program;
  final double scene;
  final Color water;
  final Color deepWater;

  @override
  State<_DuneField> createState() => _DuneFieldState();
}

class _DuneFieldState extends State<_DuneField>
    with _BackdropMotion<_DuneField> {
  // Slow the shader's wind ripples and lagoon wavelets together; the camera,
  // banks and large dune shapes stay anchored.
  @override
  double get motionRate => 0.8;
  late final _shader = widget.program.fragmentShader();
  final _still = StillPicture();

  @override
  void dispose() {
    _still.dispose();
    _shader.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => RepaintBoundary(
    child: CustomPaint(
      painter: _DunesShaderPainter(
        shader: _shader,
        still: _still,
        live: live,
        time: time,
        scene: widget.scene,
        water: widget.water,
        deepWater: widget.deepWater,
      ),
      size: Size.infinite,
    ),
  );
}

class _DunesShaderPainter extends CustomPainter {
  _DunesShaderPainter({
    required this.shader,
    required this.still,
    required this.live,
    required this.time,
    required this.scene,
    required this.water,
    required this.deepWater,
  }) : super(repaint: time);

  final ui.FragmentShader shader;
  final StillPicture still;
  final bool live;
  final ValueNotifier<double> time;
  final double scene;
  final Color water;
  final Color deepWater;

  @override
  void paint(Canvas canvas, Size size) {
    final t = time.value;
    _paintBackdrop(
      live,
      still,
      canvas,
      size,
      (t, scene, water, deepWater),
      (canvas) => drawDunes(
        canvas,
        size,
        shader,
        time: t,
        scene: scene,
        water: water,
        deepWater: deepWater,
      ),
    );
  }

  @override
  bool shouldRepaint(_DunesShaderPainter old) =>
      old.shader != shader ||
      old.live != live ||
      old.scene != scene ||
      old.water != water ||
      old.deepWater != deepWater;
}

/// The horizon from the seafront, in a theme's own colours: a hazy sky with
/// trade-wind clouds and a perspective ocean beneath.
class HorizonBackdrop extends StatelessWidget {
  const HorizonBackdrop({
    super.key,
    required this.sky,
    required this.haze,
    required this.sea,
    required this.deep,
    this.program,
    this.still,
  });

  final Color sky;
  final Color haze;
  final Color sea;
  final Color deep;
  final ui.FragmentProgram? program;

  /// Shows the pre-rendered horizon of this accent ([BackdropStill.horizon])
  /// over a plain gradient of the colours, instead of drawing the shader.
  final UiAccentColor? still;

  @override
  Widget build(BuildContext context) {
    final still = this.still;
    if (still != null) {
      return Stack(
        fit: StackFit.expand,
        children: [
          CustomPaint(painter: _HorizonPainter((sky, haze, sea, deep))),
          BackdropStill.horizon(still),
        ],
      );
    }
    final horizonProgram = program ?? BackdropShaders.maybeOf(context)?.horizon;
    return TweenAnimationBuilder(
      // A change of theme washes across the view.
      tween: _HorizonTween(end: (sky, haze, sea, deep)),
      duration: MediaQuery.disableAnimationsOf(context)
          ? Duration.zero
          : const Duration(milliseconds: 500),
      curve: Curves.easeInOut,
      builder: (context, colors, _) => horizonProgram != null
          ? _HorizonSea(program: horizonProgram, colors: colors, mode: 0)
          : CustomPaint(painter: _HorizonPainter(colors), size: Size.infinite),
    );
  }
}

typedef _Horizon = (Color, Color, Color, Color);

class _HorizonTween extends Tween<_Horizon> {
  _HorizonTween({super.end});

  @override
  _Horizon lerp(double t) => (
    Color.lerp(begin!.$1, end!.$1, t)!,
    Color.lerp(begin!.$2, end!.$2, t)!,
    Color.lerp(begin!.$3, end!.$3, t)!,
    Color.lerp(begin!.$4, end!.$4, t)!,
  );
}

class _HorizonPainter extends CustomPainter {
  const _HorizonPainter(this.colors);

  final _Horizon colors;

  @override
  void paint(Canvas canvas, Size size) {
    final (sky, haze, sea, deep) = colors;
    final line = size.height * 0.74;
    final above = Rect.fromLTRB(0, 0, size.width, line);
    final below = Rect.fromLTRB(0, line, size.width, size.height);
    canvas.drawRect(
      above,
      Paint()
        ..shader = LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [sky, haze],
        ).createShader(above),
    );
    final sun = Offset(size.width * 0.88, size.height * 0.14);
    final glow = size.height * 0.46;
    canvas.drawCircle(
      sun,
      glow,
      Paint()
        ..shader = const RadialGradient(
          colors: [Color(0xCCFFFFFF), Color(0x00FFFFFF)],
        ).createShader(Rect.fromCircle(center: sun, radius: glow)),
    );
    canvas.drawRect(
      below,
      Paint()
        ..shader = LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [sea, deep],
        ).createShader(below),
    );
  }

  @override
  bool shouldRepaint(_HorizonPainter old) => old.colors != colors;
}

class _HorizonSea extends StatefulWidget {
  const _HorizonSea({
    required this.program,
    required this.colors,
    required this.mode,
  });

  final ui.FragmentProgram program;
  final _Horizon colors;
  final double mode;

  @override
  State<_HorizonSea> createState() => _HorizonSeaState();
}

class _HorizonSeaState extends State<_HorizonSea>
    with _BackdropMotion<_HorizonSea> {
  late final _shader = widget.program.fragmentShader();
  final _still = StillPicture();

  @override
  void dispose() {
    _still.dispose();
    _shader.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => RepaintBoundary(
    child: CustomPaint(
      painter: _HorizonShaderPainter(
        shader: _shader,
        still: _still,
        live: live,
        time: time,
        colors: widget.colors,
        mode: widget.mode,
      ),
      size: Size.infinite,
    ),
  );
}

class _HorizonShaderPainter extends CustomPainter {
  _HorizonShaderPainter({
    required this.shader,
    required this.still,
    required this.live,
    required this.time,
    required this.colors,
    required this.mode,
  }) : super(repaint: time);

  final ui.FragmentShader shader;
  final StillPicture still;
  final bool live;
  final ValueNotifier<double> time;
  final _Horizon colors;
  final double mode;

  @override
  void paint(Canvas canvas, Size size) {
    final t = time.value;
    _paintBackdrop(
      live,
      still,
      canvas,
      size,
      (t, mode, colors),
      (canvas) => drawHorizon(
        canvas,
        size,
        shader,
        time: t,
        mode: mode,
        sky: colors.$1,
        haze: colors.$2,
        sea: colors.$3,
        deep: colors.$4,
      ),
    );
  }

  @override
  bool shouldRepaint(_HorizonShaderPainter old) =>
      old.shader != shader ||
      old.live != live ||
      old.colors != colors ||
      old.mode != mode;
}

/// The Beira-Mar photograph, a mask of its water, and the shader that moves
/// that water. Loaded once, after the first frame, and shared by both layouts.
class CityPhoto {
  const CityPhoto(this.program, this.photo, this.sea);

  final ui.FragmentProgram program;
  final ui.Image photo;
  final ui.Image sea;

  /// “Fortaleza, Brazil (6)”, ME/Portal da Copa, CC BY 3.0 BR; see
  /// `assets/photos/CREDIT.md`.
  static const photoAsset = 'assets/photos/fortaleza-beira-mar.jpg';
  static const seaAsset = 'assets/photos/fortaleza-beira-mar-sea.png';

  /// The credit the licence asks for, shown wherever the photo is.
  static const credit =
      'Photo: “Fortaleza, Brazil (6)”, ME/Portal da Copa, CC BY 3.0 BR. '
      'Cropped, tinted green, water animated.';

  static Future<CityPhoto>? _loading;

  static Future<CityPhoto> load() => _loading ??= () async {
    final (program, photo, sea) = await (
      ui.FragmentProgram.fromAsset('shaders/city.frag'),
      _decode(photoAsset),
      _decode(seaAsset),
    ).wait;
    return CityPhoto(program, photo, sea);
  }();

  static Future<ui.Image> _decode(String asset) async {
    final data = await rootBundle.load(asset);
    final codec = await ui.instantiateImageCodec(data.buffer.asUint8List());
    final frame = await codec.getNextFrame();
    codec.dispose();
    return frame.image;
  }
}

/// Keeps one Beira-Mar photo, and its credit, fixed behind the closing slides
/// while their content moves, as [SharedSandBackdrop] does for the dunes.
/// [shown] is whether those slides are on screen; [CityBackdrop]s inside draw
/// nothing of their own.
class SharedCityBackdrop extends StatelessWidget {
  const SharedCityBackdrop({
    super.key,
    required this.shown,
    this.warming,
    this.photo,
    required this.child,
  });

  final ValueListenable<bool> shown;

  /// While true and not [shown], the photo is drawn unseen, so that showing
  /// it later does not start with a slow frame.
  final ValueListenable<bool>? warming;

  /// Supplied by tests; otherwise [CityPhoto.load] provides it.
  final CityPhoto? photo;
  final Widget child;

  @override
  Widget build(BuildContext context) => Stack(
    children: [
      Positioned.fill(
        child: ListenableBuilder(
          listenable: Listenable.merge([shown, warming]),
          builder: (context, layer) {
            final visible = shown.value;
            final unseen = !visible && (warming?.value ?? false);
            return Offstage(
              offstage: !visible && !unseen,
              // Its sea moves only while the photo slides are on the screen.
              child: TickerMode(
                enabled: visible,
                child: Opacity(opacity: unseen ? 1 / 255 : 1, child: layer),
              ),
            );
          },
          child: SlideFrame(
            backdrop: shadersOff
                ? const _CityStill()
                : _CityField(compact: false, photo: photo),
            child: const Stack(
              children: [
                Positioned(right: gutter, bottom: Gap.x4, child: CityCredit()),
              ],
            ),
          ),
        ),
      ),
      _SharedCityScope(child: child),
    ],
  );
}

class _SharedCityScope extends InheritedWidget {
  const _SharedCityScope({required super.child});

  @override
  bool updateShouldNotify(_SharedCityScope oldWidget) => false;
}

/// The credit the photo's licence asks for, wherever the photo shows.
class CityCredit extends StatelessWidget {
  const CityCredit({super.key});

  // On a green tab, so it reads over the clear sand at the foot.
  @override
  Widget build(BuildContext context) => DecoratedBox(
    decoration: BoxDecoration(
      color: _wash.withValues(alpha: 0.72),
      borderRadius: BorderRadius.circular(Gap.x1),
    ),
    child: const Padding(
      padding: EdgeInsets.symmetric(horizontal: Gap.x2, vertical: Gap.x1),
      child: Text(
        CityPhoto.credit,
        style: TextStyle(fontSize: 12, height: 1.4, color: Color(0xEBFFFFFF)),
      ),
    ),
  );
}

/// The Beira-Mar from the air behind the closing slides, under the dark green
/// wash the presentation's Fortal scene puts over the same photo. Only its sea
/// moves. Green shows until the photo has loaded, then the photo fades in.
class CityBackdrop extends StatelessWidget {
  const CityBackdrop({super.key, this.compact = false, this.photo});

  /// The narrow layout's taller, stacked section: the pre-rendered photo
  /// under a fuller wash, since its text sits over more of it.
  final bool compact;

  /// Supplied by tests; otherwise [CityPhoto.load] provides it.
  final CityPhoto? photo;

  @override
  Widget build(BuildContext context) {
    if (context.dependOnInheritedWidgetOfExactType<_SharedCityScope>() !=
        null) {
      return const SizedBox.expand();
    }
    // The narrow layout shows a picture of it, and loads no shader.
    if (compact || shadersOff) return const _CityStill();
    return _CityField(compact: compact, photo: photo);
  }
}

/// The narrow layout's Beira-Mar: the pre-rendered photo
/// ([BackdropStill.city]) under the same washes as [_CityField]'s.
class _CityStill extends StatelessWidget {
  const _CityStill();

  @override
  Widget build(BuildContext context) => Stack(
    fit: StackFit.expand,
    children: [
      const ColoredBox(color: _wash),
      const BackdropStill.city(),
      DecoratedBox(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              for (final a in const [0.80, 0.62, 0.55])
                _wash.withValues(alpha: a),
            ],
            stops: const [0, 0.2, 1],
          ),
        ),
      ),
    ],
  );
}

class _CityField extends StatefulWidget {
  const _CityField({required this.compact, required this.photo});

  final bool compact;
  final CityPhoto? photo;

  @override
  State<_CityField> createState() => _CityFieldState();
}

class _CityFieldState extends State<_CityField>
    with _BackdropMotion<_CityField> {
  // A still picture, like the dunes: the photo, tinted and cropped once; on
  // the WebAssembly build its sea moves.
  CityPhoto? _photo;
  ui.FragmentShader? _shader;
  final _still = StillPicture();

  @override
  void initState() {
    super.initState();
    final given = widget.photo;
    if (given != null) {
      _adopt(given);
    } else {
      CityPhoto.load().then(
        (photo) {
          if (!mounted) return;
          setState(() => _adopt(photo));
        },
        onError: (Object error, StackTrace stack) => FlutterError.reportError(
          FlutterErrorDetails(
            exception: error,
            stack: stack,
            library: 'fortal_landing',
            context: ErrorDescription('loading the Beira-Mar photo'),
          ),
        ),
      );
    }
  }

  void _adopt(CityPhoto photo) {
    _photo = photo;
    _shader = photo.program.fragmentShader();
  }

  @override
  void dispose() {
    _still.dispose();
    _shader?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final photo = _photo;
    final shader = _shader;
    return Stack(
      fit: StackFit.expand,
      children: [
        const ColoredBox(color: _wash),
        if (photo != null && shader != null)
          TweenAnimationBuilder<double>(
            tween: Tween(begin: 0, end: 1),
            duration: MediaQuery.disableAnimationsOf(context)
                ? Duration.zero
                : const Duration(milliseconds: 600),
            builder: (context, shown, child) =>
                Opacity(opacity: shown, child: child),
            child: RepaintBoundary(
              child: CustomPaint(
                painter: _CityShaderPainter(
                  shader: shader,
                  still: _still,
                  live: live,
                  photo: photo,
                  time: time,
                  align: _cityAlign,
                ),
                size: Size.infinite,
              ),
            ),
          ),
        // The dark green wash of the presentation's Fortal scene (Mar's
        // darkest green): darkest behind the heading's white text, then a
        // lighter green that fills the photo to the foot.
        DecoratedBox(
          decoration: BoxDecoration(
            gradient: widget.compact
                ? LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      for (final a in const [0.80, 0.62, 0.55])
                        _wash.withValues(alpha: a),
                    ],
                    stops: const [0, 0.2, 1],
                  )
                : LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: _cityWash.colors,
                    stops: _cityWash.stops,
                  ),
          ),
        ),
        // A little more behind the heading, as the video's sideways gradient
        // sits behind its title.
        if (!widget.compact)
          DecoratedBox(
            decoration: BoxDecoration(
              gradient: RadialGradient(
                center: Alignment.topLeft,
                radius: 0.75,
                colors: [
                  _wash.withValues(alpha: 0.30),
                  _wash.withValues(alpha: 0.12),
                  _wash.withValues(alpha: 0),
                ],
                stops: const [0, 0.5, 1],
              ),
            ),
          ),
      ],
    );
  }
}

class _CityShaderPainter extends CustomPainter {
  _CityShaderPainter({
    required this.shader,
    required this.still,
    required this.live,
    required this.photo,
    required this.time,
    required this.align,
  }) : super(repaint: time);

  final ui.FragmentShader shader;
  final StillPicture still;
  final bool live;
  final CityPhoto photo;
  final ValueNotifier<double> time;
  final Offset align;

  @override
  void paint(Canvas canvas, Size size) {
    final t = time.value;
    _paintBackdrop(
      live,
      still,
      canvas,
      size,
      (t, photo, align),
      (canvas) =>
          drawCity(canvas, size, shader, time: t, photo: photo, align: align),
    );
  }

  @override
  bool shouldRepaint(_CityShaderPainter old) =>
      old.shader != shader ||
      old.live != live ||
      old.photo != photo ||
      old.align != align;
}

/// Where the Beira-Mar photo is cropped from when the frame is narrower than
/// it: keeps the bay in view when a tall screen crops the sides.
const _cityAlignX = 0.3, _cityAlignY = 0.5;
const _cityAlign = Offset(_cityAlignX, _cityAlignY);

/// The moment the still backdrops show; `?t=` changes it, for captures.
const stillTime = _stillAt;

void _setRgb(ui.FragmentShader shader, String name, Color color) {
  shader.getUniformFloat(name, 0).set(color.r);
  shader.getUniformFloat(name, 1).set(color.g);
  shader.getUniformFloat(name, 2).set(color.b);
}

/// Draws the dune scene from `shaders/dunes.frag` over [size]. The live
/// backdrop and the narrow layout's pictures of it both come from here.
void drawDunes(
  Canvas canvas,
  Size size,
  ui.FragmentShader shader, {
  required double time,
  required double scene,
  required Color water,
  required Color deepWater,
}) {
  shader.getUniformFloat('uSize', 0).set(size.width);
  shader.getUniformFloat('uSize', 1).set(size.height);
  shader.getUniformFloat('uTime').set(time);
  shader.getUniformFloat('uScene').set(scene);
  _setRgb(shader, 'uWater', water);
  _setRgb(shader, 'uDeepWater', deepWater);
  _setRgb(shader, 'uTint', _duneTint);
  canvas.drawRect(Offset.zero & size, Paint()..shader = shader);
}

/// Draws the horizon from `shaders/horizon.frag` over [size].
void drawHorizon(
  Canvas canvas,
  Size size,
  ui.FragmentShader shader, {
  required double time,
  required double mode,
  required Color sky,
  required Color haze,
  required Color sea,
  required Color deep,
}) {
  shader.getUniformFloat('uSize', 0).set(size.width);
  shader.getUniformFloat('uSize', 1).set(size.height);
  shader.getUniformFloat('uTime').set(time);
  shader.getUniformFloat('uMode').set(mode);
  _setRgb(shader, 'uSky', sky);
  _setRgb(shader, 'uHaze', haze);
  _setRgb(shader, 'uSea', sea);
  _setRgb(shader, 'uDeep', deep);
  canvas.drawRect(Offset.zero & size, Paint()..shader = shader);
}

/// Draws the Beira-Mar photo through `shaders/city.frag` over [size]:
/// cover-cropped at [align], tinted green, its sea moved to [time].
void drawCity(
  Canvas canvas,
  Size size,
  ui.FragmentShader shader, {
  required double time,
  required CityPhoto photo,
  Offset align = _cityAlign,
}) {
  shader.getUniformFloat('uSize', 0).set(size.width);
  shader.getUniformFloat('uSize', 1).set(size.height);
  shader.getUniformFloat('uTime').set(time);
  shader.getUniformFloat('uImage', 0).set(photo.photo.width.toDouble());
  shader.getUniformFloat('uImage', 1).set(photo.photo.height.toDouble());
  shader.getUniformFloat('uAlign', 0).set(align.dx);
  shader.getUniformFloat('uAlign', 1).set(align.dy);
  shader.getUniformFloat('uTint', 0).set(_cityTint.r);
  shader.getUniformFloat('uTint', 1).set(_cityTint.g);
  shader.getUniformFloat('uTint', 2).set(_cityTint.b);
  // Samplers in the shader's order. Smooth sampling: the default, nearest,
  // would show the photo's pixels.
  shader.setImageSampler(0, photo.photo, filterQuality: FilterQuality.medium);
  shader.setImageSampler(1, photo.sea, filterQuality: FilterQuality.low);
  canvas.drawRect(Offset.zero & size, Paint()..shader = shader);
}
