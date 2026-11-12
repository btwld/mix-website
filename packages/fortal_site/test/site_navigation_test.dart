import 'dart:ui' show FragmentProgram;

import 'package:flutter/gestures.dart';
import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:fortal_landing/site.dart';
import 'package:fortal_landing/slides/agents.dart';
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

  testWidgets('wheel momentum stays on one slide and keeps agent state', (
    tester,
  ) async {
    final shore = await FragmentProgram.fromAsset('shaders/shore.frag');
    final horizon = await FragmentProgram.fromAsset('shaders/horizon.frag');
    tester.view.physicalSize = const Size(1440, 900);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.reset);
    await tester.pumpWidget(
      WidgetsApp(
        color: const Color(0xFF000000),
        textStyle: const TextStyle(fontFamily: geist),
        builder: (context, _) => MediaQuery(
          // Instant turns make it possible to test the gesture lock without
          // the animation's own lock hiding an unwanted second turn.
          data: MediaQuery.of(context).copyWith(disableAnimations: true),
          child: UiTheme(
            hasBackground: false,
            child: FortalTheme(
              accent: siteAccent.value,
              child: Site(program: shore, horizonProgram: horizon),
            ),
          ),
        ),
      ),
    );
    await tester.pump();

    bool live(Type type) =>
        TickerMode.valuesOf(tester.element(find.byType(type))).enabled;
    final agent = tester.element(find.byType(AgentsSlide));
    final field = tester.widget<EditableText>(
      find.descendant(
        of: find.byType(AgentsSlide),
        matching: find.byType(EditableText),
      ),
    );
    field.controller.text = 'Keep my draft';
    expect(live(HeroSlide), isTrue);

    Future<void> wheel(int ms, double delta) async {
      await tester.sendEventToBinding(
        PointerScrollEvent(
          position: const Offset(1300, 130),
          timeStamp: Duration(milliseconds: ms),
          scrollDelta: Offset(0, delta),
        ),
      );
      await tester.pump(const Duration(milliseconds: 60));
    }

    await wheel(1000, 120);
    expect(live(ControlsSlide), isTrue);
    expect(live(HeroSlide), isFalse);
    for (final (i, delta) in [90.0, 60.0, 30.0, 12.0, 6.0].indexed) {
      await wheel(1060 + i * 60, delta);
    }
    expect(live(ControlsSlide), isTrue);
    expect(live(DetailsSlide), isFalse);

    await wheel(2000, 120);
    expect(live(DetailsSlide), isTrue);
    expect(tester.element(find.byType(AgentsSlide)), same(agent));
    expect(field.controller.text, 'Keep my draft');
    await tester.pumpWidget(const SizedBox.shrink());
    await tester.pumpAndSettle();
  });
}
