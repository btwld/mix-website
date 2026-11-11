// The backgrounds behind the slides after the shore. Each takes a view from
// the beira-mar and Ceará coast: wind-sculpted sand dunes, interdune lagoons,
// the seafront horizon, the sea after dark, and a photograph of the Beira-Mar
// with its sea in motion.
import 'dart:math' as math;
import 'dart:ui' as ui;

import 'package:flutter/foundation.dart' show ValueListenable;
import 'package:flutter/scheduler.dart';
import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';

import 'hold.dart';
import 'kit.dart' show Gap, SlideFrame, gutter;
import 'shore.dart' show shoreLoop;
import 'theme.dart';
import 'ui/ui.dart';

const _sandLight = Color(0xFFF0E3CB);

/// Mar's darkest green, the wash over the Beira-Mar photo in the video.
const _wash = Color(0xFF0D3D38);
const _sand = Color(0xFFE9DAC0);
const _stillAt = 2.2;

/// Preloaded fragment shader programs shared with slide backdrops.
class BackdropShaders extends InheritedWidget {
  const BackdropShaders({
    super.key,
    required this.horizon,
    required this.dunes,
    required super.child,
  });

  final ui.FragmentProgram horizon;
  final ui.FragmentProgram dunes;

  static BackdropShaders? maybeOf(BuildContext context) =>
      context.dependOnInheritedWidgetOfExactType<BackdropShaders>();

  @override
  bool updateShouldNotify(BackdropShaders old) =>
      old.horizon != horizon || old.dunes != dunes;
}

/// Keeps one lagoon canvas fixed while its foreground sections move.
class SharedSandBackdrop extends StatelessWidget {
  const SharedSandBackdrop({
    super.key,
    this.active = true,
    required this.child,
  });

  final bool active;
  final Widget child;

  @override
  Widget build(BuildContext context) => Stack(
    children: [
      Positioned.fill(child: SandBackdrop(scene: 2, active: active)),
      _SharedSandScope(child: child),
    ],
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
  const SandBackdrop({
    super.key,
    this.shore = false,
    this.scene,
    this.active = true,
    this.program,
  });

  final bool shore;
  final double? scene;
  final bool active;
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
            active: active,
          ),
        ),
        // Beige reading fade: as strong as before behind the headings, then
        // it clears quickly so the scenery below stays crisp.
        const DecoratedBox(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [
                Color(0xE6F0E3CB),
                Color(0xB8F0E3CB),
                Color(0x3DF0E3CB),
                Color(0x14F0E3CB),
              ],
              stops: [0, 0.24, 0.46, 1],
            ),
          ),
        ),
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
    required this.active,
  });

  final ui.FragmentProgram program;
  final double scene;
  final Color water;
  final Color deepWater;
  final bool active;

  @override
  State<_DuneField> createState() => _DuneFieldState();
}

