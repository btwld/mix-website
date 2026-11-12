// The opening slide: the name, and eight cards of real Fortal components on a
// shore drawn by a fragment shader. Waves come from the sea behind the tiles,
// break against them and drain back.
//
// Add `?t=12.5` to the address to hold the shore at one moment; a capture tool
// can then move that moment with `window.shoreSet`. With reduced motion
// requested, the shore also holds still, and it rests while another slide is
// showing.
import 'dart:math' as math;
import 'dart:ui' as ui;

import 'package:flutter/foundation.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter/scheduler.dart';
import 'package:flutter/widgets.dart';
import 'package:remix/remix.dart';

import '../bento.dart';
import '../hold.dart';
import '../kit.dart';
import '../shore.dart';
import '../theme.dart';
import '../ui/ui.dart';

import 'package:remix_ui_icons/remix_ui_icons.dart';

const _stillAt = 2.2; // a wave at its furthest reach

// Where the narrow board sits: as wide as the screen up to the layout's
// widest column, then centred. The shore still fills the whole width.
({Offset origin, double scale}) _narrowFrame(double screen, double board) {
  final scale = math.min(screen, narrowMax) / board;
  return (origin: Offset((screen - board * scale) / 2, 0), scale: scale);
}

class HeroSlide extends StatefulWidget {
  const HeroSlide({
    super.key,
    required this.program,
    required this.active,
    this.compact = false,
    this.onGo,
  });

  /// Opens another slide: 1 for the components, 5 for how to use it.
  final ValueChanged<int>? onGo;

  /// The narrow layout: the tiles stacked two abreast under the name.
  final bool compact;

  final ui.FragmentProgram program;

  /// Whether this slide is the one showing.
  final bool active;

  @override
  State<HeroSlide> createState() => _HeroSlideState();
}

class _HeroSlideState extends State<HeroSlide>
    with SingleTickerProviderStateMixin {
  final _time = ValueNotifier<double>(0);
  var _before = Duration.zero; // time on the clock before the last pause
  late final Ticker _ticker = createTicker(
    (elapsed) =>
        _time.value = (_before + elapsed).inMicroseconds / 1e6 % shoreLoop,
  );
  // One shader for each layer, made once and reused every frame.
  late final _behind = widget.program.fragmentShader();
  late final _over = widget.program.fragmentShader();
  final _held = double.tryParse(Uri.base.queryParameters['t'] ?? '');
  void Function()? _unlisten;

  // The cards' boxes in canvas units, as the collage last laid them out. The
  // shader and the cards' wave nudge both read these. They start as the
  // boxes measured at 100% scaling, so a plain load needs no correction.
  var _wideCards = measuredWideCards;
  var _narrowCards = measuredNarrowCards;

  /// Takes the boxes the collage has just laid its cards out in; if they
  /// differ from the ones the shader has, it gets them on the next frame.
  void _laidOut(bool compact, List<Rect> cards) {
    if (listEquals(compact ? _narrowCards : _wideCards, cards)) return;
    SchedulerBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      setState(() => compact ? _narrowCards = cards : _wideCards = cards);
    });
  }

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
  void didUpdateWidget(HeroSlide old) {
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
      // Carry on from the same moment when the slide comes back.
      _before = Duration(microseconds: (_time.value * 1e6).round());
      _ticker.stop();
    }
  }

  @override
  void dispose() {
    _unlisten?.call();
    _ticker.dispose();
    _time.dispose();
    _behind.dispose();
    _over.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => LayoutBuilder(
    builder: (context, constraints) {
      final compact = widget.compact;
      final boxes = compact ? _narrowCards : _wideCards;
      // Narrow, the page is as tall as its cards need, and 64 more.
      final board = compact
          ? Size(
              narrowWidth,
              boxes.map((box) => box.bottom).reduce(math.max) + Gap.x16,
            )
          : canvas;
      // Narrow, the slide is as wide as the screen and as tall as its tiles
      // need; wide, it is the canvas scaled to fit and centred.
      final (:origin, :scale) = compact
          ? _narrowFrame(constraints.maxWidth, board.width)
          : canvasFrame(constraints.biggest);
      Widget shore({required bool over}) => Shore(
        shader: over ? _over : _behind,
        time: _time,
        origin: origin,
        scale: scale,
        cards: boxes,
        // The cards' corner, which follows the radius and scaling a visitor
        // picks, a little rounder for the slab's side, as the shader was
        // tuned (10 for a corner of 8).
        radius: 1.25 * MixScope.tokenOf(UiTokens.radius5, context).x,
        over: over,
      );
      final slide = Stack(
        children: [
          Positioned.fill(child: shore(over: false)),
          Positioned(
            left: origin.dx,
            top: origin.dy,
            width: board.width * scale,
            height: board.height * scale,
            child: FittedBox(
              child: SizedBox.fromSize(
                size: board,
                child: _Page(
                  time: _time,
                  boxes: boxes,
                  compact: compact,
                  onGo: widget.onGo,
                  onLaidOut: (cards) => _laidOut(compact, cards),
                ),
              ),
            ),
          ),
          Positioned.fill(child: IgnorePointer(child: shore(over: true))),
        ],
      );
      return compact
          ? SizedBox(height: board.height * scale, child: slide)
          : slide;
    },
  );
}

class _Page extends StatelessWidget {
  const _Page({
    required this.time,
    required this.boxes,
    required this.compact,
    required this.onGo,
    required this.onLaidOut,
  });

  final ValueChanged<int>? onGo;
  final ValueChanged<List<Rect>> onLaidOut;

  final ValueNotifier<double> time;
  final List<Rect> boxes;
  final bool compact;

