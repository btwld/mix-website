import 'dart:ui' show FragmentProgram;

import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:fortal_landing/backdrops.dart';
import 'package:fortal_landing/theme.dart';
import 'package:fortal_landing/ui/ui.dart';

void main() {
  late FragmentProgram dunes;
  late FragmentProgram horizon;
  setUpAll(() async {
    dunes = await FragmentProgram.fromAsset('shaders/dunes.frag');
    horizon = await FragmentProgram.fromAsset('shaders/horizon.frag');
  });

  for (final reduced in [false, true]) {
    testWidgets('shader backdrops settle and dispose (reduced=$reduced)', (
      tester,
    ) async {
      for (final backdrop in [
        SandBackdrop(program: dunes, active: reduced),
        HorizonBackdrop(
          sky: const Color(0xFFABD6EB),
          haze: const Color(0xFFF0E3CB),
          sea: const Color(0xFF268F9E),
          deep: const Color(0xFF17455E),
          program: horizon,
          active: reduced,
        ),
        NightSeaBackdrop(program: horizon, active: reduced),
        BackdropShaders(
          horizon: horizon,
          dunes: dunes,
          child: SharedSandBackdrop(
            active: reduced,
            child: const Column(
              children: [
                Expanded(child: SandBackdrop()),
                Expanded(child: SandBackdrop()),
              ],
            ),
          ),
        ),
      ]) {
        await tester.pumpWidget(
          Directionality(
            textDirection: TextDirection.ltr,
            child: MediaQuery(
              data: MediaQueryData(disableAnimations: reduced),
              child: UiTheme(
                child: FortalTheme(
                  accent: siteAccent.value,
                  child: SizedBox(width: 400, height: 300, child: backdrop),
                ),
              ),
            ),
          ),
        );
        await tester.pumpAndSettle();
        expect(tester.takeException(), isNull);
        expect(tester.binding.hasScheduledFrame, isFalse);
        if (backdrop is BackdropShaders) {
          // Nested sections reuse the fixed canvas, without duplicate shaders.
          expect(
            find.descendant(
              of: find.byType(SandBackdrop),
              matching: find.byType(CustomPaint),
            ),
            findsOneWidget,
          );
        }
        await tester.pumpWidget(const SizedBox.shrink());
        expect(tester.takeException(), isNull);
      }
    });
  }

  testWidgets('shared lagoon animates, persists, pauses and resumes', (
    tester,
  ) async {
    Widget host({
      bool active = true,
      bool reduced = false,
      String section = 'A',
    }) => Directionality(
      textDirection: TextDirection.ltr,
      child: MediaQuery(
        data: MediaQueryData(disableAnimations: reduced),
        child: UiTheme(
          child: FortalTheme(
            accent: siteAccent.value,
            child: BackdropShaders(
              horizon: horizon,
              dunes: dunes,
              child: SharedSandBackdrop(
                active: active,
                child: Center(child: Text(section)),
              ),
            ),
          ),
        ),
      ),
    );

    await tester.pumpWidget(host());
    final paint = find.descendant(
      of: find.byType(SandBackdrop),
      matching: find.byType(CustomPaint),
    );
    final canvas = tester.renderObject(paint);
    final painter = tester.widget<CustomPaint>(paint).painter!;
    var repaints = 0;
    void onRepaint() => repaints++;
    painter.addListener(onRepaint);
    await tester.pump(const Duration(milliseconds: 100));
    expect(repaints, greaterThan(0));

    await tester.pumpWidget(host(section: 'B'));
    expect(tester.renderObject(paint), same(canvas));
    final beforeTransition = repaints;
    await tester.pump(const Duration(milliseconds: 100));
    expect(repaints, greaterThan(beforeTransition));

    for (final reduced in [false, true]) {
      await tester.pumpWidget(host(active: reduced, reduced: reduced));
      final paused = repaints;
      await tester.pump(const Duration(seconds: 1));
      expect(repaints, paused);
      expect(tester.binding.hasScheduledFrame, isFalse);

      await tester.pumpWidget(host());
      await tester.pump(const Duration(milliseconds: 100));
      expect(repaints, greaterThan(paused));
    }
    painter.removeListener(onRepaint);
    await tester.pumpWidget(const SizedBox.shrink());
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull);
    expect(tester.binding.hasScheduledFrame, isFalse);
  });
}
