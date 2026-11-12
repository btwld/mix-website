// Every slide laid out in both layouts, at each scaling and radius a visitor
// can pick: nothing may overflow, and on the wide slides after the first,
// every card must end at least 48 above the canvas's foot (12 at 110%, where
// the components and agents slides take that room).
//
// The site's own fonts are loaded, so text is measured as in a browser; the
// shore's shader is loaded but not judged. This checks layout only: not how a
// slide looks, how it scales on a real screen, or the colours.
import 'dart:ui' show FragmentProgram;

import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:fortal_landing/bento.dart';
import 'package:fortal_landing/kit.dart';
import 'package:fortal_landing/shore.dart';
import 'package:fortal_landing/slides/agents.dart';
import 'package:fortal_landing/slides/charts.dart';
import 'package:fortal_landing/slides/dashboard.dart';
import 'package:fortal_landing/slides/foundations.dart';
import 'package:fortal_landing/slides/gallery.dart';
import 'package:fortal_landing/slides/hero.dart';
import 'package:fortal_landing/slides/themes.dart';
import 'package:fortal_landing/slides/use.dart';
import 'package:fortal_landing/theme.dart';
import 'package:fortal_landing/ui/ui.dart';

Future<void> _loadFonts() async {
  final family = FontLoader(geist);
  for (final weight in ['Regular', 'Medium', 'SemiBold', 'Bold']) {
    family.addFont(rootBundle.load('assets/fonts/Geist-$weight.ttf'));
  }
  await family.load();
  await (FontLoader(
    mono,
  )..addFont(rootBundle.load('assets/fonts/RobotoMono.ttf'))).load();
}

/// The slide in the site's theme, as `main.dart` wraps it.
Widget _app(Widget slide) => WidgetsApp(
  color: const Color(0xFF000000),
  textStyle: const TextStyle(fontFamily: geist),
  builder: (context, _) => UiTheme(
    mode: UiThemeMode.light,
    accent: siteAccent.value,
    radius: siteRadius.value,
    scaling: siteScaling.value,
    hasBackground: false,
    child: FortalTheme(accent: siteAccent.value, child: slide),
  ),
);

