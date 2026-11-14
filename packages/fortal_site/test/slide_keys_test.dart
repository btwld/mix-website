import 'dart:ui'
    show FragmentProgram, ViewFocusDirection, ViewFocusEvent, ViewFocusState;

import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:fortal_landing/site.dart';
import 'package:fortal_landing/slides/gallery.dart';
import 'package:fortal_landing/slides/hero.dart';
import 'package:fortal_landing/theme.dart';
import 'package:fortal_landing/ui/ui.dart';

void main() {
  setUpAll(() async {
    final family = FontLoader(geist);
    for (final weight in ['Regular', 'Medium', 'SemiBold', 'Bold']) {
      family.addFont(rootBundle.load('assets/fonts/Geist-$weight.ttf'));
    }
    await family.load();
    await (FontLoader(
      mono,
    )..addFont(rootBundle.load('assets/fonts/RobotoMono.ttf'))).load();
  });

  // The site as `main.dart` runs it: the deck is the app's home route, so the
  // route's focus scope sits between the view and the deck.
  Future<void> openSite(WidgetTester tester) async {
    final shore = await FragmentProgram.fromAsset('shaders/shore.frag');
    final horizon = await FragmentProgram.fromAsset('shaders/horizon.frag');
    tester.view.physicalSize = const Size(1440, 900);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.reset);
    await tester.pumpWidget(
      WidgetsApp(
        color: const Color(0xFF000000),
        textStyle: const TextStyle(fontFamily: geist),
        pageRouteBuilder: <T>(settings, builder) => PageRouteBuilder<T>(
          settings: settings,
          pageBuilder: (context, animation, secondaryAnimation) =>
              builder(context),
        ),
        builder: (context, child) => MediaQuery(
          data: MediaQuery.of(context).copyWith(disableAnimations: true),
          child: UiTheme(
            hasBackground: false,
            child: FortalTheme(accent: siteAccent.value, child: child!),
          ),
        ),
        home: Site(program: shore, horizonProgram: horizon),
      ),
    );
    await tester.pump();
  }

  bool live(WidgetTester tester, Type type) =>
      TickerMode.valuesOf(tester.element(find.byType(type))).enabled;

  Future<void> closeSite(WidgetTester tester) async {
    await tester.pumpWidget(const SizedBox.shrink());
    await tester.pumpAndSettle();
  }

  testWidgets('the arrow keys turn the deck as soon as the site opens', (
    tester,
  ) async {
    await openSite(tester);
    expect(live(tester, HeroSlide), isTrue);

    await tester.sendKeyEvent(LogicalKeyboardKey.arrowDown);
    await tester.pump();
    expect(live(tester, ControlsSlide), isTrue);
    await closeSite(tester);
  });

  // A browser page often opens without keyboard focus on the Flutter view
  // (focus is still in the address bar), and the view receives it later, when
  // the visitor clicks or tabs into the page.
  for (final direction in ViewFocusDirection.values) {
    testWidgets('the arrow keys turn the deck once the page gets focus '
        '(${direction.name})', (tester) async {
      await openSite(tester);
      final view = tester.view.viewId;
      tester.binding.handleViewFocusChanged(
        ViewFocusEvent(
          viewId: view,
          state: ViewFocusState.unfocused,
          direction: ViewFocusDirection.undefined,
        ),
      );
      await tester.pump();
      tester.binding.handleViewFocusChanged(
        ViewFocusEvent(
          viewId: view,
          state: ViewFocusState.focused,
          direction: direction,
        ),
      );
      await tester.pump();

      await tester.sendKeyEvent(LogicalKeyboardKey.arrowDown);
      await tester.pump();
      expect(live(tester, ControlsSlide), isTrue);
      await closeSite(tester);
    });
  }
}
