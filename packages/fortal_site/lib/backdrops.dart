// The backgrounds behind the slides after the shore. Each takes a view from
// the beira-mar and Ceará coast: wind-sculpted sand dunes, interdune lagoons,
// the seafront horizon, and the sea after dark.
import 'dart:math' as math;
import 'dart:ui' as ui;

import 'package:flutter/scheduler.dart';
import 'package:flutter/widgets.dart';

import 'hold.dart';
import 'shore.dart' show shoreLoop;
import 'theme.dart';
import 'ui/ui.dart';

const _sandLight = Color(0xFFF0E3CB);
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
