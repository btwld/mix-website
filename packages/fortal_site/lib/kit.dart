// Pieces the slides share: the 1440 x 900 canvas every slide is laid out on,
// headings, and the slab cards the components sit on.
import 'dart:math' as math;

import 'package:flutter/widgets.dart';
import 'package:remix/remix.dart';

import 'theme.dart';
import 'ui/ui.dart';

const canvas = Size(1440, 900);

/// The content's left and right edges, shared by every slide.
const gutter = 115.0;

/// Where a slide's label starts on the canvas, the same on every slide.
const headingTop = 104.0;

/// The site's spacing scale. Slides use only these steps.
abstract final class Gap {
  static const x1 = 4.0;
  static const x2 = 8.0;
  static const x3 = 12.0;
  static const x4 = 16.0;
  static const x6 = 24.0;
  static const x8 = 32.0;
  static const x12 = 48.0;
  static const x16 = 64.0;
  static const x24 = 96.0;
}

/// The five sizes of the site's own text. Text inside components keeps
/// Fortal's sizes.
abstract final class TypeSize {
  static const name = 172.0;
  static const title = 48.0;
  static const tagline = 28.0;
  static const detail = 18.0;
  static const label = 12.0;
}

/// The left edge of each of four equal columns across the content width, and
/// their width: three of the grid's twelve columns each, 24 apart.
const columnWidth = (canvasWidth - 2 * gutter - 3 * Gap.x6) / 4;
const canvasWidth = 1440.0;
double columnLeft(int column) => gutter + column * (columnWidth + Gap.x6);

/// The left edge of each of three equal columns across the content width,
/// and their width: four of the grid's twelve columns each, 24 apart.
const wallWidth = (canvasWidth - 2 * gutter - 2 * Gap.x6) / 3;
double wallLeft(int column) => gutter + column * (wallWidth + Gap.x6);

/// Where the canvas sits on a screen: scaled to fit and centred.
({Offset origin, double scale}) canvasFrame(Size screen) {
  final scale = math.min(
    screen.width / canvas.width,
    screen.height / canvas.height,
  );
  return (
    origin: Offset(
      (screen.width - canvas.width * scale) / 2,
      (screen.height - canvas.height * scale) / 2,
    ),
    scale: scale,
  );
}

/// Lays `child` out on the canvas over a full-bleed `backdrop`.
class SlideFrame extends StatelessWidget {
  const SlideFrame({super.key, required this.backdrop, required this.child});

  final Widget backdrop;
  final Widget child;

  @override
  Widget build(BuildContext context) => LayoutBuilder(
    builder: (context, constraints) {
      final frame = canvasFrame(constraints.biggest);
      return Stack(
        children: [
          Positioned.fill(child: backdrop),
          Positioned(
            left: frame.origin.dx,
            top: frame.origin.dy,
            width: canvas.width * frame.scale,
            height: canvas.height * frame.scale,
            child: FittedBox(
              child: SizedBox.fromSize(size: canvas, child: child),
            ),
          ),
        ],
      );
    },
  );
}

/// The design width of the narrow layout, for phones and tall windows.
const narrowWidth = 480.0;

/// Whether a screen is too narrow or too tall for the slides, so the site
/// becomes one scrolling page with everything stacked.
bool isNarrow(Size screen) =>
    screen.width < 900 || screen.width / screen.height < 1.05;

/// One section of the narrow layout: its pieces stacked in a single column
/// over its backdrop, scaled to the screen's width.
/// The widest the narrow layout's column is drawn, so on a tablet it stays a
/// comfortable size in the middle of the screen and does not blow up to fill it.
const narrowMax = 600.0;

class NarrowSection extends StatelessWidget {
  const NarrowSection({
    super.key,
    required this.backdrop,
    required this.children,
  });

  final Widget backdrop;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) => Stack(
    children: [
      Positioned.fill(child: backdrop),
      Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: narrowMax),
          // As wide as the screen allows, up to that limit: the same width the
          // opening section's cards are drawn at.
          child: SizedBox(
            width: double.infinity,
            child: FittedBox(
              fit: BoxFit.fitWidth,
              child: SizedBox(
                width: narrowWidth,
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(
                    Gap.x4,
                    Gap.x16,
                    Gap.x4,
                    Gap.x16,
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    spacing: Gap.x6,
                    children: children,
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    ],
  );
}

/// A slide's label, title and one line of explanation.
class SlideHeading extends StatelessWidget {
  const SlideHeading({
    super.key,
    required this.label,
    required this.title,
    required this.detail,
    this.onDark = false,
    this.compact = false,
  });

  /// Smaller type, for the narrow layout.
  final bool compact;
  final String label;
  final String title;
  final String detail;
  final bool onDark;

  @override
  Widget build(BuildContext context) {
    final ink = onDark
        ? const Color(0xFFFFFFFF)
        : tokenColor(context, UiTokens.gray12);
    final soft = onDark
        ? const Color(0xC7FFFFFF)
        : tokenColor(context, UiTokens.gray11);
    final accent = onDark
        ? const Color(0xFF8FE3D6)
        : tokenColor(context, UiTokens.accent11);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label.toUpperCase(),
          style: TextStyle(
            fontSize: TypeSize.label,
            fontWeight: FontWeight.w700,
            letterSpacing: 2.4,
            color: accent,
          ),
        ),
        const SizedBox(height: Gap.x3),
        Text(
          compact ? _balanced(title) : title,
          style: TextStyle(
            fontSize: compact ? 36 : TypeSize.title,
            fontWeight: FontWeight.w700,
            height: 1.05,
            letterSpacing: -1.4,
            color: ink,
          ),
        ),
        const SizedBox(height: Gap.x3),
        Text(
          detail,
          style: TextStyle(
            fontSize: compact ? 17 : TypeSize.detail,
            fontWeight: FontWeight.w400,
            height: 1.4,
            color: soft,
          ),
        ),
      ],
    );
  }
}

