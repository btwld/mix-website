import 'dart:math' as math;
import 'dart:ui' show lerpDouble;

import 'package:flutter/widgets.dart';
import 'package:remix/remix.dart';

// #docregion tokens
const $canvas = ColorToken('canvas');
const $surface = ColorToken('surface');
const $raised = ColorToken('raised');
const $line = ColorToken('line');
const $ink = ColorToken('ink');
const $muted = ColorToken('muted');
const $accent = ColorToken('accent');
const $onAccent = ColorToken('onAccent');
const $art = ColorToken('art');

// #enddocregion tokens

/// Mix tokens can hold any value, so a shape is a token like a color. A look
/// can change every corner in the app without touching a widget.
class ShapeToken extends MixToken<ShapeBorder> {
  const ShapeToken(super.name);
}

// #docregion tokens-rest
const $cardShape = ShapeToken('card');
const $artShape = ShapeToken('art');
const $controlShape = ShapeToken('control');
const $solidShape = ShapeToken('solid');
const $tinyShape = ShapeToken('tiny');
const $checkShape = ShapeToken('check');
const $focusShape = ShapeToken('focus');
const $stroke = DoubleToken('stroke');
const $lift = BoxShadowToken('lift');

const $display = TextStyleToken('display');
const $title = TextStyleToken('title');
const $stat = TextStyleToken('stat');
const $body = TextStyleToken('body');
const $small = TextStyleToken('small');
const $lead = TextStyleToken('lead');
// #enddocregion tokens-rest

// #docregion cut-corners
/// Flat cuts on the top-left and bottom-right, each with a bright edge piece.
class CutCorners extends OutlinedBorder {
  const CutCorners({required this.cut, super.side, this.edge});

  final double cut;
  final Color? edge;

  Path _path(Rect rect) {
    final size = math.min(cut, rect.shortestSide / 2);
    return Path()
      ..moveTo(rect.left + size, rect.top)
      ..lineTo(rect.right, rect.top)
      ..lineTo(rect.right, rect.bottom - size)
      ..lineTo(rect.right - size, rect.bottom)
      ..lineTo(rect.left, rect.bottom)
      ..lineTo(rect.left, rect.top + size)
      ..close();
  }

  @override
  void paint(Canvas canvas, Rect rect, {TextDirection? textDirection}) {
    if (side.style != BorderStyle.none) {
      canvas.drawPath(_path(rect.deflate(side.width / 2)), side.toPaint());
    }
    final color = edge;
    if (color == null) return;
    final size = math.min(cut, rect.shortestSide / 2);
    final piece = Paint()
      ..color = color.withValues(alpha: color.a * 0.7)
      ..strokeWidth = 1.5;
    canvas.drawLine(rect.topLeft.translate(0, size), rect.topLeft.translate(size, 0), piece);
    canvas.drawLine(rect.bottomRight.translate(-size, 0), rect.bottomRight.translate(0, -size), piece);
  }
  // #enddocregion cut-corners

  @override
  Path getOuterPath(Rect rect, {TextDirection? textDirection}) => _path(rect);

  @override
  Path getInnerPath(Rect rect, {TextDirection? textDirection}) => _path(rect.deflate(side.strokeInset));

  @override
  void paintInterior(Canvas canvas, Rect rect, Paint paint, {TextDirection? textDirection}) =>
      canvas.drawPath(_path(rect), paint);

  @override
  bool get preferPaintInterior => true;

  @override
  CutCorners copyWith({BorderSide? side, double? cut, Color? edge}) =>
      CutCorners(cut: cut ?? this.cut, side: side ?? this.side, edge: edge ?? this.edge);

  @override
  ShapeBorder scale(double t) => CutCorners(cut: cut * t, side: side.scale(t), edge: edge);

  @override
  ShapeBorder? lerpFrom(ShapeBorder? a, double t) {
    if (a is CutCorners) {
      return CutCorners(
        cut: lerpDouble(a.cut, cut, t)!,
        side: BorderSide.lerp(a.side, side, t),
        edge: Color.lerp(a.edge, edge, t),
      );
    }
    return super.lerpFrom(a, t);
  }

  @override
  bool operator ==(Object other) =>
      other is CutCorners && other.cut == cut && other.side == side && other.edge == edge;

