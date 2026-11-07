import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mix_showcase/cards.dart';
import 'package:mix_showcase/main.dart';
import 'package:mix_showcase/showcase.dart';
import 'package:mix_showcase/tokens.dart';
import 'package:remix/remix.dart';

Future<void> _loadFonts() async {
  const families = {
    'Geist': ['Geist-Regular', 'Geist-Medium', 'Geist-SemiBold', 'Geist-Bold'],
    'GeistMono': ['GeistMono-Regular', 'GeistMono-Medium'],
    'LibreFranklin': [
      'LibreFranklin-Regular',
      'LibreFranklin-Medium',
      'LibreFranklin-SemiBold',
    ],
    'AbrilFatface': ['AbrilFatface-Regular'],
    'Montserrat': [
      'Montserrat-Medium',
      'Montserrat-SemiBold',
      'Montserrat-Bold',
    ],
  };
  for (final MapEntry(key: family, value: files) in families.entries) {
    final loader = FontLoader(family);
    for (final file in files) {
      loader.addFont(rootBundle.load('assets/fonts/$file.ttf'));
    }
    await loader.load();
  }
}

Future<void> _pump(WidgetTester tester, Showcase showcase, Size size) async {
  tester.view.physicalSize = size;
  tester.view.devicePixelRatio = 1;
  await tester.pumpWidget(ShowcaseApp(showcase: showcase));
  await tester.pump(const Duration(seconds: 1));
}

