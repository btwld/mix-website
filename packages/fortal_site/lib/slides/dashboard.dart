// The dashboard slide: Fortal's full dashboard from the Remix registry
// (`dashboard_demo`), running live in a window on the slide. It follows the
// slides of single components, charts and agent surfaces, and shows them
// working together in one app.
import 'package:flutter/gestures.dart';
import 'package:flutter/widgets.dart';
import 'package:remix/remix.dart';

import '../backdrops.dart';
import '../kit.dart';
import '../theme.dart';
import '../ui/recipes/dashboard/dashboard_demo_theme.dart';
import '../ui/ui.dart';

class DashboardSlide extends StatelessWidget {
  const DashboardSlide({super.key, this.compact = false});

  final bool compact;

  @override
  Widget build(BuildContext context) {
    final heading = SlideHeading(
      label: 'Dashboard',
      title: 'Every piece, in one working app.',
      detail: "The registry's full dashboard: charts, tables, chat and settings. All Fortal.",
      onDark: true,
      compact: compact,
    );
    final backdrop = SandBackdrop(scene: 2);
    if (compact) {
      return NarrowSection(
        backdrop: backdrop,
        children: [
          heading,
          // At the column's own width the dashboard uses its compact layout.
          const SizedBox(height: 720, child: EmbeddedApp(size: Size(432, 720))),
        ],
      );
    }
    return SlideFrame(
      backdrop: backdrop,
      child: Stack(
        children: [
          Positioned(left: gutter, top: headingTop, width: 900, child: heading),
          // Laid out at a desktop window's size, then scaled to the room
          // under the heading.
          const Positioned(
            left: gutter,
            right: gutter,
            top: headingTop + 114 + Gap.x12,
            bottom: Gap.x12,
            child: EmbeddedApp(size: Size(1360, 660)),
          ),
        ],
      ),
    );
  }
}

/// A live app inside a slide: laid out at [size], scaled to fit, framed like
/// a window, with its own navigator, overlay and toasts.
///
/// While the pointer or keyboard focus is inside it, the wheel and the arrow
/// keys belong to the app, not to the slides (see `site.dart`).
class EmbeddedApp extends StatelessWidget {
  const EmbeddedApp({super.key, required this.size});

  final Size size;

  @override
  Widget build(BuildContext context) => Listener(
    // Anything inside that scrolls registers first; otherwise this keeps the
    // wheel from turning the slide.
    onPointerSignal: (signal) {
      if (signal is PointerScrollEvent) {
        GestureBinding.instance.pointerSignalResolver.register(signal, (_) {});
      }
    },
    child: GestureDetector(
      // Likewise a drag that nothing inside takes does not turn the slide.
      onVerticalDragUpdate: (_) {},
      child: Container(
        clipBehavior: Clip.antiAlias,
        decoration: BoxDecoration(
          borderRadius: tokenRadius(context, UiTokens.radius5),
          border: Border.all(color: const Color(0x33FFFFFF)),
          boxShadow: const [
            BoxShadow(
              color: Color(0x59000000),
              blurRadius: 32,
              offset: Offset(0, 16),
            ),
          ],
        ),
        child: FittedBox(
          child: SizedBox.fromSize(
            size: size,
            child: MediaQuery(
              data: MediaQuery.of(context).copyWith(size: size),
              child: const _Dashboard(),
            ),
          ),
        ),
      ),
    ),
  );
}

class _Dashboard extends StatefulWidget {
  const _Dashboard();

  @override
  State<_Dashboard> createState() => _DashboardState();
}

// The dashboard's theme settings live above its navigator, in the scope it
// reads, so they reach every page. The site's choices on the Themes slide
// set them; the dashboard's own theme panel changes them in between.
class _DashboardState extends State<_Dashboard> {
  late var _settings = _fromSite();

  static UiThemeSettings _fromSite() => UiThemeSettings(
    appearance: .light,
    accentColor: siteAccent.value,
    radius: siteRadius.value,
    scaling: siteScaling.value,
  );

  void _follow() => setState(() => _settings = _fromSite());

  @override
  void initState() {
    super.initState();
    siteTheme.addListener(_follow);
  }

  @override
  void dispose() {
    siteTheme.removeListener(_follow);
    super.dispose();
  }

  // As the dashboard's own app does, its theme sits above the navigator and
  // paints the page background: the site's theme leaves the background
  // clear for its scenery, which would otherwise show through the app.
  @override
  Widget build(BuildContext context) => UiDashboardThemeScope(
    settings: _settings,
    onChanged: (settings) => setState(() => _settings = settings),
    child: UiTheme(
      mode: _settings.appearance,
      accent: _settings.accentColor,
      panelBackground: _settings.panelBackground,
      radius: _settings.radius,
      scaling: _settings.scaling,
      hasBackground: true,
      child: Overlay.wrap(
        child: RemixToastScope(
          style: uiToastStyle(),
          child: Navigator(
            onGenerateRoute: (settings) => PageRouteBuilder<void>(
              settings: settings,
              pageBuilder: (context, animation, secondaryAnimation) =>
                  const UiDashboardDemo(
                    chatStepDelay: Duration(milliseconds: 420),
                  ),
            ),
          ),
        ),
      ),
    ),
  );
}
