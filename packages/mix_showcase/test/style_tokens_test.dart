import 'dart:io';

import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mix_showcase/styles.dart';
import 'package:mix_showcase/tokens.dart';
import 'package:remix/remix.dart';

Future<ShapeDecoration> renderStyle(
  WidgetTester tester,
  Look look,
  BoxStyler style, {
  bool flat = false,
  Color? accent,
  double? corner,
}) async {
  await tester.pumpWidget(
    MediaQuery(
      data: const MediaQueryData(size: Size(1000, 1000)),
      child: Directionality(
        textDirection: .ltr,
        child: lookScope(
          look,
          flat: flat,
          accent: accent,
          corner: corner,
          child: Box(
            style: style,
            child: const SizedBox(width: 100, height: 100),
          ),
        ),
      ),
    ),
  );
  await tester.pumpAndSettle();
  expect(tester.takeException(), isNull);
  return tester.widget<DecoratedBox>(find.byType(DecoratedBox)).decoration
      as ShapeDecoration;
}

void main() {
  test('reader-facing Dart stays fluent, with no Prop or context plumbing', () {
    const plumbing = ['Prop.', '.create(', '.onBuilder', '.resolve('];
    final styles = File('lib/styles.dart').readAsStringSync();
    final cards = File('lib/cards.dart').readAsStringSync();
    for (final pattern in plumbing) {
      expect(styles, isNot(contains(pattern)), reason: pattern);
      expect(cards, isNot(contains(pattern)), reason: pattern);
    }
    expect(styles, isNot(contains('BuildContext')));
  });

  testWidgets('card padding follows the MediaQuery width breakpoint', (
    tester,
  ) async {
    const childKey = ValueKey('card-child');
    for (final (width, padding) in [
      (1000.0, 18.0),
      (390.0, 14.0),
      (1000.0, 18.0),
    ]) {
      await tester.pumpWidget(
        MediaQuery(
          data: MediaQueryData(size: Size(width, 1000)),
          child: Directionality(
            textDirection: .ltr,
            child: lookScope(
              midnight,
              child: Center(
                child: Box(
                  style: cardPad,
                  child: const SizedBox(key: childKey, width: 100, height: 100),
                ),
              ),
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull);
      // The shape's border adds its own inset beyond the style padding.
      final decoration = tester
          .widget<DecoratedBox>(find.byType(DecoratedBox))
          .decoration;
      final insideBorder = decoration.padding
          .resolve(.ltr)
          .deflateRect(tester.getRect(find.byType(Box)));
      expect(
        tester.getRect(find.byKey(childKey)),
        insideBorder.deflate(padding),
        reason:
            'MediaQuery width $width should use $padding pixels on every side',
      );
    }
  });

  testWidgets('resting chart bars tint the accent of the active look', (
    tester,
  ) async {
    for (final look in [midnight, pop]) {
      final bar = await renderStyle(
        tester,
        look,
        barStyle(height: 40, active: false),
      );
      // A spring settles within a tolerance of its target, not exactly on it.
      expect(
        bar.color,
        isSameColorAs(look.accent.withValues(alpha: 0.25), threshold: 0.01),
      );
    }
  });

  testWidgets('shared card styles retain every look and clear disabled shadows', (
    tester,
  ) async {
    // Keep the same style mounted while the scope changes. This catches stale
    // token dependencies as well as lost color/shadow fields during shape merges.
    for (final look in [...looks, midnight]) {
      final decoration = await renderStyle(tester, look, cardPad);
      expect(decoration.color, look.surface);
      if (look.lift case final lift?) {
        expect(decoration.shadows, [lift]);
      } else {
        expect(decoration.shadows!.single.color.a, 0);
      }
      final border = decoration.shape as OutlinedBorder;
      expect(border.side.color, look.line);
      expect(border.side.width, look.stroke);
      if (look.cut) {
        expect(border, isA<CutCorners>());
        expect((border as CutCorners).cut, look.card);
      } else {
        expect(border, isA<RoundedRectangleBorder>());
        expect(
          (border as RoundedRectangleBorder).borderRadius,
          BorderRadius.circular(look.card),
        );
      }
      final flat = await renderStyle(tester, look, cardPad, flat: true);
      expect(flat.shadows!.single.color.a, 0);
      expect(flat.shape, decoration.shape);
    }
  });

  testWidgets('shape overrides replace complete token and built-in shapes', (
    tester,
  ) async {
    final selected = await renderStyle(
      tester,
      cyber,
      BoxStyler().shape($checkShape.mix()).shape($tinyShape.mix()),
    );
    expect(selected.shape, isA<CutCorners>());
    expect((selected.shape as CutCorners).side, BorderSide.none);

    final custom = await renderStyle(
      tester,
      cyber,
      BoxStyler().shape(.circle()).shape($cardShape.mix()),
    );
    expect(custom.shape, isA<CutCorners>());

    final circle = await renderStyle(
      tester,
      cyber,
      BoxStyler().shape($cardShape.mix()).shape(.circle()),
    );
    expect(circle.shape, isA<CircleBorder>());
  });

  testWidgets(
    'look overrides preserve accent, corner, and flat shadow values',
    (tester) async {
      const accent = Color(0xFFCC4477);
      final style = BoxStyler()
          .color($accent())
          .shape($cardShape.mix())
          .shadow($lift.mix());
      for (final look in looks) {
        for (final corner in [0.0, 12.0]) {
          final decoration = await renderStyle(
            tester,
            look,
            style,
            accent: accent,
            corner: corner,
            flat: true,
          );
          expect(decoration.color, accent);
          expect(decoration.shadows!.single.color.a, 0);
          if (look.cut) {
            final shape = decoration.shape as CutCorners;
            expect(shape.cut, corner * 1.5);
            expect(shape.edge, accent);
          } else {
            expect(
              (decoration.shape as RoundedRectangleBorder).borderRadius,
              BorderRadius.circular(corner * 1.5),
            );
          }
        }
      }
    },
  );
}
