import 'package:flutter/material.dart' show Theme;
import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mix_showcase/cards.dart';
import 'package:mix_showcase/invite.dart';
import 'package:mix_showcase/main.dart';
import 'package:mix_showcase/showcase.dart';
import 'package:mix_showcase/styles.dart';
import 'package:mix_showcase/tokens.dart';
import 'package:naked_ui/naked_ui.dart';
import 'package:remix/remix.dart';

Future<void> _loadFonts() async {
  for (final family in {
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
  }.entries) {
    final loader = FontLoader(family.key);
    for (final file in family.value) {
      loader.addFont(rootBundle.load('assets/fonts/$file.ttf'));
    }
    await loader.load();
  }
}

Future<Showcase> _pump(
  WidgetTester tester, {
  bool naked = false,
  Look look = midnight,
  Size size = const Size(1100, 900),
}) async {
  tester.view.physicalSize = size;
  tester.view.devicePixelRatio = 1;
  addTearDown(tester.view.reset);
  final showcase = Showcase()
    ..apply({'naked': naked, 'look': look.id, 'highlight': 'team'});
  addTearDown(showcase.dispose);
  await tester.pumpWidget(ShowcaseApp(showcase: showcase));
  await tester.pump(const Duration(seconds: 1));
  expect(tester.takeException(), isNull);
  return showcase;
}

Finder _trigger(Person person) => find.byWidgetPredicate(
  (widget) => widget is InviteButton && widget.person == person,
);

FocusNode _triggerFocus(WidgetTester tester, Person person, bool naked) {
  final controls = find.descendant(
    of: _trigger(person),
    matching: find.byType(naked ? NakedButton : RemixButton),
  );
  return naked
      ? tester.widget<NakedButton>(controls).focusNode!
      : tester.widget<RemixButton>(controls).focusNode!;
}

Future<void> _open(WidgetTester tester, Person person) async {
  await tester.tap(_trigger(person));
  await tester.pump();
  await tester.pump(const Duration(milliseconds: 450));
  expect(find.byType(EditableText), findsOneWidget);
  expect(tester.takeException(), isNull);
}

Finder _send(bool naked) =>
    find.text(naked ? '[ Send invite ]' : 'Send invite');

ShapeDecoration _decoration(WidgetTester tester, Finder owner) =>
    tester
            .widget<DecoratedBox>(
              find
                  .descendant(of: owner, matching: find.byType(DecoratedBox))
                  .first,
            )
            .decoration
        as ShapeDecoration;

void _expectCorners(OutlinedBorder shape, Look look, double corner) {
  if (look.cut) {
    expect(shape, isA<CutCorners>());
    expect((shape as CutCorners).cut, corner);
  } else {
    expect(shape, isA<RoundedRectangleBorder>());
    expect(
      (shape as RoundedRectangleBorder).borderRadius,
      BorderRadius.circular(corner),
    );
  }
}