  @override
  int get hashCode => Object.hash(cut, side, edge);
}

/// One complete identity. The widgets never read this directly: it only
/// becomes token values, so every look is the same app with different data.
class Look {
  const Look({
    required this.id,
    required this.name,
    required this.canvas,
    required this.surface,
    required this.raised,
    required this.line,
    required this.ink,
    required this.muted,
    required this.accent,
    required this.onAccent,
    required this.art,
    required this.control,
    required this.card,
    required this.stroke,
    required this.lift,
    required this.bodyFont,
    required this.displayFont,
    this.displayWeight = FontWeight.w700,
    this.displaySize = 30,
    this.displayTracking = -0.6,
    this.shout = false,
    this.cut = false,
  });

  final String id;
  final String name;
  final Color canvas;
  final Color surface;
  final Color raised;
  final Color line;
  final Color ink;
  final Color muted;
  final Color accent;
  final Color onAccent;

  /// Second stop of the cover art gradient, which starts at the accent.
  final Color art;
  final double control;
  final double card;
  final double stroke;
  final List<BoxShadow> lift;
  final String bodyFont;
  final String displayFont;
  final FontWeight displayWeight;
  final double displaySize;
  final double displayTracking;

  /// Pop sets its headings in capitals with Mix's text directive.
  final bool shout;

  /// Whether corners are cut flat instead of rounded.
  final bool cut;
}

// #docregion look-midnight
const midnight = Look(
  accent: Color(0xFF8B5CF6),
  canvas: Color(0xFF0D0B14),
  ink: Color(0xFFF4F2FA),
  control: 10,
  stroke: 1,
  displayFont: 'Geist',
  // #enddocregion look-midnight
  id: 'midnight',
  name: 'Midnight',
  surface: Color(0xFF15121F),
  raised: Color(0xFF211C30),
  line: Color(0xFF2C2640),
  muted: Color(0xFF9A93AE),
  onAccent: Color(0xFFFFFFFF),
  art: Color(0xFFF0619A),
  card: 16,
  lift: [BoxShadow(color: Color(0x66000000), blurRadius: 32, offset: Offset(0, 16))],
  bodyFont: 'Geist',
);

// #docregion look-paper
const paper = Look(
  accent: Color(0xFFB03A23),
  canvas: Color(0xFFF3EDE1),
  ink: Color(0xFF1F1B14),
  control: 2,
  stroke: 1,
  displayFont: 'AbrilFatface',
  // #enddocregion look-paper
  id: 'paper',
  name: 'Paper',
  surface: Color(0xFFFBF8F1),
  raised: Color(0xFFEDE5D5),
  line: Color(0xFFD6CCB8),
  muted: Color(0xFF766C5A),
  onAccent: Color(0xFFFFFAF2),
  art: Color(0xFFE3B261),
  card: 3,
  lift: [],
  bodyFont: 'LibreFranklin',
  displayWeight: FontWeight.w400,
  displaySize: 38,
  displayTracking: 0,
);

// #docregion look-pop
const pop = Look(
  accent: Color(0xFF2540FF),
  canvas: Color(0xFFFFD83D),
  ink: Color(0xFF111111),
  control: 0,
  stroke: 2.5,
  displayFont: 'Montserrat',
  // #enddocregion look-pop
  id: 'pop',
  name: 'Pop',
  surface: Color(0xFFFFFFFF),
  raised: Color(0xFFFFF0B3),
  line: Color(0xFF111111),
  muted: Color(0xFF4A4A4A),
  onAccent: Color(0xFFFFFFFF),
  art: Color(0xFFFF4D8D),
  card: 0,
  lift: [BoxShadow(color: Color(0xFF111111), offset: Offset(6, 6))],
  bodyFont: 'Montserrat',
  displayWeight: FontWeight.w700,
  displaySize: 28,
  displayTracking: -0.4,
  shout: true,
);

