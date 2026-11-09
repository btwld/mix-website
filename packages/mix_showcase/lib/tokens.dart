import 'dart:math' as math;
import 'dart:ui' show lerpDouble;

import 'package:flutter/widgets.dart';
import 'package:remix/remix.dart';

// #docregion token-all
// #docregion token-declare
const $canvas = ColorToken('canvas');
const $surface = ColorToken('surface');
// #enddocregion token-declare
const $raised = ColorToken('raised');
const $line = ColorToken('line');
const $ink = ColorToken('ink');
const $muted = ColorToken('muted');
const $accent = ColorToken('accent');
const $onAccent = ColorToken('onAccent');
const $art = ColorToken('art');

const $cardShape = ShapeToken('card');
const $lift = LiftToken('lift');
// #enddocregion token-all

/// Mix tokens can hold any value, so a shape is a token like a color. A look
/// can change every corner in the app without touching a widget.
class ShapeToken extends MixToken<OutlinedBorder> {
  const ShapeToken(super.name);

  /// Showcase-specific adapter for `.shape()`, including custom [CutCorners].
  ShapeBorderMix<OutlinedBorder> mix() => _TokenShapeMix(this);
}

/// Mix 2.3.1 has no built-in shape-token reference. Resolve our complete shape
/// through its public Mix extension point instead of exposing Prop plumbing in
/// the styles. A later shape replaces the earlier shape as a whole.
final class _TokenShapeMix extends OutlinedBorderMix<OutlinedBorder> {
  const _TokenShapeMix(this.token);

  final ShapeToken token;

  @override
  OutlinedBorder resolve(BuildContext context) => token.resolve(context);

  @override
  _TokenShapeMix merge(_TokenShapeMix? other) => other ?? this;

  @override
  List<Object?> get props => [token];
}

/// Every look has at most one shadow. Mix 2.3.1's `BoxShadowToken` holds a list
/// that `.shadow()` and `.shadows()` cannot accept, so this token holds one
/// shadow and gives it the same `.mix()` as the other tokens.
class LiftToken extends MixToken<BoxShadow> {
  const LiftToken(super.name);

  /// Showcase-specific adapter for `.shadow()`.
  BoxShadowMix mix() => _TokenShadowMix(this);
}

final class _TokenShadowMix extends BoxShadowMix {
  const _TokenShadowMix(this.token) : super.create();

  final LiftToken token;

  @override
  BoxShadow resolve(BuildContext context) => token.resolve(context);

  @override
  BoxShadowMix merge(BoxShadowMix? other) => other ?? this;

  @override
  List<Object?> get props => [token];
}

const $artShape = ShapeToken('art');
const $controlShape = ShapeToken('control');
const $solidShape = ShapeToken('solid');
const $tinyShape = ShapeToken('tiny');
const $checkShape = ShapeToken('check');
const $focusShape = ShapeToken('focus');
const $checkFocusShape = ShapeToken('checkFocus');
const $cardRing = ShapeToken('cardRing');
const $swatchShape = ShapeToken('swatch');
const $swatchRing = ShapeToken('swatchRing');

const $title = TextStyleToken('title');
const $stat = TextStyleToken('stat');
const $body = TextStyleToken('body');
const $small = TextStyleToken('small');
const $lead = TextStyleToken('lead');

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
    canvas.drawLine(
      rect.topLeft.translate(0, size),
      rect.topLeft.translate(size, 0),
      piece,
    );
    canvas.drawLine(
      rect.bottomRight.translate(-size, 0),
      rect.bottomRight.translate(0, -size),
      piece,
    );
  }

  @override
  Path getOuterPath(Rect rect, {TextDirection? textDirection}) => _path(rect);

  @override
  Path getInnerPath(Rect rect, {TextDirection? textDirection}) =>
      _path(rect.deflate(side.strokeInset));

  @override
  void paintInterior(
    Canvas canvas,
    Rect rect,
    Paint paint, {
    TextDirection? textDirection,
  }) => canvas.drawPath(_path(rect), paint);

  @override
  bool get preferPaintInterior => true;

  @override
  CutCorners copyWith({BorderSide? side, double? cut, Color? edge}) =>
      CutCorners(
        cut: cut ?? this.cut,
        side: side ?? this.side,
        edge: edge ?? this.edge,
      );

  @override
  ShapeBorder scale(double t) =>
      CutCorners(cut: cut * t, side: side.scale(t), edge: edge);

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
      other is CutCorners &&
      other.cut == cut &&
      other.side == side &&
      other.edge == edge;

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
    this.lift,
    required this.bodyFont,
    required this.displayFont,
    this.displayWeight = FontWeight.w700,
    this.displayTracking = -0.6,
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

  /// Paper has no shadow at all, so its switch in Make it yours is disabled.
  final BoxShadow? lift;

  final String bodyFont;
  final String displayFont;
  final FontWeight displayWeight;
  final double displayTracking;

  /// Whether corners are cut flat instead of rounded.
  final bool cut;
}

