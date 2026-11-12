import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:fortal_landing/kit.dart';
import 'package:fortal_landing/slides/themes.dart';
import 'package:fortal_landing/theme.dart';
import 'package:fortal_landing/ui/ui.dart';

void main() {
  setUpAll(() async {
    // The site's own faces, so the rows lay out as they do on the page.
    final family = FontLoader(geist);
    for (final weight in ['Regular', 'Medium', 'SemiBold', 'Bold']) {
      family.addFont(rootBundle.load('assets/fonts/Geist-$weight.ttf'));
    }
    await family.load();
  });

  testWidgets('a theme on the Themes slide can be chosen from the keyboard', (
    tester,
  ) async {
    addTearDown(() => siteAccent.value = UiAccentColor.mar);
    tester.view.physicalSize = canvas;
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
            child: const ThemesSlide(),
          ),
        ),
      ),
    );
    await tester.pump();

    final row = find.ancestor(
      of: find.text('Céu'),
      matching: find.byType(FocusableActionDetector),
    );
    expect(row, findsOneWidget);
    Focus.of(tester.element(find.text('Céu'))).requestFocus();
    await tester.pump();
    await tester.sendKeyEvent(LogicalKeyboardKey.space);
    await tester.pump();
    expect(siteAccent.value, UiAccentColor.ceu);
  });
}
