// The site: full-screen slides, one above the next. A wheel turn, a swipe, the
// arrow keys, the links at the top or the dots at the side move between them.
import 'dart:ui' as ui;

import 'package:flutter/foundation.dart' show ValueListenable;
import 'package:flutter/gestures.dart';
import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';

import 'backdrops.dart';
import 'kit.dart';
import 'slides/agents.dart';
import 'slides/charts.dart';
import 'slides/dashboard.dart';
import 'slides/foundations.dart';
import 'slides/gallery.dart';
import 'slides/hero.dart';
import 'slides/themes.dart';
import 'slides/use.dart';
import 'theme.dart';

// Each slide's section in the links, and whether its top is dark. Components
// runs over two slides.
const _slides = [
  (section: 'Fortal', dark: true),
  (section: 'Components', dark: true),
  (section: 'Components', dark: true),
  (section: 'Charts', dark: true),
  (section: 'Agents', dark: true),
  (section: 'Dashboard', dark: true),
  (section: 'Themes', dark: false),
  (section: 'Foundations', dark: true),
  (section: 'Use it', dark: true),
];

// Foundations and Use it, the last two slides, share the Beira-Mar photo. The
// slide before them draws its own backdrop, so no other slide shares the
// screen with them in a turn.
const _firstCitySlide = 7;

// The links at the top, and the slide each opens.
const _links = [
  (section: 'Components', slide: 1),
  (section: 'Charts', slide: 3),
  (section: 'Agents', slide: 4),
  (section: 'Dashboard', slide: 5),
  (section: 'Themes', slide: 6),
  (section: 'Foundations', slide: 7),
  (section: 'Use it', slide: 8),
];

const _turn = Duration(milliseconds: 560);

// A turn starts moving at once and settles gently. An ease-in at the start
// reads as the page lagging behind the wheel.
const _turnCurve = Cubic(0.2, 0, 0, 1);

// A wheel gesture has ended after this long without a wheel event.
const _wheelRest = Duration(milliseconds: 140);

class Site extends StatefulWidget {
  const Site({super.key, required this.program, required this.horizonProgram});

  final ui.FragmentProgram program;
  final ui.FragmentProgram horizonProgram;

  @override
  State<Site> createState() => _SiteState();
}