void main() {
  late FragmentProgram program;

  setUpAll(() async {
    await _loadFonts();
    program = await FragmentProgram.fromAsset('shaders/shore.frag');
  });

  Map<String, Widget> slides({required bool compact}) => {
    'Fortal': HeroSlide(program: program, compact: compact),
    'Dashboard': DashboardSlide(compact: compact),
    'Components': ControlsSlide(onNext: () {}, compact: compact),
    'Components, continued': DetailsSlide(onNext: () {}, compact: compact),
    'Charts': ChartsSlide(compact: compact),
    'Agents': AgentsSlide(compact: compact),
    'Themes': ThemesSlide(compact: compact),
    'Use it': UseSlide(compact: compact),
    'Foundations': FoundationsSlide(compact: compact),
  };

  for (final (scaling, radius) in [
    (UiScaling.percent100, UiRadius.medium),
    (UiScaling.percent90, UiRadius.none),
    (UiScaling.percent110, UiRadius.full),
  ]) {
    final setting = '${scaling.name}, ${radius.name}';

    testWidgets('wide slides fit the canvas ($setting)', (tester) async {
      siteScaling.value = scaling;
      siteRadius.value = radius;
      addTearDown(() {
        siteScaling.value = UiScaling.percent100;
        siteRadius.value = UiRadius.medium;
      });
      tester.view.physicalSize = canvas;
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.reset);
      for (final MapEntry(key: name, value: slide) in slides(
        compact: false,
      ).entries) {
        await tester.pumpWidget(_app(slide));
        await tester.pump(const Duration(milliseconds: 50));
        expect(tester.takeException(), isNull, reason: name);
        if (name == 'Fortal') continue; // its cards run off the bottom
        final margin = scaling == UiScaling.percent110 ? Gap.x3 : Gap.x12;
        // The dashboard's own cards scroll inside its window, so the window
        // is what must end above the foot.
        final ends = name == 'Dashboard'
            ? find.byType(EmbeddedApp)
            : find.byType(UiCard);
        if (name == 'Dashboard') expect(ends, findsOneWidget);
        for (final card in ends.evaluate()) {
          final box = card.renderObject! as RenderBox;
          final bottom = box.localToGlobal(Offset(0, box.size.height)).dy;
          expect(
            bottom,
            lessThanOrEqualTo(canvas.height - margin + 0.5),
            reason:
                '$name: a card ends ${canvas.height - bottom} from the foot',
          );
        }
      }
    });

    testWidgets('narrow sections lay out ($setting)', (tester) async {
      siteScaling.value = scaling;
      siteRadius.value = radius;
      addTearDown(() {
        siteScaling.value = UiScaling.percent100;
        siteRadius.value = UiRadius.medium;
      });
      tester.view.physicalSize = const Size(narrowWidth, 900);
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.reset);
      for (final MapEntry(key: name, value: slide) in slides(
        compact: true,
      ).entries) {
        await tester.pumpWidget(_app(SingleChildScrollView(child: slide)));
        await tester.pump(const Duration(milliseconds: 50));
        expect(tester.takeException(), isNull, reason: name);
      }
    });

    // The opening slide's cards are as tall as their content, so the boxes
    // the shader is given must be the ones the cards really take.
    for (final compact in [false, true]) {
      final layout = compact ? 'narrow' : 'wide';
      testWidgets('the shore gets the cards\' real boxes ($layout, $setting)', (
        tester,
      ) async {
        siteScaling.value = scaling;
        siteRadius.value = radius;
        addTearDown(() {
          siteScaling.value = UiScaling.percent100;
          siteRadius.value = UiRadius.medium;
        });
        // At these sizes the canvas is drawn at its own scale from the
        // screen's top left, so screen positions are canvas units.
        tester.view.physicalSize = compact
            ? const Size(narrowWidth, 900)
            : canvas;
        tester.view.devicePixelRatio = 1;
        addTearDown(tester.view.reset);
        final hero = HeroSlide(program: program, compact: compact);
        await tester.pumpWidget(
          _app(compact ? SingleChildScrollView(child: hero) : hero),
        );
        await tester.pump(const Duration(milliseconds: 50));
        await tester.pump(const Duration(milliseconds: 50));
        expect(tester.takeException(), isNull);

        final given = tester.widgetList<Shore>(find.byType(Shore));
        expect(given, hasLength(2));
        final cards = given.first.cards;
        expect(given.last.cards, same(cards));
        final drawn = [
          for (final card in find.byType(UiCard).evaluate())
            () {
              final box = card.renderObject! as RenderBox;
              return box.localToGlobal(Offset.zero) & box.size;
            }(),
        ];
        expect(drawn, hasLength(8));
        for (final (i, box) in drawn.indexed) {
          // The cards are drawn with the wave's shove, which the shore adds
          // to the boxes itself.
          final expected = cards[i].shift(
            Offset(0, waveNudge(cards[i], cards, 0)),
          );
          for (final (edge, a, b) in [
            ('left', box.left, expected.left),
            ('top', box.top, expected.top),
            ('right', box.right, expected.right),
            ('bottom', box.bottom, expected.bottom),
          ]) {
            expect(
              a,
              moreOrLessEquals(b, epsilon: 0.01),
              reason: 'card $i $edge',
            );
          }
        }
        if (scaling == UiScaling.percent100 && radius == UiRadius.medium) {
          // The first guess the shore starts from is the 100% layout.
          final guess = compact ? measuredNarrowCards : measuredWideCards;
          expect(
            [for (final c in cards) c.height.roundToDouble()],
            [for (final c in guess) c.height],
            reason:
                'update the measured boxes in bento.dart: '
                '${[for (final c in cards) 'Rect.fromLTWH(${c.left}, ${c.top}, ${c.width}, ${c.height.round()})'].join(', ')}',
          );
        }
      });
    }
  }
}
