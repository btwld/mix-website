import 'dart:ui' show FragmentProgram;

import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:fortal_landing/site.dart';
import 'package:fortal_landing/theme.dart';
import 'package:fortal_landing/ui/ui.dart';

void main() {
  setUpAll(() async {
    // The site's own faces, so the sections lay out as they do on the page.
    final family = FontLoader(geist);
    for (final weight in ['Regular', 'Medium', 'SemiBold', 'Bold']) {
      family.addFont(rootBundle.load('assets/fonts/Geist-$weight.ttf'));
    }
    await family.load();
    await (FontLoader(
      mono,
    )..addFont(rootBundle.load('assets/fonts/RobotoMono.ttf'))).load();
  });

  testWidgets('the narrow layout\'s section links work from the keyboard', (
    tester,
  ) async {
    final shore = await FragmentProgram.fromAsset('shaders/shore.frag');
    final horizon = await FragmentProgram.fromAsset('shaders/horizon.frag');
    tester.view.physicalSize = const Size(430, 932);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.reset);
    await tester.pumpWidget(
      WidgetsApp(
        color: const Color(0xFF000000),
        textStyle: const TextStyle(fontFamily: geist),
        builder: (context, _) => UiTheme(
          mode: UiThemeMode.light,
          accent: siteAccent.value,
          hasBackground: false,
          child: FortalTheme(
            accent: siteAccent.value,
            child: Site(program: shore, horizonProgram: horizon),
          ),
        ),
      ),
    );
    await tester.pump(const Duration(milliseconds: 100));

    final scroll = tester.state<ScrollableState>(find.byType(Scrollable).first);
    expect(scroll.position.pixels, 0);

    // The bar's "Use it" link, drawn over the sections (the last "Use it":
    // the slide's own step is also called that), takes focus and follows on
    // Enter.
    Focus.of(tester.element(find.text('Use it').last)).requestFocus();
    await tester.pump();
    await tester.sendKeyEvent(LogicalKeyboardKey.enter);
    for (var i = 0; i < 10; i++) {
      await tester.pump(const Duration(milliseconds: 100));
    }
    expect(scroll.position.pixels, greaterThan(0));
  });
}