/// A title broken into two lines of about the same length, for the narrow
/// layout, where a title takes two lines and would otherwise leave its last
/// word alone on the second.
String _balanced(String title) {
  var best = -1;
  for (var i = 0; i < title.length; i++) {
    if (title[i] != ' ') continue;
    if (best < 0 ||
        (title.length - 2 * i).abs() < (title.length - 2 * best).abs()) {
      best = i;
    }
  }
  return best < 0
      ? title
      : '${title.substring(0, best)}\n${title.substring(best + 1)}';
}

/// A small heading inside a card.
Widget cardLabel(String text) => Builder(
  builder: (context) => Text(
    text.toUpperCase(),
    style: TextStyle(
      fontSize: TypeSize.label,
      fontWeight: FontWeight.w700,
      letterSpacing: 1.5,
      color: tokenColor(context, UiTokens.gray10),
    ),
  ),
);

/// A Fortal card exactly as Fortal draws it, with an optional small heading.
/// With `lifted`, a soft shadow is drawn behind it for cards on a dark slide;
/// the card itself is never restyled.
class Slab extends StatelessWidget {
  const Slab({
    super.key,
    this.label,
    this.lifted = false,
    this.snug = false,
    required this.child,
  });

  /// Fortal's next card size down, for a slide that holds many cards.
  final bool snug;

  final String? label;
  final bool lifted;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final card = UiCard(
      size: snug ? .size2 : .size3,
      child: label == null
          ? child
          : Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              mainAxisSize: MainAxisSize.min,
              children: [
                cardLabel(label!),
                const SizedBox(height: Gap.x3),
                child,
              ],
            ),
    );
    if (!lifted) return card;
    return DecoratedBox(
      decoration: const BoxDecoration(
        boxShadow: [
          BoxShadow(
            color: Color(0x52000000),
            blurRadius: 18,
            offset: Offset(4, 8),
          ),
        ],
      ),
      child: card,
    );
  }
}

/// One of Fortal's corner radii in the theme around `context`, so the site's
/// own panels follow the radius a visitor picks.
BorderRadius tokenRadius(BuildContext context, RadiusToken token) =>
    BorderRadius.all(MixScope.tokenOf(token, context));

/// Holds one control's value, so a demo answers when it is used.
class Live<T> extends StatefulWidget {
  const Live({super.key, required this.initial, required this.builder});

  final T initial;
  final Widget Function(T value, ValueChanged<T> set) builder;

  @override
  State<Live<T>> createState() => _LiveState<T>();
}

class _LiveState<T> extends State<Live<T>> {
  late T _value = widget.initial;

  @override
  Widget build(BuildContext context) =>
      widget.builder(_value, (value) => setState(() => _value = value));
}

/// A muted line in Fortal's small body size: the site's own text, set from
/// Fortal's tokens, since Fortal's text has no muted option to choose.
class Muted extends StatelessWidget {
  const Muted(
    this.text, {
    super.key,
    this.small = false,
    this.align = TextAlign.start,
  });

  final String text;
  final TextAlign align;

  /// Fortal's smallest body size, for numbers under a scale.
  final bool small;

  @override
  Widget build(BuildContext context) => Text(
    text,
    textAlign: align,
    style: MixScope.tokenOf(
      small ? UiTokens.text1 : UiTokens.text2,
      context,
    ).copyWith(color: tokenColor(context, UiTokens.gray11)),
  );
}

/// A showcase card, with the plan's anatomy: a title, one muted line about
/// it, the components at work, and a footer naming the components used.
/// With `fill`, the card takes the height it is given and its footer sits at
/// the bottom, so cards in a row or column can end on one line.
class ShowCard extends StatelessWidget {
  const ShowCard({
    super.key,
    required this.title,
    this.detail,
    this.lead,
    required this.uses,
    this.fill = false,
    this.snug = true,
    required this.child,
  });

  final String title;

  /// The muted line under the title, at most 44 characters.
  final String? detail;

  /// Something in the detail line's place, such as a figure.
  final Widget? lead;

  final String uses;
  final bool fill;

  /// Fortal's smaller card size, for a slide that holds many cards.
  final bool snug;
  final Widget child;

  @override
  Widget build(BuildContext context) => Slab(
    snug: snug,
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      mainAxisSize: fill ? MainAxisSize.max : MainAxisSize.min,
      children: [
        UiHeading(title, size: .size4),
        if (detail != null) ...[const SizedBox(height: Gap.x1), Muted(detail!)],
        if (lead != null) ...[const SizedBox(height: Gap.x2), lead!],
        const SizedBox(height: Gap.x4),
        child,
        if (fill) const Spacer(),
        const SizedBox(height: Gap.x4),
        const UiDivider(),
        const SizedBox(height: Gap.x3),
        cardLabel(uses),
      ],
    ),
  );
}
