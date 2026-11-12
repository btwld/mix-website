import 'dart:ui' show FragmentProgram, PictureRecorder;

import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:fortal_landing/backdrops.dart';
import 'package:fortal_landing/density.dart';
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

  testWidgets('shared lagoon is a still picture that persists', (tester) async {
    Widget host({String section = 'A'}) => Directionality(
      textDirection: TextDirection.ltr,
      child: UiTheme(
        child: FortalTheme(
          accent: siteAccent.value,
          child: BackdropShaders(
            horizon: horizon,
            dunes: dunes,
            child: SharedSandBackdrop(child: Center(child: Text(section))),
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
    await tester.pumpAndSettle();
    // Nothing ticks: the dunes are drawn once and kept.
    await tester.pump(const Duration(seconds: 1));
    expect(repaints, 0);
    expect(tester.binding.hasScheduledFrame, isFalse);

    // The canvas stays while the section over it changes.
    await tester.pumpWidget(host(section: 'B'));
    expect(tester.renderObject(paint), same(canvas));
    await tester.pump(const Duration(seconds: 1));
    expect(repaints, 0);

    painter.removeListener(onRepaint);
    await tester.pumpWidget(const SizedBox.shrink());
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull);
    expect(tester.binding.hasScheduledFrame, isFalse);
  });

  testWidgets('Beira-Mar is a still picture and disposes', (tester) async {
    final photo = (await tester.runAsync(CityPhoto.load))!;
    await tester.pumpWidget(
      Directionality(
        textDirection: TextDirection.ltr,
        child: SizedBox(
          width: 400,
          height: 300,
          child: CityBackdrop(photo: photo),
        ),
      ),
    );
    final paint = find.descendant(
      of: find.byType(CityBackdrop),
      matching: find.byType(CustomPaint),
    );
    expect(paint, findsOneWidget);
    final painter = tester.widget<CustomPaint>(paint).painter!;
    var repaints = 0;
    void onRepaint() => repaints++;
    painter.addListener(onRepaint);
    // The photo fades in, then nothing ticks.
    await tester.pumpAndSettle();
    await tester.pump(const Duration(seconds: 1));
    expect(repaints, 0);
    expect(tester.binding.hasScheduledFrame, isFalse);

    painter.removeListener(onRepaint);
    await tester.pumpWidget(const SizedBox.shrink());
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull);
    expect(tester.binding.hasScheduledFrame, isFalse);
  });

  testWidgets('a still picture draws once per set of inputs', (tester) async {
    final still = StillPicture();
    addTearDown(still.dispose);
    var draws = 0;
    void paint(Object inputs, Size size) {
      final recorder = PictureRecorder();
      still.paint(Canvas(recorder), size, inputs, (canvas) {
        draws++;
        canvas.drawRect(Offset.zero & size, Paint());
      });
      recorder.endRecording().dispose();
    }

    const size = Size(40, 30);
    paint('a', size);
    paint('a', size);
    paint('a', size);
    expect(draws, 1);
    paint('b', size);
    expect(draws, 2);
    paint('b', const Size(50, 30));
    expect(draws, 3);
    paint('b', Size.zero);
    expect(draws, 3);
  });

  testWidgets('the last two slides share one Beira-Mar photo', (tester) async {
    final photo = (await tester.runAsync(CityPhoto.load))!;
    final shown = ValueNotifier(true);
    addTearDown(shown.dispose);
    await tester.pumpWidget(
      Directionality(
        textDirection: TextDirection.ltr,
        child: MediaQuery(
          data: const MediaQueryData(disableAnimations: true),
          child: SharedCityBackdrop(
            shown: shown,
            photo: photo,
            child: const Column(
              children: [
                Expanded(child: CityBackdrop()),
                Expanded(child: CityBackdrop()),
              ],
            ),
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();
    // The slides' own backdrops defer to the one fixed photo and its credit.
    final canvas = find.descendant(
      of: find.byType(SharedCityBackdrop),
      matching: find.byType(CustomPaint),
    );
    expect(canvas, findsOneWidget);
    expect(
      find.descendant(
        of: find.byType(CityBackdrop),
        matching: find.byType(CustomPaint),
      ),
      findsNothing,
    );
    expect(find.text(CityPhoto.credit), findsOneWidget);

    // Away from those slides the photo is not painted.
    shown.value = false;
    await tester.pump();
    expect(canvas, findsNothing);
    expect(find.text(CityPhoto.credit), findsNothing);
    await tester.pumpWidget(const SizedBox.shrink());
    expect(tester.takeException(), isNull);
  });
}