class _SiteState extends State<Site> with SingleTickerProviderStateMixin {
  // `?slide=2` opens on that slide.
  late var _at = (int.tryParse(Uri.base.queryParameters['slide'] ?? '') ?? 0)
      .clamp(0, _slides.length - 1);
  // Where the deck is, in slides: 2.5 is halfway from the third to the fourth.
  late final _page = AnimationController.unbounded(
    vsync: this,
    value: _at.toDouble(),
  )..addListener(_showCity);
  late final _cityShown = ValueNotifier(_at >= _firstCitySlide);
  var _turning = false;
  // The slide a turn is leaving, which stays live until the turn ends.
  int? _leaving;
  // What is being drawn once, unseen, so its first real frame is not slow.
  final _warming = ValueNotifier<int?>(null);
  final _warmingCity = ValueNotifier(false);
  final _narrowHero = GlobalKey();
  final _narrowHeroShown = ValueNotifier(true);
  late final _narrowScroll = ScrollController(
    keepScrollOffset: false,
    onAttach: (_) => WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) _updateNarrowHero();
    }),
  )..addListener(_updateNarrowHero);

  void _updateNarrowHero() {
    final hero = _narrowHero.currentContext?.findRenderObject();
    if (hero is RenderBox && hero.hasSize && _narrowScroll.hasClients) {
      _narrowHeroShown.value = _narrowScroll.offset < hero.size.height;
    }
  }

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _warmUp());
  }

  // The first time a slide is drawn costs far more than any later frame:
  // its text and shadows are prepared and its shaders compiled. Left to the
  // first visit, that lands on the opening frames of the turn and shows as a
  // stutter (270 ms for the themes' horizon). So each slide is drawn once,
  // unseen, as the page loads. The closing slides' photo is fetched here too,
  // ready before anyone reaches them.
  Future<void> _warmUp() async {
    final frames = WidgetsBinding.instance;
    for (var slide = 0; slide < _slides.length; slide++) {
      if (!mounted) return;
      if ((slide - _page.value).abs() < 1) continue;
      _warming.value = slide;
      // Give the renderer a few frames to prepare the slide's retained
      // layers, not just its first shader draw.
      for (var frame = 0; frame < 4; frame++) {
        await frames.endOfFrame;
        if (!mounted) return;
      }
    }
    _warming.value = null;
    await CityPhoto.load();
    if (!mounted) return;
    _warmingCity.value = true;
    for (var frame = 0; frame < 4; frame++) {
      await frames.endOfFrame;
      if (!mounted) return;
    }
    if (mounted) _warmingCity.value = false;
  }

  // The shared photo shows once the turn has left the slide before it.
  void _showCity() => _cityShown.value = _page.value > _firstCitySlide - 1;

  Future<void> _go(int slide) async {
    final to = slide.clamp(0, _slides.length - 1);
    if (to == _at || _turning) return;
    setState(() {
      _leaving = _at;
      _at = to;
      _turning = true;
    });
    final still = MediaQuery.disableAnimationsOf(context);
    if (still) {
      _page.value = to.toDouble();
    } else {
      await _page.animateTo(to.toDouble(), duration: _turn, curve: _turnCurve);
    }
    if (mounted) {
      setState(() {
        _turning = false;
        _leaving = null;
      });
    }
  }

  // One wheel gesture turns one slide. A trackpad, or a free-spinning wheel,
  // keeps sending smaller and smaller deltas after the hand has lifted. Those
  // belong to the gesture that already turned the slide, so a new turn needs
  // a rest or a clearly stronger push.
  Duration? _wheelAt;
  var _wheelSize = 0.0;

  void _wheel(PointerScrollEvent event) {
    final size = event.scrollDelta.dy.abs();
    final last = _wheelAt;
    final rested = last == null || event.timeStamp - last > _wheelRest;
    final pushed = size > _wheelSize * 1.5 + 4;
    _wheelAt = event.timeStamp;
    _wheelSize = size;
    if (size > 4 && (rested || pushed)) {
      _go(_at + (event.scrollDelta.dy > 0 ? 1 : -1));
    }
  }

  @override
  void dispose() {
    _page.dispose();
    _cityShown.dispose();
    _warming.dispose();
    _warmingCity.dispose();
    _narrowScroll.dispose();
    _narrowHeroShown.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => LayoutBuilder(
    builder: (context, constraints) =>
        isNarrow(constraints.biggest) ? _narrow() : _wide(),
  );

  // On a narrow screen the slides become one page to scroll, each section
  // stacked in a single column, under a small bar that jumps to a section.
  final _sections = {for (final link in _links) link.section: GlobalKey()};

  void _jump(String section) {
    final target = _sections[section]?.currentContext;
    if (target == null) return;
    Scrollable.ensureVisible(
      target,
      duration: MediaQuery.disableAnimationsOf(context) ? Duration.zero : _turn,
      curve: _turnCurve,
    );
  }

  // Under the sections, the site's dark green shows past either end.
  Widget _narrow() => ColoredBox(
    color: const Color(0xFF0D3D38),
    child: Stack(
      children: [
        SharedSandBackdrop(
          child: SingleChildScrollView(
            controller: _narrowScroll,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                ValueListenableBuilder(
                  valueListenable: _narrowHeroShown,
                  builder: (context, shown, hero) =>
                      TickerMode(enabled: shown, child: hero!),
                  child: HeroSlide(
                    key: _narrowHero,
                    program: widget.program,
                    compact: true,
                  ),
                ),
                KeyedSubtree(
                  key: _sections['Components'],
                  child: ControlsSlide(onNext: () {}, compact: true),
                ),
                DetailsSlide(onNext: () {}, compact: true),
                KeyedSubtree(
                  key: _sections['Charts'],
                  child: const ChartsSlide(compact: true),
                ),
                KeyedSubtree(
                  key: _sections['Agents'],
                  child: const AgentsSlide(compact: true),
                ),
                KeyedSubtree(
                  key: _sections['Dashboard'],
                  child: const DashboardSlide(compact: true),
                ),
                KeyedSubtree(
                  key: _sections['Themes'],
                  child: ThemesSlide(
                    horizonProgram: widget.horizonProgram,
                    compact: true,
                  ),
                ),
                KeyedSubtree(
                  key: _sections['Foundations'],
                  child: const FoundationsSlide(compact: true),
                ),
                KeyedSubtree(
                  key: _sections['Use it'],
                  child: const UseSlide(compact: true),
                ),
              ],
            ),
          ),
        ),
        Positioned(left: 0, right: 0, top: 0, child: _NarrowBar(onJump: _jump)),
      ],
    ),
  );

  // The keys that move between slides. While a text field has focus (the
  // agents slide's composer) they are left to it, to move the caret.
  late final _keys = {
    const SingleActivator(LogicalKeyboardKey.arrowDown): () => _go(_at + 1),
    const SingleActivator(LogicalKeyboardKey.pageDown): () => _go(_at + 1),
    const SingleActivator(LogicalKeyboardKey.arrowUp): () => _go(_at - 1),
    const SingleActivator(LogicalKeyboardKey.pageUp): () => _go(_at - 1),
    const SingleActivator(LogicalKeyboardKey.home): () => _go(0),
    const SingleActivator(LogicalKeyboardKey.end): () =>
        _go(_slides.length - 1),
  };

  KeyEventResult _key(FocusNode node, KeyEvent event) {
    // Keys stay with a text field, and with the live dashboard, whose menus
    // and lists use the arrow keys.
    final focused = FocusManager.instance.primaryFocus?.context;
    if (focused?.findAncestorWidgetOfExactType<EditableText>() != null ||
        focused?.findAncestorWidgetOfExactType<EmbeddedApp>() != null) {
      return KeyEventResult.ignored;
    }
    for (final MapEntry(key: keys, value: go) in _keys.entries) {
      if (keys.accepts(event, HardwareKeyboard.instance)) {
        go();
        return KeyEventResult.handled;
      }
    }
    return KeyEventResult.ignored;
  }

  // The slides, made once. A turn hands the deck these same widgets again,
  // so none of them is rebuilt while it moves.
  late final _deck = <Widget>[
    HeroSlide(program: widget.program, onGo: _go),
    ControlsSlide(onNext: () => _go(2)),
    // "See the themes" opens the Themes slide.
    DetailsSlide(onNext: () => _go(6)),
    const ChartsSlide(),
    const AgentsSlide(),
    const DashboardSlide(),
    ThemesSlide(horizonProgram: widget.horizonProgram),
    const FoundationsSlide(),
    const UseSlide(),
  ];

  // A slide off the screen stays built, so turning to it costs nothing, but
  // it takes no focus and its animations rest.
  Widget _slide(int index, Widget slide) {
    final live = index == _at || index == _leaving;
    return IgnorePointer(
      ignoring: index != _at,
      child: ExcludeSemantics(
        excluding: index != _at,
        child: ExcludeFocus(
          excluding: index != _at,
          child: TickerMode(enabled: live, child: slide),
        ),
      ),
    );
  }

  Widget _wide() => Focus(
    canRequestFocus: false,
    skipTraversal: true,
    onKeyEvent: _key,
    child: Focus(
      autofocus: true,
      child: Listener(
        // One wheel turn moves one slide, unless something under the
        // pointer scrolls with it (the agents slide's conversation).
        onPointerSignal: (signal) {
          if (signal is PointerScrollEvent) {
            GestureBinding.instance.pointerSignalResolver.register(
              signal,
              (_) => _wheel(signal),
            );
          }
        },
        child: GestureDetector(
          behavior: HitTestBehavior.translucent,
          onVerticalDragEnd: (drag) {
            final speed = drag.primaryVelocity ?? 0;
            if (speed.abs() > 200) _go(_at + (speed < 0 ? 1 : -1));
          },
          child: Stack(
            children: [
              SharedSandBackdrop(
                child: SharedCityBackdrop(
                  shown: _cityShown,
                  warming: _warmingCity,
                  child: _Deck(
                    page: _page,
                    warming: _warming,
                    children: [
                      for (final (index, slide) in _deck.indexed)
                        _slide(index, slide),
                    ],
                  ),
                ),
              ),
              Positioned.fill(
                child: _Chrome(at: _at, onGo: _go),
              ),
            ],
          ),
        ),
      ),
    ),
  );
}

