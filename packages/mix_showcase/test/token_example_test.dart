import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mix/mix.dart';
import 'package:mix_showcase/token_example.dart' show TokenExample;

void main() {
  testWidgets('pointer and keyboard switch the token-aware control', (
    tester,
  ) async {
    await tester.pumpWidget(const TokenExample());
    final control = find.byType(PressableBox);
    final originalElement = tester.element(control);
    final originalStyle = tester.widget<PressableBox>(control).style;
    final text = find.descendant(of: control, matching: find.byType(Text));

    void expectRenderedValues({required bool bold}) {
      final decoration =
          tester
                  .widget<DecoratedBox>(
                    find.descendant(
                      of: control,
                      matching: find.byType(DecoratedBox),
                    ),
                  )
                  .decoration
              as BoxDecoration;
      expect(
        decoration.color,
        bold ? const Color(0xFF4338CA) : const Color(0xFFEEF2FF),
      );
      final padding = tester
          .widget<Padding>(
            find.descendant(of: control, matching: find.byType(Padding)).last,
          )
          .padding
          .resolve(TextDirection.ltr);
      // The border adds 2 px to the token-provided padding on every side.
      expect(padding, EdgeInsets.all((bold ? 32 : 16) + 2));
      final renderedText = tester.widget<Text>(text);
      expect(renderedText.style?.fontSize, bold ? 22 : 16);
      expect(
        renderedText.style?.fontWeight,
        bold ? FontWeight.w700 : FontWeight.w400,
      );
      expect(
        renderedText.style?.color,
        bold ? const Color(0xFFFFFFFF) : const Color(0xFF312E81),
      );
      expect(tester.element(control), same(originalElement));
      expect(tester.widget<PressableBox>(control).style, same(originalStyle));
      expect(tester.takeException(), isNull);
    }

    expectRenderedValues(bold: false);
    await tester.tap(find.text('Switch look'));
    await tester.pumpAndSettle();
    expectRenderedValues(bold: true);

    await tester.sendKeyEvent(LogicalKeyboardKey.tab);
    await tester.pumpAndSettle();
    final focusedDecoration =
        tester
                .widget<DecoratedBox>(
                  find.descendant(
                    of: control,
                    matching: find.byType(DecoratedBox),
                  ),
                )
                .decoration
            as BoxDecoration;
    expect(
      (focusedDecoration.border as Border).top.color,
      const Color(0xFFFFFFFF),
    );
    await tester.sendKeyEvent(LogicalKeyboardKey.enter);
    await tester.pumpAndSettle();
    expectRenderedValues(bold: false);
    await tester.sendKeyEvent(LogicalKeyboardKey.space);
    await tester.pumpAndSettle();
    expectRenderedValues(bold: true);
  });
}
