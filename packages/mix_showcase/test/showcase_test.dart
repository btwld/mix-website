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
    'LibreFranklin': ['LibreFranklin-Regular', 'LibreFranklin-Medium', 'LibreFranklin-SemiBold'],
    'AbrilFatface': ['AbrilFatface-Regular'],
    'Montserrat': ['Montserrat-Medium', 'Montserrat-SemiBold', 'Montserrat-Bold'],
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

  // Every look, screen and mode at the widths the stage can really take. A
  // layout overflow here fails the test, which is the clipping this guards.
  for (final look in looks) {
    for (final screen in Screen.values) {
      for (final size in const [Size(320, 460), Size(390, 700), Size(620, 700), Size(980, 800), Size(1400, 900)]) {
        testWidgets('${look.id}/${screen.name} at ${size.width.toInt()}', (tester) async {
          addTearDown(tester.view.reset);
          await _pump(tester, Showcase()..apply({'look': look.id, 'screen': screen.name}), size);
          expect(tester.takeException(), isNull);
        });
      }
    }
  }

  // Each subject under review, in every look and mode, at real stage sizes.
  for (final subject in Subject.values) {
    for (final look in looks) {
      for (final size in const [Size(320, 460), Size(350, 439), Size(378, 680), Size(390, 700), Size(660, 500), Size(660, 700), Size(800, 460), Size(800, 560), Size(800, 700), Size(1100, 900)]) {
        testWidgets('${subject.name}/${look.id} at ${size.width.toInt()}', (tester) async {
          addTearDown(tester.view.reset);
          final showcase = Showcase()..apply({'look': look.id, 'subject': subject.name});
          await _pump(tester, showcase, size);
          expect(tester.takeException(), isNull);
          for (final mode in const [{'xray': true}, {'naked': true, 'xray': false}, {'naked': false, 'phone': true}]) {
            showcase.apply(mode);
            await tester.pump(const Duration(seconds: 1));
            expect(tester.takeException(), isNull);
          }
        });
      }
    }
  }

  testWidgets('a pressed Naked row takes focus, then Tab and Space act on rows', (tester) async {
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
  });

  group('CutCorners', () {
    const border = CutCorners(cut: 10);
    const rect = Rect.fromLTWH(0, 0, 100, 60);

    test('cuts the top-left and bottom-right only', () {
      final path = border.getOuterPath(rect);
      expect(path.contains(const Offset(2, 2)), isFalse, reason: 'top-left is cut');
      expect(path.contains(const Offset(98, 58)), isFalse, reason: 'bottom-right is cut');
      expect(path.contains(const Offset(98, 2)), isTrue, reason: 'top-right stays square');
      expect(path.contains(const Offset(2, 58)), isTrue, reason: 'bottom-left stays square');
    });

    test('never cuts past half of the short side', () {
      final path = const CutCorners(cut: 500).getOuterPath(const Rect.fromLTWH(0, 0, 20, 20));
      expect(path.contains(const Offset(10, 10)), isTrue);
    });

    test('animates between cut sizes and from rounded corners', () {
      final middle = ShapeBorder.lerp(const CutCorners(cut: 0), const CutCorners(cut: 20), 0.5);
      expect(middle, isA<CutCorners>().having((value) => value.cut, 'cut', 10));
      const rounded = RoundedRectangleBorder(borderRadius: BorderRadius.all(Radius.circular(10)));
      expect(ShapeBorder.lerp(rounded, border, 0.25), isNotNull);
      expect(ShapeBorder.lerp(border, rounded, 0.75), isNotNull);
    });
  });

  test('the cyber look cuts its corners and the others do not', () {
    expect(cyber.cut, isTrue);
    expect(looks.where((look) => look != cyber).any((look) => look.cut), isFalse);
  });

  testWidgets('reduced motion keeps playback but stops the bounce', (tester) async {
    addTearDown(tester.view.reset);
    final showcase = Showcase()..apply({'reduceMotion': true, 'play': 'music'});
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
      await _pump(tester, Showcase()..apply({'look': look.id}), const Size(800, 700));
      final box = find.byWidgetPredicate((widget) => widget is RemixCheckbox && widget.selected == true);
      final mark = find.descendant(
        of: box.first,
        matching: find.byWidgetPredicate((widget) => widget.runtimeType.toString() == 'RemixPathIcon'),
      );
      final outer = tester.getRect(box.first);
      final inner = tester.getRect(mark);
      expect(inner.width, 10);
      expect(inner.center, outer.center);
    });
  }

  test('the phone mode swaps width on the phone subject', () {
    final showcase = Showcase()..apply({'subject': 'phone'});
    expect(showcase.framed, isTrue);
    showcase.apply({'phone': true});
    expect(showcase.framed, isFalse);
    showcase.apply({'subject': 'deck'});
    expect(showcase.framed, isTrue);
  });

  test('skipping wraps and resets the position', () {
    final showcase = Showcase()..skip(-1);
    expect(showcase.current, showcase.tracks.length - 1);
    expect(showcase.position.value, 0);
  });

  testWidgets('the framed phone and the X-ray and Naked modes lay out', (tester) async {
    addTearDown(tester.view.reset);
    for (final mode in const [{'phone': true}, {'xray': true}, {'naked': true}]) {
      await _pump(tester, Showcase()..apply(mode), const Size(980, 800));
      await tester.pump(const Duration(seconds: 1));
      expect(tester.takeException(), isNull);
    }
  });

  testWidgets('a look changes tokens while the task state stays', (tester) async {
    addTearDown(tester.view.reset);
    final showcase = Showcase();
    await _pump(tester, showcase, const Size(980, 800));
    final task = showcase.tasks.last;
    showcase.toggle(task);
    showcase.apply({'look': 'pop'});
    await tester.pump(const Duration(seconds: 1));
    expect(showcase.activeLook, pop);
    expect(task.done, isTrue);
  });

  test('tasks validate, filter and reset locally', () {
    final showcase = Showcase();
    expect(showcase.addTask('  '), isNotNull);
    expect(showcase.addTask('Ship it'), isNull);
    showcase.setFilter(TaskFilter.done);
    expect(showcase.visibleTasks.every((task) => task.done), isTrue);
    showcase.reset();
    expect(showcase.tasks.any((task) => task.title == 'Ship it'), isFalse);
  });

  test('invitations reject invalid and duplicate addresses', () {
    final showcase = Showcase();
    expect(showcase.invite('nope'), isNotNull);
    expect(showcase.invite('ANA@launchpad.test'), contains('already'));
    expect(showcase.invite('new@launchpad.test'), isNull);
    expect(showcase.team.last.role, Role.viewer);
  });

  test('settings override tokens until the look changes', () {
    final showcase = Showcase()..setCorner(20);
    showcase.setAccent(const Color(0xFF00FF00));
    showcase.apply({'look': 'paper'});
    expect(showcase.corner, isNull);
    expect(showcase.accent, isNull);
  });
}
