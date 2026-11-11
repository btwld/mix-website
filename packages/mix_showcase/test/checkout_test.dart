import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mix_showcase/demos/checkout/checkout.dart';
import 'package:mix_showcase/ui/ui.dart';
import 'package:remix/remix.dart';

/// Pumps the form under the installed theme, the way the page places it.
Future<void> pumpCheckout(WidgetTester tester) {
  return tester.pumpWidget(
    WidgetsApp(
      color: const Color(0xFF000000),
      builder: (context, _) => const UiTheme(
        mode: UiThemeMode.light,
        child: Center(
          child: SizedBox(width: 320, child: Checkout()),
        ),
      ),
    ),
  );
}

Finder get startButton => find.byWidgetPredicate(
  (widget) =>
      widget is RemixButton &&
      widget.label.startsWith('Start'),
);

void main() {
  testWidgets('pumps with three yearly seats', (
    tester,
  ) async {
    await pumpCheckout(tester);
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull);
    expect(find.text('Seats'), findsOneWidget);
    expect(find.text('3'), findsOneWidget);
    expect(
      find.text('Start for \$30 a month'),
      findsOneWidget,
    );
  });

  testWidgets(
    'the slider changes the seats and the price',
    (tester) async {
      await pumpCheckout(tester);
      final slider = find.byType(RemixSlider);
      await tester.tapAt(
        tester.getTopRight(slider) + const Offset(-2, 10),
      );
      await tester.pumpAndSettle();
      expect(find.text('10'), findsOneWidget);
      expect(
        find.text('Start for \$100 a month'),
        findsOneWidget,
      );
    },
  );

  testWidgets(
    'the switch changes the billing and the price',
    (tester) async {
      await pumpCheckout(tester);
      await tester.tap(find.byType(RemixSwitch));
      await tester.pumpAndSettle();
      expect(
        find.text('Start for \$36 a month'),
        findsOneWidget,
      );
    },
  );

  testWidgets('the checkbox adds support to the price', (
    tester,
  ) async {
    await pumpCheckout(tester);
    await tester.tap(find.byType(RemixCheckbox));
    await tester.pumpAndSettle();
    expect(
      tester
          .widget<RemixCheckbox>(find.byType(RemixCheckbox))
          .selected,
      isTrue,
    );
    expect(
      find.text('Start for \$34 a month'),
      findsOneWidget,
    );
  });

  testWidgets(
    'Start shows loading, then returns after the delay',
    (tester) async {
      await pumpCheckout(tester);
      bool loading() =>
          tester.widget<RemixButton>(startButton).loading;
      expect(loading(), isFalse);
      await tester.tap(startButton);
      await tester.pump();
      expect(loading(), isTrue);
      await tester.pump(const Duration(milliseconds: 1500));
      expect(loading(), isFalse);
      expect(tester.takeException(), isNull);
    },
  );

  testWidgets('Reset restores the defaults', (
    tester,
  ) async {
    await pumpCheckout(tester);
    await tester.tap(find.byType(RemixSwitch));
    await tester.tap(find.byType(RemixCheckbox));
    await tester.pumpAndSettle();
    expect(
      find.text('Start for \$40 a month'),
      findsOneWidget,
    );
    await tester.tap(find.text('Reset'));
    await tester.pumpAndSettle();
    expect(
      find.text('Start for \$30 a month'),
      findsOneWidget,
    );
    expect(
      tester
          .widget<RemixCheckbox>(find.byType(RemixCheckbox))
          .selected,
      isFalse,
    );
  });
}