void main() {
  setUpAll(_loadFonts);

  for (final naked in [false, true]) {
    final mode = naked ? 'Naked' : 'Remix';
    testWidgets(
      '$mode validates, loads once, confirms, returns focus and undoes',
      (tester) async {
        final showcase = await _pump(tester, naked: naked);
        final person = showcase.people[1];
        final focus = _triggerFocus(tester, person, naked);
        await _open(tester, person);
        for (final invalid in ['', 'invalid']) {
          await tester.enterText(find.byType(EditableText), invalid);
          await tester.tap(_send(naked));
          await tester.pump();
          expect(find.text('Enter an email with an @.'), findsOneWidget);
          expect(person.invited, isFalse);
        }
        await tester.enterText(find.byType(EditableText), 'bruno@example.com');
        await tester.tap(_send(naked));
        await tester.pump();
        expect(person.invited, isFalse);
        if (naked) {
          expect(find.text('[ Sending… ]'), findsOneWidget);
        } else {
          expect(
            tester
                .widget<RemixButton>(
                  find.byWidgetPredicate(
                    (widget) =>
                        widget is RemixButton && widget.label == 'Send invite',
                  ),
                )
                .loading,
            isTrue,
          );
        }
        await tester.sendKeyEvent(LogicalKeyboardKey.escape);
        await tester.pump(const Duration(milliseconds: 599));
        expect(find.byType(EditableText), findsOneWidget);
        expect(person.invited, isFalse);
        await tester.pump(const Duration(milliseconds: 1));
        await tester.pump(const Duration(milliseconds: 450));
        await tester.pump();
        expect(find.byType(EditableText), findsNothing);
        expect(person.invited, isTrue);
        expect(find.text('Invited ${person.name}'), findsOneWidget);
        final toastText = tester.widget<RichText>(
          find.descendant(
            of: find.text('Invited ${person.name}'),
            matching: find.byType(RichText),
          ),
        );
        expect(
          toastText.text.style?.decoration,
          anyOf(isNull, TextDecoration.none),
        );
        expect(_triggerFocus(tester, person, naked), same(focus));
        expect(focus.hasFocus, isTrue);
        await tester.tap(_trigger(person));
        await tester.pump();
        expect(person.invited, isFalse);
        expect(find.byType(EditableText), findsNothing);
        expect(tester.takeException(), isNull);
        // Explicitly drain the toast timer without settling a loading spinner.
        await tester.pump(const Duration(seconds: 5));
        await tester.pump(const Duration(seconds: 1));
      },
    );

    testWidgets('$mode traps Tab in both directions and Escape returns focus', (
      tester,
    ) async {
      final showcase = await _pump(tester, naked: naked);
      final person = showcase.people[1];
      final focus = _triggerFocus(tester, person, naked);
      await _open(tester, person);
      final editorFocus = tester
          .widget<EditableText>(find.byType(EditableText))
          .focusNode;
      expect(editorFocus.hasFocus, isTrue);
      final dialogScope = editorFocus.nearestScope!;
      for (final _ in List.filled(9, null)) {
        await tester.sendKeyEvent(LogicalKeyboardKey.tab);
        await tester.pump();
        expect(
          FocusManager.instance.primaryFocus!.ancestors,
          contains(dialogScope),
        );
        expect(focus.hasFocus, isFalse);
      }
      expect(
        editorFocus.hasFocus,
        isTrue,
        reason: 'three Tab stops wrap to Email',
      );
      await tester.sendKeyDownEvent(LogicalKeyboardKey.shiftLeft);
      for (final _ in List.filled(9, null)) {
        await tester.sendKeyEvent(LogicalKeyboardKey.tab);
        await tester.pump();
        expect(
          FocusManager.instance.primaryFocus!.ancestors,
          contains(dialogScope),
        );
      }
      await tester.sendKeyUpEvent(LogicalKeyboardKey.shiftLeft);
      expect(editorFocus.hasFocus, isTrue);
      await tester.sendKeyEvent(LogicalKeyboardKey.escape);
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 450));
      expect(find.byType(EditableText), findsNothing);
      expect(person.invited, isFalse);
      expect(focus.hasFocus, isTrue);
      expect(tester.takeException(), isNull);
    });

    for (final size in const [Size(280, 258), Size(1100, 900)]) {
      for (final look in looks) {
        testWidgets('$mode ${look.id} dialog at $size', (tester) async {
          final showcase = await _pump(
            tester,
            naked: naked,
            look: look,
            size: size,
          );
          await _open(tester, showcase.people[1]);
          await tester.tap(_send(naked));
          await tester.pump();
          expect(find.text('Enter an email with an @.'), findsOneWidget);
          expect(tester.takeException(), isNull);
          final sendBounds = tester.getRect(_send(naked));
          expect(sendBounds.left, greaterThanOrEqualTo(0));
          expect(sendBounds.right, lessThanOrEqualTo(size.width));
          expect(sendBounds.bottom, lessThanOrEqualTo(size.height));
          await tester.sendKeyEvent(LogicalKeyboardKey.escape);
          await tester.pump();
          await tester.pump(const Duration(milliseconds: 450));
          expect(tester.takeException(), isNull);
        });
      }
    }

    testWidgets(
      '$mode ignores a delayed completion after the dialog is removed',
      (tester) async {
        final showcase = await _pump(tester, naked: naked);
        final person = showcase.people[1];
        await _open(tester, person);
        await tester.enterText(find.byType(EditableText), 'bruno@example.com');
        await tester.testTextInput.receiveAction(TextInputAction.send);
        await tester.pump();
        final context = tester.element(find.byType(EditableText));
        Navigator.of(context).removeRoute(ModalRoute.of(context)!);
        await tester.pump();
        await tester.pump(const Duration(seconds: 1));
        expect(person.invited, isFalse);
        expect(find.byType(Team), findsOneWidget);
        expect(tester.takeException(), isNull);
      },
    );

    testWidgets('$mode does not pop a route covering an in-flight invite', (
      tester,
    ) async {
      final showcase = await _pump(tester, naked: naked);
      final person = showcase.people[1];
      await _open(tester, person);
      await tester.enterText(find.byType(EditableText), 'bruno@example.com');
      await tester.testTextInput.receiveAction(TextInputAction.send);
      await tester.pump();
      final context = tester.element(find.byType(EditableText));
      final navigator = Navigator.of(context);
      final cover = PageRouteBuilder<void>(
        opaque: false,
        pageBuilder: (context, animation, secondaryAnimation) =>
            const Center(child: Text('Covering route')),
      );
      navigator.push(cover);
      await tester.pump();
      await tester.pump(const Duration(seconds: 1));
      expect(cover.isCurrent, isTrue);
      expect(person.invited, isFalse);
      navigator.pop();
      await tester.pump();
      await tester.pump(const Duration(seconds: 1));
      expect(find.byType(EditableText), findsOneWidget);
      await tester.sendKeyEvent(LogicalKeyboardKey.escape);
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 450));
      expect(person.invited, isFalse);
      expect(tester.takeException(), isNull);
    });

    testWidgets(
      '$mode completes the invite after chapter navigation removes Team',
      (tester) async {
        final showcase = await _pump(tester, naked: naked);
        final person = showcase.people[1];
        await _open(tester, person);
        showcase.apply({'highlight': 'today'});
        await tester.pump();
        await tester.pump(const Duration(seconds: 1));
        expect(find.byType(InviteButton, skipOffstage: false), findsNothing);
        await tester.enterText(find.byType(EditableText), 'bruno@example.com');
        await tester.testTextInput.receiveAction(TextInputAction.send);
        await tester.pump();
        await tester.pump(const Duration(milliseconds: 600));
        await tester.pump(const Duration(milliseconds: 450));
        expect(find.byType(EditableText), findsNothing);
        expect(person.invited, isTrue);
        expect(find.text('Invited ${person.name}'), findsOneWidget);
        showcase.apply({'highlight': 'team'});
        await tester.pump();
        await tester.pump(const Duration(seconds: 1));
        expect(person.invited, isTrue);
        await tester.tap(_trigger(person));
        await tester.pump();
        expect(person.invited, isFalse);
        await tester.pump(const Duration(seconds: 5));
        await tester.pump(const Duration(seconds: 1));
        expect(tester.takeException(), isNull);
      },
    );

    testWidgets('$mode reduced motion skips dialog route transitions', (
      tester,
    ) async {
      final showcase = await _pump(tester, naked: naked);
      showcase.apply({'reduceMotion': true});
      await tester.pump();
      await tester.tap(_trigger(showcase.people[1]));
      await tester.pump();
      final context = tester.element(find.byType(EditableText));
      expect(ModalRoute.of(context)!.transitionDuration, Duration.zero);
      await tester.sendKeyEvent(LogicalKeyboardKey.escape);
      await tester.pump();
      await tester.pump();
      expect(find.byType(EditableText), findsNothing);
      expect(tester.takeException(), isNull);
    });
  }

  testWidgets(
    'open Remix dialog, field and Material brand follow live look changes',
    (tester) async {
      final showcase = await _pump(tester);
      await _open(tester, showcase.people[1]);
      for (final look in looks) {
        showcase.apply({'look': look.id});
        await tester.pump();
        await tester.pump(const Duration(seconds: 1));
        final context = tester.element(find.byType(RemixTextField));
        expect(Theme.of(context).colorScheme.primary, look.accent);
        expect($brand.resolve(context), look.accent);
        expect($onBrand.resolve(context), look.onAccent);
        final dialog = _decoration(tester, find.byType(RemixDialog));
        expect(dialog.color, look.surface);
        final dialogShape = dialog.shape as OutlinedBorder;
        expect(dialogShape.side.color, look.line);
        expect(dialogShape.side.width, look.stroke);
        _expectCorners(dialogShape, look, look.card);
        final field = _decoration(tester, find.byType(RemixTextField));
        expect(field.color, look.raised);
        _expectCorners(field.shape as OutlinedBorder, look, look.control);
        final editorStyle = tester
            .widget<EditableText>(find.byType(EditableText))
            .style;
        expect(editorStyle.color, look.ink);
        expect(editorStyle.fontFamily, look.bodyFont);
        final title = tester.widget<RichText>(
          find.descendant(
            of: find.text('Invite ${showcase.people[1].name}'),
            matching: find.byType(RichText),
          ),
        );
        expect(title.text.style?.color, look.ink);
        expect(title.text.style?.fontFamily, look.bodyFont);
        final button = find.byWidgetPredicate(
          (widget) => widget is RemixButton && widget.label == 'Send invite',
        );
        final decoration =
            tester
                    .widget<DecoratedBox>(
                      find
                          .descendant(
                            of: button,
                            matching: find.byType(DecoratedBox),
                          )
                          .first,
                    )
                    .decoration
                as ShapeDecoration;
        expect(decoration.color, look.accent);
        expect(tester.takeException(), isNull);
      }
      const custom = Color(0xFF06B6D4);
      showcase.setAccent(custom);
      await tester.pump();
      await tester.pump(const Duration(seconds: 1));
      final context = tester.element(find.byType(RemixTextField));
      expect($brand.resolve(context), custom);
      expect(Theme.of(context).colorScheme.primary, custom);
      expect(
        _decoration(tester, find.byType(RemixDialog)).color,
        showcase.look.surface,
      );
      final send = find.byWidgetPredicate(
        (widget) => widget is RemixButton && widget.label == 'Send invite',
      );
      expect(_decoration(tester, send).color, custom);
      showcase.setCorner(20);
      showcase.setFlat(true);
      await tester.pump();
      await tester.pump(const Duration(seconds: 1));
      final dialog = _decoration(tester, find.byType(RemixDialog));
      _expectCorners(dialog.shape as OutlinedBorder, showcase.look, 30);
      expect(dialog.shadows!.single.color.a, 0);
      final field = _decoration(tester, find.byType(RemixTextField));
      _expectCorners(field.shape as OutlinedBorder, showcase.look, 20);
      expect(tester.takeException(), isNull);
    },
  );

  testWidgets('wide Naked deck keeps Team reachable by keyboard', (
    tester,
  ) async {
    final showcase = await _pump(tester, naked: true);
    showcase.apply({'highlight': null});
    await tester.pump();
    await tester.pump(const Duration(seconds: 1));
    final focus = _triggerFocus(tester, showcase.people[1], true);
    var reachedTeam = false;
    for (var tab = 0; tab < 12; tab++) {
      await tester.sendKeyEvent(LogicalKeyboardKey.tab);
      await tester.pump();
      reachedTeam = reachedTeam || focus.hasFocus;
    }
    expect(reachedTeam, isTrue);
    expect(tester.takeException(), isNull);
  });

  testWidgets(
    'short Naked overview stays on Today, explicit Team uses bare controls',
    (tester) async {
      final showcase = await _pump(
        tester,
        naked: true,
        size: const Size(280, 258),
      );
      expect(find.byType(InviteButton), findsNWidgets(3));
      expect(find.byType(RemixButton), findsNothing);
      await _open(tester, showcase.people[1]);
      await tester.sendKeyEvent(LogicalKeyboardKey.escape);
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 450));
      showcase.apply({'highlight': null});
      await tester.pump();
      await tester.pump(const Duration(seconds: 1));
      expect(find.byType(Today), findsOneWidget);
      expect(find.byType(Team), findsNothing);
      expect(tester.takeException(), isNull);
    },
  );
}
