import 'package:flutter/widgets.dart';
import 'package:mix/mix.dart';

import '../theme.dart';
import '../ui/ui.dart';
import 'demos.dart';
import 'host.dart';

final _canvas = BoxStyler()
    .color($canvas())
    .animate(.easeOut(260.ms));

/// One example on the theme's canvas, inside the app shell it needs:
/// tokens above, then text direction, shortcuts and an overlay.
class DemoView extends StatelessWidget {
  const DemoView({
    super.key,
    required this.demo,
    required this.host,
  });

  final String demo;
  final Host host;

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: host,
      builder: (context, child) {
        // Only the tokens example follows the page's theme.
        final theme = demo == 'tokens'
            ? host.theme
            : midnight;
        return ThemeScope(
          theme: theme,
          child: WidgetsApp(
            color: theme.colors[$primary]!,
            debugShowCheckedModeBanner: false,
            textStyle: TextStyle(
              fontFamily: theme.font,
              fontSize: 14,
              color: theme.colors[$ink],
            ),
            // No Navigator: it would take keyboard focus the moment a view
            // appears, wherever the reader is on the page. The examples only
            // need an Overlay, for the select's menu.
            builder: (context, child) {
              final stage = Overlay.wrap(
                child: _Stage(
                  demo: demo,
                  host: host,
                  canvas: theme.colors[$canvas]!,
                ),
              );
              // The installed Remix components read their values from here.
              return _LeaveAtEdges(
                child: demo == 'remix'
                    ? UiTheme(
                        mode: UiThemeMode.light,
                        child: stage,
                      )
                    : stage,
              );
            },
          ),
        );
      },
    );
  }
}

/// Tab past the last control, or Shift+Tab before the first, leaves the view
/// for the rest of the page, as on any web page. The view's own focus scope
/// wraps around instead; on the web a Navigator would change that, and the
/// views have none.
class _LeaveAtEdges extends StatefulWidget {
  const _LeaveAtEdges({required this.child});

  final Widget child;

  @override
  State<_LeaveAtEdges> createState() =>
      _LeaveAtEdgesState();
}

class _LeaveAtEdgesState extends State<_LeaveAtEdges> {
  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    FocusScope.of(context).traversalEdgeBehavior =
        TraversalEdgeBehavior.leaveFlutterView;
  }

  @override
  Widget build(BuildContext context) => widget.child;
}

class _Stage extends StatelessWidget {
  const _Stage({
    required this.demo,
    required this.host,
    required this.canvas,
  });

  final String demo;
  final Host host;

  /// A value rather than `$canvas()`: under the Remix example, `UiTheme`'s
  /// own scope replaces the one that defines `$canvas`.
  final Color canvas;

  @override
  Widget build(BuildContext context) {
    return BoxStyler()
        .color(canvas)
        .animate(.easeOut(260.ms))(
      child: ListenableBuilder(
        listenable: host,
        builder: (context, child) {
          return Center(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: buildDemo(demo, host),
            ),
          );
        },
      ),
    );
  }
}

/// On the website: one engine, and one view per example on the page.
class EmbeddedViews extends StatefulWidget {
  const EmbeddedViews({super.key, required this.host});

  final Host host;

  @override
  State<EmbeddedViews> createState() =>
      _EmbeddedViewsState();
}

class _EmbeddedViewsState extends State<EmbeddedViews>
    with WidgetsBindingObserver {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  // Views come and go as the page mounts and unmounts examples.
  @override
  void didChangeMetrics() => setState(() {});

  @override
  Widget build(BuildContext context) {
    return ViewCollection(
      views: [
        for (final view
            in WidgetsBinding
                .instance
                .platformDispatcher
                .views)
          View(
            view: view,
            child: ListenableBuilder(
              listenable: widget.host,
              builder: (context, child) {
                final demo = widget.host.demoOf(
                  view.viewId,
                );
                // A new key gives a re-pointed view a fresh example.
                return DemoView(
                  key: ValueKey(demo),
                  demo: demo,
                  host: widget.host,
                );
              },
            ),
          ),
      ],
    );
  }
}

/// Run on its own (`flutter run -d chrome`): every example on one page.
class Gallery extends StatelessWidget {
  const Gallery({super.key, required this.host});

  final Host host;

  @override
  Widget build(BuildContext context) {
    final chip = BoxStyler()
        .padding(.symmetric(horizontal: 14, vertical: 9))
        .borderRadius(.all($radius()))
        .border(.color($outline()).width(1.5))
        .onHovered(.color($surface()));
    final text = TextStyler()
        .style($label.mix())
        .color($ink());

    return ListenableBuilder(
      listenable: host,
      builder: (context, child) => ThemeScope(
        theme: host.theme,
        child: WidgetsApp(
          color: host.theme.colors[$primary]!,
          debugShowCheckedModeBanner: false,
          pageRouteBuilder: <T>(settings, builder) =>
              PageRouteBuilder<T>(
                settings: settings,
                pageBuilder:
                    (context, animation, secondary) =>
                        builder(context),
              ),
          home: _canvas(
            child: ListView(
              padding: const EdgeInsets.all(24),
              children: [
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    for (final id in themes.keys)
                      chip.pressable(
                        onPress: () =>
                            host.apply({'theme': id}),
                        child: text(
                          id[0].toUpperCase() +
                              id.substring(1),
                        ),
                      ),
                  ],
                ),
                for (final id in demoIds)
                  Padding(
                    padding: const EdgeInsets.symmetric(
                      vertical: 28,
                    ),
                    child: Column(
                      spacing: 14,
                      children: [
                        text.color($muted())(id),
                        ListenableBuilder(
                          listenable: host,
                          // The installed Remix components read their values
                          // from UiTheme, as in DemoView.
                          builder: (context, child) =>
                              id == 'remix'
                              ? UiTheme(
                                  mode: UiThemeMode.light,
                                  child: buildDemo(
                                    id,
                                    host,
                                  ),
                                )
                              : buildDemo(id, host),
                        ),
                      ],
                    ),
                  ),
                SizedBox(
                  height: 320,
                  child: buildDemo('responsive', host),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
