import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mix/mix.dart';
import 'package:mix_showcase/token_example.dart';

void main() {
  testWidgets('scope updates rendered tokens without replacing the consumer', (
    tester,
  ) async {
    await tester.pumpWidget(const TokenExample());
    final panel = find.byType(TokenPanel);
    final originalWidget = tester.widget(panel);
    final originalElement = tester.element(panel);
    final box = find.descendant(of: panel, matching: find.byType(Box));
    final text = find.descendant(of: panel, matching: find.byType(Text));

    void expectRenderedValues(
      Color color,
      double padding,
      double fontSize,
      FontWeight weight,
    ) {
      final decoration =
          tester
                  .widget<DecoratedBox>(
                    find.descendant(
                      of: panel,
                      matching: find.byType(DecoratedBox),
                    ),
                  )
                  .decoration
              as BoxDecoration;
      expect(decoration.color, color);
      // Check actual layout, not merely the token map or style declaration.
      expect(tester.getRect(text), tester.getRect(box).deflate(padding));
      final renderedText = tester.widget<Text>(text);
      expect(renderedText.style?.fontSize, fontSize);
      expect(renderedText.style?.fontWeight, weight);
      expect(tester.widget(panel), same(originalWidget));
      expect(tester.element(panel), same(originalElement));
      expect(tester.widget<Box>(box).style, same(panelStyle));
      expect(tester.takeException(), isNull);
    }

    expectRenderedValues(Colors.indigo, 16, 16, .w400);
    await tester.tap(find.text('Switch look'));
    await tester.pumpAndSettle();
    expectRenderedValues(Colors.teal, 32, 22, .w700);
    await tester.tap(find.text('Switch look'));
    await tester.pumpAndSettle();
    expectRenderedValues(Colors.indigo, 16, 16, .w400);
  });
}