void main() {
  setUpAll(_loadFonts);

  // Actual stage sizes include the short laptop and pinned phone layouts.
  for (final look in looks) {
    for (final size in const [
      Size(280, 258),
      Size(320, 330),
      Size(350, 330),
      Size(350, 400),
      Size(390, 700),
      Size(700, 500),
      Size(800, 620),
      Size(800, 680),
      Size(1100, 900),
    ]) {
      testWidgets(
        '${look.id} overview at ${size.width.toInt()}x${size.height.toInt()}',
        (tester) async {
          addTearDown(tester.view.reset);
          final showcase = Showcase()..apply({'look': look.id});
          addTearDown(showcase.dispose);
          await _pump(tester, showcase, size);
          expect(tester.takeException(), isNull);
          for (final mode in const [
            {'xray': true},
            {'naked': true, 'xray': false},
            {'naked': false, 'phone': true},
          ]) {
            showcase.apply(mode);
            await tester.pump(const Duration(seconds: 1));
            expect(tester.takeException(), isNull);
          }
        },
      );
      for (final block in const [
        'player',
        'today',
        'spending',
        'appearance',
        'team',
      ]) {
        testWidgets(
          '${look.id}/$block focused at ${size.width.toInt()}x${size.height.toInt()}',
          (tester) async {
            addTearDown(tester.view.reset);
            final showcase = Showcase()
              ..apply({'look': look.id, 'highlight': block});
            addTearDown(showcase.dispose);
            await _pump(tester, showcase, size);
            expect(tester.takeException(), isNull);
            final selected = find.byWidgetPredicate(
              (widget) => widget is Block && widget.id == block,
            );
            expect(selected, findsOneWidget);
            final bounds = tester.getRect(selected);
            expect(bounds.left, greaterThanOrEqualTo(0));
            expect(bounds.top, greaterThanOrEqualTo(0));
            expect(bounds.right, lessThanOrEqualTo(size.width));
            expect(bounds.bottom, lessThanOrEqualTo(size.height));
          },
        );
      }
    }
  }

  testWidgets(
    'a pressed Naked row takes focus, then Tab and Space act on rows',
    (tester) async {
      addTearDown(tester.view.reset);
      final showcase = Showcase()..apply({'naked': true});
      await _pump(tester, showcase, const Size(800, 700));
      final middle = showcase.today[1];
      expect(middle.done, isFalse);

      await tester.tap(find.text(middle.title));
      await tester.pump();
      expect(middle.done, isTrue);

      await tester.sendKeyEvent(LogicalKeyboardKey.tab);
      await tester.pump();
      await tester.sendKeyEvent(LogicalKeyboardKey.space);
      await tester.pump();
      expect(showcase.today.last.done, isTrue);
      expect(middle.done, isTrue);
    },
  );

  testWidgets('Naked rows remain usable on the pinned phone stage', (
    tester,
  ) async {
    addTearDown(tester.view.reset);
    final showcase = Showcase()..apply({'naked': true});
    addTearDown(showcase.dispose);
    await _pump(tester, showcase, const Size(350, 330));
    await tester.tap(find.text(showcase.today[1].title));
    await tester.pump();
    expect(showcase.today[1].done, isTrue);
    await tester.sendKeyEvent(LogicalKeyboardKey.tab);
    await tester.sendKeyEvent(LogicalKeyboardKey.space);
    expect(showcase.today.last.done, isTrue);
  });

  testWidgets('each Today row is one tab stop, with a visible focus ring', (
    tester,
  ) async {
    addTearDown(tester.view.reset);
    final showcase = Showcase()..apply({'highlight': 'today'});
    addTearDown(showcase.dispose);
    await _pump(tester, showcase, const Size(800, 700));
    final last = showcase.today.last;
    expect(last.done, isFalse);
    FocusManager.instance.highlightStrategy =
        FocusHighlightStrategy.alwaysTraditional;
    addTearDown(() {
      FocusManager.instance.highlightStrategy =
          FocusHighlightStrategy.automatic;
    });
    for (final _ in showcase.today) {
      await tester.sendKeyEvent(LogicalKeyboardKey.tab);
    }
    // One frame starts the style animation, and a later one shows its end.
    await tester.pump();
    await tester.pump(const Duration(seconds: 1));
    final ring = tester.widget<DecoratedBox>(
      find
          .descendant(
            of: find.byType(RemixCheckbox).last,
            matching: find.byType(DecoratedBox),
          )
          .first,
    );
    final shape = (ring.decoration as ShapeDecoration).shape as OutlinedBorder;
    expect(shape.side.color, midnight.ink);
    await tester.sendKeyEvent(LogicalKeyboardKey.space);
    await tester.pump();
    expect(last.done, isTrue);
  });

  testWidgets('chart values can be selected by touch and keyboard', (
    tester,
  ) async {
    addTearDown(tester.view.reset);
    final showcase = Showcase()..apply({'highlight': 'spending'});
    addTearDown(showcase.dispose);
    await _pump(tester, showcase, const Size(350, 330));
    final monday = find.byWidgetPredicate(
      (widget) =>
          widget is PressableBox &&
          widget.semanticsLabel == 'Monday, \$132 spent',
    );
    await tester.tap(monday);
    await tester.pump();
    expect(showcase.spendDay, 0);
    // The range control is first; the seven bars follow it in reading order.
    FocusManager.instance.primaryFocus?.unfocus();
    await tester.pump();
    await tester.sendKeyEvent(LogicalKeyboardKey.tab);
    await tester.sendKeyEvent(LogicalKeyboardKey.tab);
    await tester.sendKeyEvent(LogicalKeyboardKey.enter);
    await tester.pump();
    expect(showcase.spendDay, 0);
    await tester.sendKeyEvent(LogicalKeyboardKey.tab);
    await tester.sendKeyEvent(LogicalKeyboardKey.enter);
    await tester.pump();
    expect(showcase.spendDay, 1);
  });

  group('CutCorners', () {
    const border = CutCorners(cut: 10);
    const rect = Rect.fromLTWH(0, 0, 100, 60);

    test('cuts the top-left and bottom-right only', () {
      final path = border.getOuterPath(rect);
      expect(
        path.contains(const Offset(2, 2)),
        isFalse,
        reason: 'top-left is cut',
      );
      expect(
        path.contains(const Offset(98, 58)),
        isFalse,
        reason: 'bottom-right is cut',
      );
      expect(
        path.contains(const Offset(98, 2)),
        isTrue,
        reason: 'top-right stays square',
      );
      expect(
        path.contains(const Offset(2, 58)),
        isTrue,
        reason: 'bottom-left stays square',
      );
    });

    test('never cuts past half of the short side', () {
      final path = const CutCorners(
        cut: 500,
      ).getOuterPath(const Rect.fromLTWH(0, 0, 20, 20));
      expect(path.contains(const Offset(10, 10)), isTrue);
    });

    test('animates between cut sizes and from rounded corners', () {
      final middle = ShapeBorder.lerp(
        const CutCorners(cut: 0),
        const CutCorners(cut: 20),
        0.5,
      );
      expect(middle, isA<CutCorners>().having((value) => value.cut, 'cut', 10));
      const rounded = RoundedRectangleBorder(
        borderRadius: BorderRadius.all(Radius.circular(10)),
      );
      expect(ShapeBorder.lerp(rounded, border, 0.25), isNotNull);
      expect(ShapeBorder.lerp(border, rounded, 0.75), isNotNull);
    });
  });

  test('the cyber look cuts its corners and the others do not', () {
    expect(cyber.cut, isTrue);
    expect(
      looks.where((look) => look != cyber).any((look) => look.cut),
      isFalse,
    );
  });

  testWidgets('reduced motion keeps playback but stops the bounce', (
    tester,
  ) async {
    addTearDown(tester.view.reset);
    final showcase = Showcase()
      ..apply({'reduceMotion': true})
      ..setPlaying(true);
    await _pump(tester, showcase, const Size(800, 700));
    expect(showcase.playing, isTrue);
    final before = tester.getSize(find.byType(Equalizer));
    await tester.pump(const Duration(milliseconds: 200));
    expect(tester.getSize(find.byType(Equalizer)), before);
    expect(tester.hasRunningAnimations, isFalse);
    showcase.setPlaying(false);
  });

  // Remix does not centre the check, so a sized box stretches it to fill and
  // ignores iconSize. This keeps the mark inside the box in every look.
  for (final look in looks) {
    testWidgets('${look.id} check mark is small and centred', (tester) async {
      addTearDown(tester.view.reset);
      await _pump(
        tester,
        Showcase()..apply({'look': look.id}),
        const Size(800, 700),
      );
      final box = find.byWidgetPredicate(
        (widget) => widget is RemixCheckbox && widget.selected == true,
      );
      final mark = find.descendant(
        of: box.first,
        matching: find.byWidgetPredicate(
          (widget) => widget.runtimeType.toString() == 'RemixPathIcon',
        ),
      );
      final outer = tester.getRect(box.first);
      final inner = tester.getRect(mark);
      expect(inner.width, 10);
      expect(inner.center, outer.center);
    });
  }

  test('skipping wraps and resets the position', () {
    final showcase = Showcase()..skip(-1);
    expect(showcase.current, showcase.tracks.length - 1);
    expect(showcase.position.value, 0);
  });

  testWidgets('the framed phone and the X-ray and Naked modes lay out', (
    tester,
  ) async {
    addTearDown(tester.view.reset);
    for (final mode in const [
      {'phone': true},
      {'xray': true},
      {'naked': true},
    ]) {
      await _pump(tester, Showcase()..apply(mode), const Size(980, 800));
      await tester.pump(const Duration(seconds: 1));
      expect(tester.takeException(), isNull);
    }
  });

  testWidgets('a look changes tokens while the task state stays', (
    tester,
  ) async {
    addTearDown(tester.view.reset);
    final showcase = Showcase();
    await _pump(tester, showcase, const Size(980, 800));
    final task = showcase.today.last;
    showcase.toggle(task);
    showcase.apply({'look': 'pop'});
    await tester.pump(const Duration(seconds: 1));
    expect(showcase.activeLook, pop);
    expect(task.done, isTrue);
  });

  test('appearance overrides tokens until the look changes', () {
    final showcase = Showcase()..setCorner(20);
    showcase.setAccent(const Color(0xFF00FF00));
    showcase.apply({'look': 'paper'});
    expect(showcase.corner, isNull);
    expect(showcase.accent, isNull);
  });
}