// #docregion look-midnight
const midnight = Look(
  canvas: Color(0xFF0D0B14),
  surface: Color(0xFF15121F),
  // #enddocregion look-midnight
  accent: Color(0xFF8B5CF6),
  ink: Color(0xFFF4F2FA),
  card: 16,
  displayFont: 'Geist',
  control: 10,
  stroke: 1,
  id: 'midnight',
  name: 'Midnight',
  raised: Color(0xFF211C30),
  line: Color(0xFF2C2640),
  muted: Color(0xFF9A93AE),
  onAccent: Color(0xFFFFFFFF),
  art: Color(0xFFF0619A),
  lift: BoxShadow(
    color: Color(0x66000000),
    blurRadius: 32,
    offset: Offset(0, 16),
  ),
  bodyFont: 'Geist',
  // #docregion look-midnight
);
// #enddocregion look-midnight

// #docregion look-paper
const paper = Look(
  canvas: Color(0xFFF3EDE1),
  surface: Color(0xFFFBF8F1),
  // #enddocregion look-paper
  accent: Color(0xFFB03A23),
  ink: Color(0xFF1F1B14),
  card: 3,
  displayFont: 'AbrilFatface',
  control: 2,
  stroke: 1,
  id: 'paper',
  name: 'Paper',
  raised: Color(0xFFEDE5D5),
  line: Color(0xFFD6CCB8),
  muted: Color(0xFF766C5A),
  onAccent: Color(0xFFFFFAF2),
  art: Color(0xFFE3B261),
  bodyFont: 'LibreFranklin',
  displayWeight: FontWeight.w400,
  displayTracking: 0,
  // #docregion look-paper
);
// #enddocregion look-paper

// #docregion look-pop
const pop = Look(
  canvas: Color(0xFFFFD83D),
  surface: Color(0xFFFFFFFF),
  // #enddocregion look-pop
  accent: Color(0xFF2540FF),
  ink: Color(0xFF111111),
  card: 0,
  displayFont: 'Montserrat',
  control: 0,
  stroke: 2.5,
  id: 'pop',
  name: 'Pop',
  raised: Color(0xFFFFF0B3),
  line: Color(0xFF111111),
  muted: Color(0xFF4A4A4A),
  onAccent: Color(0xFFFFFFFF),
  art: Color(0xFFFF4D8D),
  lift: BoxShadow(color: Color(0xFF111111), offset: Offset(6, 6)),
  bodyFont: 'Montserrat',
  displayWeight: FontWeight.w700,
  displayTracking: -0.4,
  // #docregion look-pop
);
// #enddocregion look-pop

// #docregion look-cyber
const cyber = Look(
  canvas: Color(0xFF04120B),
  surface: Color(0xFF071B11),
  // #enddocregion look-cyber
  accent: Color(0xFF2BFF88),
  ink: Color(0xFFBDF8D3),
  card: 20,
  displayFont: 'GeistMono',
  control: 8,
  stroke: 1,
  cut: true,
  id: 'cyber',
  name: 'Cyber',
  raised: Color(0xFF0C2A1A),
  line: Color(0xFF14502F),
  muted: Color(0xFF4FA070),
  onAccent: Color(0xFF04120B),
  art: Color(0xFF0C5C34),
  lift: BoxShadow(color: Color(0x3322FF88), blurRadius: 40),
  bodyFont: 'GeistMono',
  displayWeight: FontWeight.w500,
  displayTracking: -0.8,
  // #docregion look-cyber
);
// #enddocregion look-cyber

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
  bodyFont: 'GeistMono',
  displayFont: 'GeistMono',
  displayWeight: FontWeight.w500,
);