/// The links along the top and the dots down the side, laid out on the same
/// canvas as the slides so they line up with them.
class _Chrome extends StatelessWidget {
  const _Chrome({required this.at, required this.onGo});

  final int at;
  final ValueChanged<int> onGo;

  @override
  Widget build(BuildContext context) {
    final dark = _slides[at].dark;
    final ink = dark ? const Color(0xFFFFFFFF) : const Color(0xFF16302C);
    return LayoutBuilder(
      builder: (context, constraints) {
        final frame = canvasFrame(constraints.biggest);
        return Stack(
          children: [
            Positioned(
              left: frame.origin.dx,
              top: frame.origin.dy,
              width: canvas.width * frame.scale,
              height: canvas.height * frame.scale,
              child: FittedBox(
                child: SizedBox.fromSize(
                  size: canvas,
                  child: Stack(
                    children: [
                      // The name returns to the corner once the opening slide,
                      // which carries it large, has gone.
                      Positioned(
                        left: gutter,
                        top: 24,
                        child: AnimatedOpacity(
                          opacity: at == 0 ? 0 : 1,
                          duration: _turn,
                          child: _Link(
                            label: 'Fortal',
                            ink: ink,
                            size: 21,
                            weight: FontWeight.w700,
                            onTap: () => onGo(0),
                          ),
                        ),
                      ),
                      Positioned(
                        right: gutter,
                        top: 26,
                        child: Row(
                          spacing: Gap.x8,
                          children: [
                            for (final link in _links)
                              _Link(
                                label: link.section,
                                ink: ink,
                                size: 15.5,
                                weight: link.section == _slides[at].section
                                    ? FontWeight.w700
                                    : FontWeight.w500,
                                faded: link.section != _slides[at].section,
                                onTap: () => onGo(link.slide),
                              ),
                          ],
                        ),
                      ),
                      Positioned(
                        right: 35,
                        top: 0,
                        bottom: 0,
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          spacing: Gap.x2,
                          children: [
                            for (var i = 0; i < _slides.length; i++)
                              _Dot(
                                label: _slides[i].section,
                                on: i == at,
                                ink: ink,
                                onTap: () => onGo(i),
                              ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        );
      },
    );
  }
}

class _Link extends StatefulWidget {
  const _Link({
    required this.label,
    required this.ink,
    required this.size,
    required this.weight,
    this.faded = false,
    required this.onTap,
  });

  final String label;
  final Color ink;
  final double size;
  final FontWeight weight;
  final bool faded;
  final VoidCallback onTap;

  @override
  State<_Link> createState() => _LinkState();
}

// Tab reaches each link and Enter or Space follows it, in both layouts; the
// narrow layout has no slide keys, so these links are its keyboard route.
class _LinkState extends State<_Link> {
  var _focused = false;

  @override
  Widget build(BuildContext context) => Semantics(
    link: true,
    child: FocusableActionDetector(
      mouseCursor: SystemMouseCursors.click,
      onShowFocusHighlight: (value) => setState(() => _focused = value),
      actions: {
        ActivateIntent: CallbackAction<ActivateIntent>(
          onInvoke: (_) => widget.onTap(),
        ),
        ButtonActivateIntent: CallbackAction<ButtonActivateIntent>(
          onInvoke: (_) => widget.onTap(),
        ),
      },
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: widget.onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: Gap.x2),
          child: AnimatedDefaultTextStyle(
            duration: _turn,
            style: TextStyle(
              fontFamily: geist,
              fontSize: widget.size,
              fontWeight: widget.weight,
              color: widget.ink.withValues(alpha: widget.faded ? 0.74 : 1),
              decoration: _focused ? TextDecoration.underline : null,
              decorationColor: widget.ink,
              decorationThickness: 2,
            ),
            child: Text(widget.label),
          ),
        ),
      ),
    ),
  );
}

class _Dot extends StatelessWidget {
  const _Dot({
    required this.label,
    required this.on,
    required this.ink,
    required this.onTap,
  });

  final String label;
  final bool on;
  final Color ink;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => Semantics(
    button: true,
    label: label,
    child: MouseRegion(
      cursor: SystemMouseCursors.click,
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(Gap.x1),
          child: AnimatedContainer(
            duration: _turn,
            width: 8,
            height: on ? 26 : 8,
            decoration: BoxDecoration(
              color: ink.withValues(alpha: on ? 0.95 : 0.4),
              borderRadius: BorderRadius.circular(4),
            ),
          ),
        ),
      ),
    ),
  );
}

/// The bar across the top of the narrow layout: the section names, each a
/// jump to its section, on a dark tint so they read over any backdrop.
class _NarrowBar extends StatelessWidget {
  const _NarrowBar({required this.onJump});

  final ValueChanged<String> onJump;

  @override
  Widget build(BuildContext context) => ColoredBox(
    color: const Color(0xE6062F2B),
    // The links keep to the same column as the sections below them.
    child: Center(
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: narrowMax),
        child: SizedBox(
          width: double.infinity,
          child: FittedBox(
            fit: BoxFit.fitWidth,
            child: Container(
              width: narrowWidth,
              height: 44,
              padding: const EdgeInsets.symmetric(horizontal: Gap.x4),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  for (final link in _links)
                    _Link(
                      label: link.section,
                      ink: const Color(0xFFFFFFFF),
                      size: 14,
                      weight: FontWeight.w600,
                      onTap: () => onJump(link.section),
                    ),
                ],
              ),
            ),
          ),
        ),
      ),
    ),
  );
}

