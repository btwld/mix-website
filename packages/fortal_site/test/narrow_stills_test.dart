import 'dart:ui' show FragmentProgram;

import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:fortal_landing/backdrops.dart';
import 'package:fortal_landing/site.dart';
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

  // The site as main.dart runs it, its backdrop shaders from BackdropPrograms.
  Future<void> openSite(WidgetTester tester, Size screen) async {
    final shore = await FragmentProgram.fromAsset('shaders/shore.frag');
    tester.view.physicalSize = screen;
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
            child: FortalTheme(
              accent: siteAccent.value,
              child: ValueListenableBuilder(
                valueListenable: BackdropPrograms.loaded,
                builder: (context, programs, child) => BackdropShaders(
                  horizon: programs?.horizon,
                  dunes: programs?.dunes,
                  child: child!,
                ),
                child: child,
              ),
            ),
          ),
        ),
        home: Site(program: shore),
      ),
    );
    await tester.pump();
  }

  Future<void> closeSite(WidgetTester tester) async {
    await tester.pumpWidget(const SizedBox.shrink());
    await tester.pumpAndSettle();
  }

  Set<String> stills(WidgetTester tester) => {
    for (final still in tester.widgetList<BackdropStill>(
      find.byType(BackdropStill, skipOffstage: false),
    ))
      still.asset,
  };

  // Runs first: nothing in this file has loaded the backdrop shaders yet.
  testWidgets('a phone shows pictures of the backdrops and loads no shader '
      'but the shore', (tester) async {
    addTearDown(() => siteAccent.value = UiAccentColor.mar);
    await openSite(tester, const Size(390, 844));
    expect(stills(tester), {
      'assets/stills/dunes-mar.webp',
      'assets/stills/horizon-mar.webp',
      'assets/stills/city.webp',
    });

    // A theme picked on the Themes section brings its own pictures.
    siteAccent.value = UiAccentColor.sol;
    await tester.pump();
    expect(stills(tester), contains('assets/stills/dunes-sol.webp'));
    expect(stills(tester), contains('assets/stills/horizon-sol.webp'));

    await tester.runAsync(
      () => Future<void>.delayed(const Duration(milliseconds: 300)),
    );
    expect(BackdropPrograms.loaded.value, isNull);
    await closeSite(tester);
  });

  testWidgets('every theme has its pictures', (tester) async {
    for (final accent in UiAccentColor.values) {
      for (final still in [
        BackdropStill.dunes(accent),
        BackdropStill.horizon(accent),
      ]) {
        expect((await rootBundle.load(still.asset)).lengthInBytes, isNonZero);
      }
    }
    final city = const BackdropStill.city().asset;
    expect((await rootBundle.load(city)).lengthInBytes, isNonZero);
  });

  testWidgets('a wide screen loads the backdrop shaders and draws them', (
    tester,
  ) async {
    await openSite(tester, const Size(1440, 900));
    await tester.runAsync(BackdropPrograms.load);
    await tester.pump();
    expect(BackdropPrograms.loaded.value, isNotNull);
    expect(stills(tester), isEmpty);
    await closeSite(tester);
  });
}