class _DuneFieldState extends State<_DuneField>
    with SingleTickerProviderStateMixin {
  // Slow the shader's existing wind ripples and lagoon wavelets together;
  // camera, banks and large dune shapes stay anchored between sections.
  static const _motionRate = 0.80;
  final _time = ValueNotifier<double>(_stillAt);
  var _before = _stillAt;
  late final Ticker _ticker = createTicker(
    (elapsed) => _time.value =
        (_before + elapsed.inMicroseconds / 1e6 * _motionRate) % shoreLoop,
  );
  late final _shader = widget.program.fragmentShader();
  final _held = double.tryParse(Uri.base.queryParameters['t'] ?? '');
  void Function()? _unlisten;

  @override
  void initState() {
    super.initState();
    if (_held != null) {
      _unlisten = exposeShoreClock((t) => _time.value = t % shoreLoop);
    }
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _run();
  }

  @override
  void didUpdateWidget(_DuneField old) {
    super.didUpdateWidget(old);
    _run();
  }

  void _run() {
    final still =
        _held ?? (MediaQuery.disableAnimationsOf(context) ? _stillAt : null);
    if (still != null) {
      _ticker.stop();
      _time.value = still;
      _before = still;
    } else if (widget.active && !_ticker.isActive) {
      _ticker.start();
    } else if (!widget.active && _ticker.isActive) {
      _before = _time.value;
      _ticker.stop();
    }
  }

  @override
  void dispose() {
    _unlisten?.call();
    _ticker.dispose();
    _time.dispose();
    _shader.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => RepaintBoundary(
    child: CustomPaint(
      painter: _DunesShaderPainter(
        shader: _shader,
        time: _time,
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
    required this.time,
    required this.scene,
    required this.water,
    required this.deepWater,
  }) : super(repaint: time);

  final ui.FragmentShader shader;
  final ValueNotifier<double> time;
  final double scene;
  final Color water;
  final Color deepWater;

  static void _setRgb(ui.FragmentShader shader, String name, Color color) {
    shader.getUniformFloat(name, 0).set(color.r);
    shader.getUniformFloat(name, 1).set(color.g);
    shader.getUniformFloat(name, 2).set(color.b);
  }

  @override
  void paint(Canvas canvas, Size size) {
    shader.getUniformFloat('uSize', 0).set(size.width);
    shader.getUniformFloat('uSize', 1).set(size.height);
    shader.getUniformFloat('uTime').set(time.value);
    shader.getUniformFloat('uScene').set(scene);
    _setRgb(shader, 'uWater', water);
    _setRgb(shader, 'uDeepWater', deepWater);
    canvas.drawRect(Offset.zero & size, Paint()..shader = shader);
  }

  @override
  bool shouldRepaint(_DunesShaderPainter old) =>
      old.shader != shader ||
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
    this.active = true,
  });

  final Color sky;
  final Color haze;
  final Color sea;
  final Color deep;
  final ui.FragmentProgram? program;
  final bool active;

  @override
  Widget build(BuildContext context) {
    final horizonProgram = program ?? BackdropShaders.maybeOf(context)?.horizon;
    return TweenAnimationBuilder(
      // A change of theme washes across the view.
      tween: _HorizonTween(end: (sky, haze, sea, deep)),
      duration: MediaQuery.disableAnimationsOf(context)
          ? Duration.zero
          : const Duration(milliseconds: 500),
      curve: Curves.easeInOut,
      builder: (context, colors, _) => horizonProgram != null
          ? _HorizonSea(
              program: horizonProgram,
              colors: colors,
              mode: 0,
              active: active,
            )
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

/// The sea after dark, with moonlit swells and horizon mist.
class NightSeaBackdrop extends StatelessWidget {
  const NightSeaBackdrop({super.key, this.program, this.active = true});

  final ui.FragmentProgram? program;
  final bool active;

  static const _nightColors = (
    Color(0xFF041C19),
    Color(0xFF083530),
    Color(0xFF0C4E45),
    Color(0xFF052420),
  );

  @override
  Widget build(BuildContext context) {
    final horizonProgram = program ?? BackdropShaders.maybeOf(context)?.horizon;
    return horizonProgram != null
        ? _HorizonSea(
            program: horizonProgram,
            colors: _nightColors,
            mode: 1,
            active: active,
          )
        : const CustomPaint(painter: _NightSeaPainter(), size: Size.infinite);
  }
}

class _NightSeaPainter extends CustomPainter {
  const _NightSeaPainter();

  @override
  void paint(Canvas canvas, Size size) {
    final all = Offset.zero & size;
    canvas.drawRect(
      all,
      Paint()
        ..shader = const LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [Color(0xFF041F1C), Color(0xFF07352F), Color(0xFF0B4A42)],
        ).createShader(all),
    );
    final line = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.4;
    for (var row = 0; row < 9; row++) {
      final y = size.height * (0.50 + row * 0.058);
      final path = Path()..moveTo(0, y);
      for (var i = 1; i <= 64; i++) {
        final x = size.width * i / 64;
        path.lineTo(
          x,
          y +
              math.sin(i * 0.33 + row * 1.7) * 7 +
              math.sin(i * 0.11 + row * 0.6) * 12,
        );
      }
      line.color = Color.fromRGBO(143, 227, 214, 0.05 + row * 0.012);
      canvas.drawPath(path, line);
    }
  }

  @override
  bool shouldRepaint(_NightSeaPainter old) => false;
}

class _HorizonSea extends StatefulWidget {
  const _HorizonSea({
    required this.program,
    required this.colors,
    required this.mode,
    required this.active,
  });

  final ui.FragmentProgram program;
  final _Horizon colors;
  final double mode;
  final bool active;

  @override
  State<_HorizonSea> createState() => _HorizonSeaState();
}

class _HorizonSeaState extends State<_HorizonSea>
    with SingleTickerProviderStateMixin {
  final _time = ValueNotifier<double>(0);
  var _before = Duration.zero;
  late final Ticker _ticker = createTicker(
    (elapsed) =>
        _time.value = (_before + elapsed).inMicroseconds / 1e6 % shoreLoop,
  );
  late final _shader = widget.program.fragmentShader();
  final _held = double.tryParse(Uri.base.queryParameters['t'] ?? '');
  void Function()? _unlisten;

  @override
  void initState() {
    super.initState();
    if (_held != null) {
      _unlisten = exposeShoreClock((t) => _time.value = t % shoreLoop);
    }
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _run();
  }

  @override
  void didUpdateWidget(_HorizonSea old) {
    super.didUpdateWidget(old);
    _run();
  }

  void _run() {
    final still =
        _held ?? (MediaQuery.disableAnimationsOf(context) ? _stillAt : null);
    if (still != null) {
      _ticker.stop();
      _time.value = still;
    } else if (widget.active && !_ticker.isActive) {
      _ticker.start();
    } else if (!widget.active && _ticker.isActive) {
      _before = Duration(microseconds: (_time.value * 1e6).round());
      _ticker.stop();
    }
  }

  @override
  void dispose() {
    _unlisten?.call();
    _ticker.dispose();
    _time.dispose();
    _shader.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => RepaintBoundary(
    child: CustomPaint(
      painter: _HorizonShaderPainter(
        shader: _shader,
        time: _time,
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
    required this.time,
    required this.colors,
    required this.mode,
  }) : super(repaint: time);

  final ui.FragmentShader shader;
  final ValueNotifier<double> time;
  final _Horizon colors;
  final double mode;

  static void _setRgb(ui.FragmentShader shader, String name, Color color) {
    shader.getUniformFloat(name, 0).set(color.r);
    shader.getUniformFloat(name, 1).set(color.g);
    shader.getUniformFloat(name, 2).set(color.b);
  }

  @override
  void paint(Canvas canvas, Size size) {
    shader.getUniformFloat('uSize', 0).set(size.width);
    shader.getUniformFloat('uSize', 1).set(size.height);
    shader.getUniformFloat('uTime').set(time.value);
    shader.getUniformFloat('uMode').set(mode);
    _setRgb(shader, 'uSky', colors.$1);
    _setRgb(shader, 'uHaze', colors.$2);
    _setRgb(shader, 'uSea', colors.$3);
    _setRgb(shader, 'uDeep', colors.$4);
    canvas.drawRect(Offset.zero & size, Paint()..shader = shader);
  }

  @override
  bool shouldRepaint(_HorizonShaderPainter old) =>
      old.shader != shader || old.colors != colors || old.mode != mode;
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
    this.active = true,
    this.photo,
    required this.child,
  });

  final ValueListenable<bool> shown;
  final bool active;

  /// Supplied by tests; otherwise [CityPhoto.load] provides it.
  final CityPhoto? photo;
  final Widget child;

  @override
  Widget build(BuildContext context) => Stack(
    children: [
      Positioned.fill(
        child: ValueListenableBuilder(
          valueListenable: shown,
          builder: (context, shown, layer) =>
              Offstage(offstage: !shown, child: layer),
          child: SlideFrame(
            backdrop: _CityField(active: active, compact: false, photo: photo),
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

  @override
  Widget build(BuildContext context) => const Text(
    CityPhoto.credit,
    style: TextStyle(fontSize: 12, height: 1.4, color: Color(0xD9FFFFFF)),
  );
}

/// The Beira-Mar from the air behind the closing slides, under the dark green
/// wash the presentation's Fortal scene puts over the same photo. Only its sea
/// moves. Green shows until the photo has loaded, then the photo fades in.
class CityBackdrop extends StatelessWidget {
  const CityBackdrop({
    super.key,
    this.active = true,
    this.compact = false,
    this.photo,
  });

  final bool active;

  /// The narrow layout's taller, stacked section: a fuller wash, since its
  /// text sits over more of the photo.
  final bool compact;

  /// Supplied by tests; otherwise [CityPhoto.load] provides it.
  final CityPhoto? photo;

  @override
  Widget build(BuildContext context) {
    if (context.dependOnInheritedWidgetOfExactType<_SharedCityScope>() !=
        null) {
      return const SizedBox.expand();
    }
    return _CityField(active: active, compact: compact, photo: photo);
  }
}

class _CityField extends StatefulWidget {
  const _CityField({
    required this.active,
    required this.compact,
    required this.photo,
  });

  final bool active;
  final bool compact;
  final CityPhoto? photo;

  @override
  State<_CityField> createState() => _CityFieldState();
}

class _CityFieldState extends State<_CityField>
    with SingleTickerProviderStateMixin {
  CityPhoto? _photo;
  ui.FragmentShader? _shader;
  final _time = ValueNotifier<double>(_stillAt);
  var _before = _stillAt;
  late final Ticker _ticker = createTicker(
    (elapsed) =>
        _time.value = (_before + elapsed.inMicroseconds / 1e6) % shoreLoop,
  );
  final _held = double.tryParse(Uri.base.queryParameters['t'] ?? '');
  void Function()? _unlisten;

  @override
  void initState() {
    super.initState();
    if (_held != null) {
      _unlisten = exposeShoreClock((t) => _time.value = t % shoreLoop);
    }
    final given = widget.photo;
    if (given != null) {
      _adopt(given);
    } else {
      CityPhoto.load().then(
        (photo) {
          if (!mounted) return;
          setState(() => _adopt(photo));
          _run();
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
  void didChangeDependencies() {
    super.didChangeDependencies();
    _run();
  }

  @override
  void didUpdateWidget(_CityField old) {
    super.didUpdateWidget(old);
    _run();
  }

  void _run() {
    if (_shader == null) return;
    final still =
        _held ?? (MediaQuery.disableAnimationsOf(context) ? _stillAt : null);
    if (still != null) {
      _ticker.stop();
      _time.value = still;
      _before = still;
    } else if (widget.active && !_ticker.isActive) {
      _ticker.start();
    } else if (!widget.active && _ticker.isActive) {
      _before = _time.value;
      _ticker.stop();
    }
  }

  @override
  void dispose() {
    _unlisten?.call();
    _ticker.dispose();
    _time.dispose();
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
                  photo: photo,
                  time: _time,
                  // Keep the bay in view when a tall screen crops the sides.
                  align: const Offset(0.3, 0.5),
                ),
                size: Size.infinite,
              ),
            ),
          ),
        // The dark green wash of the presentation's Fortal scene (Mar's
        // darkest green), deepening towards the foot as it does there, a
        // little lighter so the moving sea shows, and darker at the top and
        // left, behind the heading's white text.
        DecoratedBox(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [
                for (final a
                    in widget.compact
                        ? const [0.86, 0.74, 0.78]
                        : const [0.82, 0.70, 0.36, 0.36, 0.68])
                  _wash.withValues(alpha: a),
              ],
              stops: widget.compact
                  ? const [0, 0.2, 1]
                  : const [0, 0.27, 0.42, 0.68, 1],
            ),
          ),
        ),
        if (!widget.compact)
          FractionallySizedBox(
            alignment: Alignment.centerLeft,
            widthFactor: 0.5,
            child: DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    _wash.withValues(alpha: 0.40),
                    _wash.withValues(alpha: 0.18),
                    _wash.withValues(alpha: 0),
                  ],
                  stops: const [0, 0.6, 1],
                ),
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
    required this.photo,
    required this.time,
    required this.align,
  }) : super(repaint: time);

  final ui.FragmentShader shader;
  final CityPhoto photo;
  final ValueNotifier<double> time;
  final Offset align;

  @override
  void paint(Canvas canvas, Size size) {
    shader.getUniformFloat('uSize', 0).set(size.width);
    shader.getUniformFloat('uSize', 1).set(size.height);
    shader.getUniformFloat('uTime').set(time.value);
    shader.getUniformFloat('uImage', 0).set(photo.photo.width.toDouble());
    shader.getUniformFloat('uImage', 1).set(photo.photo.height.toDouble());
    shader.getUniformFloat('uAlign', 0).set(align.dx);
    shader.getUniformFloat('uAlign', 1).set(align.dy);
    // Samplers in the shader's order. Smooth sampling: the default, nearest,
    // would show the photo's pixels.
    shader.setImageSampler(0, photo.photo, filterQuality: FilterQuality.medium);
    shader.setImageSampler(1, photo.sea, filterQuality: FilterQuality.low);
    canvas.drawRect(Offset.zero & size, Paint()..shader = shader);
  }

  @override
  bool shouldRepaint(_CityShaderPainter old) =>
      old.shader != shader || old.photo != photo || old.align != align;
}