const looks = [midnight, paper, pop, cyber];

OutlinedBorder _shape(
  Look look,
  double size, {
  BorderSide side = BorderSide.none,
  Color? edge,
}) => look.cut
    ? CutCorners(cut: size, side: side, edge: edge)
    : RoundedRectangleBorder(borderRadius: .circular(size), side: side);

/// Every look is one call to this function. No widget knows which is active.
// #docregion look-scope
Widget lookScope(
  Look look, {
  Color? accent,
  double? corner,
  bool flat = false,
  required Widget child,
}) {
  final tint = accent ?? look.accent;
  // #docregion look-colors
  return MixScope(
    colors: {
      $canvas: look.canvas,
      $surface: look.surface,
      // #enddocregion look-colors
      $raised: look.raised,
      $line: look.line,
      $ink: look.ink,
      $muted: look.muted,
      $accent: tint,
      $onAccent: look.onAccent,
      $art: look.art,
      // #docregion look-colors
    },
    // #enddocregion look-colors
    textStyles: _typeScale(look),
    tokens: _shapeTokens(look, tint: tint, corner: corner, flat: flat),
    // #docregion look-colors
    child: child,
  );
  // #enddocregion look-colors
}
// #enddocregion look-scope

Map<TextStyleToken, TextStyle> _typeScale(Look look) => {
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
  $title: TextStyle(
    fontFamily: look.bodyFont,
    fontSize: 14.5,
    fontWeight: FontWeight.w600,
    height: 1.3,
  ),
  $body: TextStyle(
    fontFamily: look.bodyFont,
    fontSize: 14,
    fontWeight: FontWeight.w400,
    height: 1.4,
  ),
  $small: TextStyle(
    fontFamily: look.bodyFont,
    fontSize: 12,
    fontWeight: FontWeight.w500,
    height: 1.3,
  ),
};

Map<MixToken, Object> _shapeTokens(
  Look look, {
  required Color tint,
  double? corner,
  bool flat = false,
}) {
  final control = corner ?? look.control;
  final card = corner == null ? look.card : corner * 1.5;
  final tiny = math.min(control, look.cut ? 4.0 : 5.0);
  final line = BorderSide(color: look.line, width: look.stroke);
  // Ink, not the accent: a focus ring has to read on an accent fill as well.
  final focus = BorderSide(color: look.ink, width: math.max(look.stroke, 1.5));
  final ring = BorderSide(color: look.ink, width: 1.5);
  return {
    $cardShape: _shape(look, card, side: line, edge: look.cut ? tint : null),
    $artShape: _shape(look, look.cut ? card : card * 0.7),
    $controlShape: _shape(look, control, side: line),
    $solidShape: _shape(look, control),
    $tinyShape: _shape(look, tiny),
    // A checkbox stays square-ish in every look: a circle reads as a radio.
    $checkShape: _shape(
      look,
      tiny,
      side: BorderSide(color: look.muted, width: look.stroke),
    ),
    $focusShape: _shape(look, control, side: focus),
    $checkFocusShape: _shape(look, tiny, side: focus),
    $cardRing: _shape(
      look,
      card,
      side: BorderSide(color: look.ink, width: 2),
      edge: look.cut ? tint : null,
    ),
    // The same side width either way, so selecting a swatch cannot shift it.
    $swatchShape: _shape(
      look,
      control,
      side: ring.copyWith(color: const Color(0x00000000)),
    ),
    $swatchRing: _shape(look, control, side: ring),
    $lift:
        (flat ? null : look.lift) ?? const BoxShadow(color: Color(0x00000000)),
  };
}