/// The slides, one screen each, stacked down the page. All of them stay built
/// and laid out, so a turn only moves two finished pictures; only the ones on
/// screen are drawn.
class _Deck extends StatelessWidget {
  const _Deck({
    required this.page,
    required this.warming,
    required this.children,
  });

  /// Where the deck is, in slides.
  final ValueListenable<double> page;

  /// A slide to draw once, unseen.
  final ValueListenable<int?> warming;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) => ClipRect(
    child: Flow(delegate: _DeckFlow(page, warming), children: children),
  );
}

class _DeckFlow extends FlowDelegate {
  _DeckFlow(this.page, this.warming)
    : super(repaint: Listenable.merge([page, warming]));

  final ValueListenable<double> page;
  final ValueListenable<int?> warming;

  // So faint it cannot be seen, yet the slide is drawn in full.
  static const _unseen = 1 / 255;

  @override
  Size getSize(BoxConstraints constraints) => constraints.biggest;

  @override
  BoxConstraints getConstraintsForChild(int i, BoxConstraints constraints) =>
      BoxConstraints.tight(constraints.biggest);

  @override
  void paintChildren(FlowPaintingContext context) {
    final height = context.size.height;
    final at = page.value;
    for (var i = 0; i < context.childCount; i++) {
      final down = (i - at) * height;
      if (down.abs() < height) {
        context.paintChild(i, transform: Matrix4.translationValues(0, down, 0));
      } else if (i == warming.value) {
        context.paintChild(i, opacity: _unseen);
      }
    }
  }

  @override
  bool shouldRepaint(_DeckFlow old) =>
      old.page != page || old.warming != warming;
}