  // A card, given a small shove as a wave reaches it. The collage measures
  // the card before the shove; the shader adds the same shove itself.
  Widget _tile(int i, Widget child) => ValueListenableBuilder(
    valueListenable: time,
    builder: (context, t, child) => Transform.translate(
      offset: Offset(0, waveNudge(boxes[i], boxes, t)),
      child: child,
    ),
    child: child,
  );

  // A soft shade under the words, so they hold over moving water.
  static const _shade = [
    Shadow(color: Color(0x40032F2A), blurRadius: 28, offset: Offset(0, 6)),
  ];

  static const _name = TextStyle(
    fontFamily: geist,
    fontWeight: FontWeight.w700,
    height: 1.0,
    color: Color(0xFFFFFFFF),
    shadows: _shade,
  );
  static const _what = TextStyle(
    fontFamily: geist,
    fontWeight: FontWeight.w500,
    height: 1.24,
    letterSpacing: -0.3,
    color: Color(0xF2FFFFFF),
    shadows: _shade,
  );

  @override
  Widget build(BuildContext context) => Stack(
    children: [
      if (compact) ...[
        // Narrow: the name, then what it is beneath it.
        Positioned(
          left: 12,
          top: 64,
          child: Text(
            'Fortal',
            style: _name.copyWith(fontSize: 112, letterSpacing: -3.5),
          ),
        ),
        Positioned(
          left: 16,
          top: 186,
          child: Text(
            'A design system for Flutter,\nbuilt with Remix.',
            style: _what.copyWith(fontSize: 22),
          ),
        ),
      ] else ...[
        // Wide: the name on the left, and what it is on the right.
        Positioned(
          left: gutter - 9,
          top: 52,
          child: Text(
            'Fortal',
            style: _name.copyWith(fontSize: 172, letterSpacing: -5.5),
          ),
        ),
        Positioned(
          right: gutter,
          top: 114,
          child: Text(
            'A design system for Flutter,\nbuilt with Remix.',
            textAlign: TextAlign.right,
            style: _what.copyWith(fontSize: 28),
          ),
        ),
        // The two ways in, the second in Fortal's soft style so it reads on
        // the sea.
        Positioned(
          right: gutter,
          top: 202,
          child: Row(
            spacing: Gap.x2,
            children: [
              // Drawn in the theme's dark mode and Fortal's high-contrast
              // option: near-white text on a dark tint, so it reads on the sea.
              ValueListenableBuilder(
                valueListenable: siteAccent,
                builder: (context, accent, _) => UiTheme(
                  mode: UiThemeMode.dark,
                  accent: accent,
                  hasBackground: false,
                  child: FortalTheme(
                    accent: accent,
                    dark: true,
                    child: UiButton(
                      label: 'Components',
                      variant: .soft,
                      highContrast: true,
                      size: .size3,
                      onPressed: () => onGo?.call(1),
                    ),
                  ),
                ),
              ),
              UiButton(
                label: 'Get started',
                size: .size3,
                trailingIcon: RemixIcons.arrowRight,
                // Use it, the last slide.
                onPressed: () => onGo?.call(8),
              ),
            ],
          ),
        ),
      ],
      Positioned.fill(
        child: _Collage(
          columns: compact ? narrowColumns : wideColumns,
          onLaidOut: onLaidOut,
          children: [
            for (final (i, tile) in heroTiles().indexed) _tile(i, tile),
          ],
        ),
      ),
    ],
  );
}

/// The cards in columns: each column stacks its cards [collageGap] apart from
/// its top, each card as wide as the column and as tall as its content. After
/// every layout it reports the box each card took, in [heroTiles] order, in
/// its own units, which are the canvas's.
class _Collage extends MultiChildRenderObjectWidget {
  const _Collage({
    required this.columns,
    required this.onLaidOut,
    required super.children,
  });

  final List<CollageColumn> columns;
  final ValueChanged<List<Rect>> onLaidOut;

  @override
  _RenderCollage createRenderObject(BuildContext context) =>
      _RenderCollage(columns, onLaidOut);

  @override
  void updateRenderObject(BuildContext context, _RenderCollage collage) =>
      collage
        ..columns = columns
        ..onLaidOut = onLaidOut;
}

class _CollageSlot extends ContainerBoxParentData<RenderBox> {}

class _RenderCollage extends RenderBox
    with
        ContainerRenderObjectMixin<RenderBox, _CollageSlot>,
        RenderBoxContainerDefaultsMixin<RenderBox, _CollageSlot> {
  _RenderCollage(this._columns, this.onLaidOut);

  List<CollageColumn> _columns;
  set columns(List<CollageColumn> value) {
    if (identical(value, _columns)) return;
    _columns = value;
    markNeedsLayout();
  }

  ValueChanged<List<Rect>> onLaidOut;

  @override
  void setupParentData(RenderBox child) {
    if (child.parentData is! _CollageSlot) child.parentData = _CollageSlot();
  }

  @override
  void performLayout() {
    size = constraints.biggest;
    final cards = getChildrenAsList();
    final boxes = List.filled(cards.length, Rect.zero);
    for (final column in _columns) {
      var top = column.top;
      for (final i in column.cards) {
        final card = cards[i]
          ..layout(
            BoxConstraints.tightFor(width: column.width),
            parentUsesSize: true,
          );
        (card.parentData! as _CollageSlot).offset = Offset(column.left, top);
        boxes[i] = Rect.fromLTWH(
          column.left,
          top,
          column.width,
          card.size.height,
        );
        top += card.size.height + collageGap;
      }
    }
    onLaidOut(boxes);
  }

  @override
  void paint(PaintingContext context, Offset offset) =>
      defaultPaint(context, offset);

  @override
  bool hitTestChildren(BoxHitTestResult result, {required Offset position}) =>
      defaultHitTestChildren(result, position: position);
}