// #docregion look-cyber
const cyber = Look(
  accent: Color(0xFF2BFF88),
  canvas: Color(0xFF04120B),
  ink: Color(0xFFBDF8D3),
  control: 8,
  stroke: 1,
  displayFont: 'GeistMono',
  cut: true,
  // #enddocregion look-cyber
  id: 'cyber',
  name: 'Cyber',
  surface: Color(0xFF071B11),
  raised: Color(0xFF0C2A1A),
  line: Color(0xFF14502F),
  muted: Color(0xFF4FA070),
  onAccent: Color(0xFF04120B),
  art: Color(0xFF0C5C34),
  card: 20,
  lift: [BoxShadow(color: Color(0x3322FF88), blurRadius: 40)],
  bodyFont: 'GeistMono',
  displayWeight: FontWeight.w500,
  displaySize: 26,
  displayTracking: -0.8,
);

/// The look behind the behavior chapter: outlines and a mono face only.
const bare = Look(
  id: 'bare',
  name: 'Unstyled',
  canvas: Color(0xFF08080B),
  surface: Color(0x00000000),
  raised: Color(0xFF1B1B22),
  line: Color(0xFF34343F),
  ink: Color(0xFFD9D9E3),
  muted: Color(0xFF777785),
  accent: Color(0xFF6E6E7A),
  onAccent: Color(0xFF08080B),
  art: Color(0xFF2A2A32),
  control: 0,
  card: 0,
  stroke: 1,
  lift: [],
  bodyFont: 'GeistMono',
  displayFont: 'GeistMono',
  displayWeight: FontWeight.w500,
  displaySize: 24,
);

const looks = [midnight, paper, pop, cyber];

ShapeBorder _shape(Look look, double size, {BorderSide side = BorderSide.none, Color? edge}) => look.cut
    ? CutCorners(cut: size, side: side, edge: edge)
    : RoundedRectangleBorder(borderRadius: .circular(size), side: side);

// #docregion scope
/// Every look is one call to this function. No widget knows which is active.
Widget lookScope(Look look, {Color? accent, double? corner, bool flat = false, required Widget child}) {
  final tint = accent ?? look.accent;
  final control = corner ?? look.control;
  final card = corner == null ? look.card : corner * 1.5;
  final tiny = math.min(control, look.cut ? 4.0 : 5.0);
  final line = BorderSide(color: look.line, width: look.stroke);
  return MixScope(
    colors: {
      $canvas: look.canvas,
      $surface: look.surface,
      $raised: look.raised,
      $line: look.line,
      $ink: look.ink,
      $muted: look.muted,
      $accent: tint,
      $onAccent: look.onAccent,
      $art: look.art,
    },
    tokens: {
      $cardShape: _shape(look, card, side: line, edge: look.cut ? tint : null),
      $artShape: _shape(look, look.cut ? card : card * 0.7),
      $controlShape: _shape(look, control, side: line),
      $solidShape: _shape(look, control),
      $tinyShape: _shape(look, tiny),
      // A checkbox stays square-ish in every look: a circle reads as a radio.
      $checkShape: _shape(look, tiny, side: BorderSide(color: look.muted, width: look.stroke)),
      $focusShape: _shape(look, control, side: BorderSide(color: tint, width: math.max(look.stroke, 1.5))),
    },
    doubles: {$stroke: look.stroke},
    boxShadows: {$lift: flat ? const [] : look.lift},
    // #enddocregion scope
    textStyles: {
      $display: TextStyle(
        fontFamily: look.displayFont,
        fontSize: look.displaySize,
        fontWeight: look.displayWeight,
        letterSpacing: look.displayTracking,
        height: 1.15,
      ),
      $stat: TextStyle(
        fontFamily: look.displayFont,
        fontSize: 32,
        fontWeight: look.displayWeight,
        letterSpacing: look.displayTracking / 2,
        height: 1.15,
      ),
      $lead: TextStyle(
        fontFamily: look.displayFont,
        fontSize: 19,
        fontWeight: look.displayWeight,
        letterSpacing: look.displayTracking / 3,
        height: 1.2,
      ),
      $title: TextStyle(fontFamily: look.bodyFont, fontSize: 14.5, fontWeight: FontWeight.w600, height: 1.3),
      $body: TextStyle(fontFamily: look.bodyFont, fontSize: 14, fontWeight: FontWeight.w400, height: 1.4),
      $small: TextStyle(fontFamily: look.bodyFont, fontSize: 12, fontWeight: FontWeight.w500, height: 1.3),
    },
    child: child,
  );
}
