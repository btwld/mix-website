// The site: full-screen slides, one above the next. A wheel turn, a swipe, the
// arrow keys, the links at the top or the dots at the side move between them.
import 'dart:ui' as ui;

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

const _turn = Duration(milliseconds: 620);

class Site extends StatefulWidget {
  const Site({super.key, required this.program, required this.horizonProgram});

  final ui.FragmentProgram program;
  final ui.FragmentProgram horizonProgram;

  @override
  State<Site> createState() => _SiteState();
}

class _SiteState extends State<Site> {
  // `?slide=2` opens on that slide.
  late var _at = (int.tryParse(Uri.base.queryParameters['slide'] ?? '') ?? 0)
      .clamp(0, _slides.length - 1);
  late final _pages = PageController(initialPage: _at)..addListener(_showCity);
  late final _cityShown = ValueNotifier(_at >= _firstCitySlide);
  var _turning = false;

  @override
  void initState() {
    super.initState();
    // Fetch the closing slides' photo once the first frame is up, so it is
    // ready before anyone reaches them rather than fading in on arrival.
    WidgetsBinding.instance.addPostFrameCallback((_) => CityPhoto.load());
  }

  // The shared photo shows once the turn has left the slide before it.
  void _showCity() {
    final page = _pages.hasClients ? _pages.page : null;
    if (page != null) _cityShown.value = page > _firstCitySlide - 1;
  }

  Future<void> _go(int slide) async {
    final to = slide.clamp(0, _slides.length - 1);
    if (to == _at || _turning) return;
    setState(() {
      _at = to;
      _turning = true;
    });
    final still = MediaQuery.disableAnimationsOf(context);
    if (still) {
      _pages.jumpToPage(to);
    } else {
      await _pages.animateToPage(
        to,
        duration: _turn,
        curve: Curves.easeInOutCubic,
      );
    }
    if (mounted) setState(() => _turning = false);
  }

  @override
  void dispose() {
    _pages.dispose();
    _cityShown.dispose();
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
      curve: Curves.easeInOutCubic,
    );
  }

  // Under the sections, the site's dark green shows past either end.
  Widget _narrow() => ColoredBox(
    color: const Color(0xFF0D3D38),
    child: Stack(
      children: [
        SharedSandBackdrop(
          child: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                HeroSlide(program: widget.program, active: true, compact: true),
                KeyedSubtree(
                  key: _sections['Components'],
                  child: ControlsSlide(
                    onNext: () {},
                    active: false,
                    compact: true,
                  ),
                ),
                DetailsSlide(onNext: () {}, active: false, compact: true),
                KeyedSubtree(
                  key: _sections['Charts'],
                  child: const ChartsSlide(active: false, compact: true),
                ),
                KeyedSubtree(
                  key: _sections['Agents'],
                  child: const AgentsSlide(active: false, compact: true),
                ),
                KeyedSubtree(
                  key: _sections['Dashboard'],
                  child: const DashboardSlide(active: false, compact: true),
                ),
                KeyedSubtree(
                  key: _sections['Themes'],
                  child: ThemesSlide(
                    horizonProgram: widget.horizonProgram,
                    active: false,
                    compact: true,
                  ),
                ),
                KeyedSubtree(
                  key: _sections['Foundations'],
                  child: const FoundationsSlide(active: false, compact: true),
                ),
                KeyedSubtree(
                  key: _sections['Use it'],
                  child: const UseSlide(active: false, compact: true),
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

  // A trip through the narrow layout rebuilds the slides' PageView, which
  // would start again at the controller's first page; put it back on the
  // current slide.
  void _keepPage() {
    if (!_pages.hasClients || _turning) return;
    if (_pages.page?.round() != _at) _pages.jumpToPage(_at);
  }

  Widget _wide() {
    WidgetsBinding.instance.addPostFrameCallback((_) => _keepPage());
    return _wideSlides();
  }

  Widget _wideSlides() => Focus(
    canRequestFocus: false,
    skipTraversal: true,
    onKeyEvent: _key,
    child: Focus(
      autofocus: true,
      child: Listener(
        // One wheel turn moves one slide, unless something under the
        // pointer scrolls with it (the agents slide's conversation).
        onPointerSignal: (signal) {
          if (signal is PointerScrollEvent && signal.scrollDelta.dy.abs() > 4) {
            GestureBinding.instance.pointerSignalResolver.register(
              signal,
              (_) => _go(_at + (signal.scrollDelta.dy > 0 ? 1 : -1)),
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
                active: _turning || (_at >= 1 && _at <= 5),
                child: SharedCityBackdrop(
                  shown: _cityShown,
                  active: _at >= _firstCitySlide,
                  child: PageView(
                    controller: _pages,
                    scrollDirection: Axis.vertical,
                    physics: const NeverScrollableScrollPhysics(),
                    children: [
                      HeroSlide(
                        program: widget.program,
                        active: _at == 0,
                        onGo: _go,
                      ),
                      ControlsSlide(onNext: () => _go(2), active: _at == 1),
                      // "See the themes" opens the Themes slide.
                      DetailsSlide(onNext: () => _go(6), active: _at == 2),
                      ChartsSlide(active: _at == 3),
                      AgentsSlide(active: _at == 4),
                      DashboardSlide(active: _at == 5),
                      ThemesSlide(
                        horizonProgram: widget.horizonProgram,
                        active: _at == 6,
                      ),
                      FoundationsSlide(active: _at == 7),
                      UseSlide(active: _at == 8),
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
