import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mix_showcase/demos/billing_select/billing_select.dart';
import 'package:mix_showcase/demos/plan_picker/plan_picker.dart';
import 'package:mix_showcase/demos/plan_picker/plan_row.dart';
import 'package:mix_showcase/demos/plan_picker/plan_segment.dart';
import 'package:mix_showcase/demos/plans.dart';

import 'support.dart';

void main() {
  group('PlanPicker', () {
    for (final (name, builder, layout) in [
      ('planRow', planRow, planRows),
      ('planSegment', planSegment, planBar),
    ]) {
      testWidgets('$name renders all three plan names', (
        tester,
      ) async {
        await pumpUnder(
          tester,
          PlanPicker(
            plan: 'Pro',
            onChanged: (_) {},
            layout: layout,
            builder: builder,
          ),
        );
        for (final plan in plans) {
          expect(find.text(plan.name), findsOneWidget);
        }
        expect(tester.takeException(), isNull);
      });
    }

    testWidgets('reports a tapped plan', (tester) async {
      final picked = <String>[];
      await pumpUnder(
        tester,
        PlanPicker(
          plan: 'Pro',
          onChanged: picked.add,
          layout: planRows,
          builder: planRow,
        ),
      );
      await tapAndSettle(tester, find.text('Team'));
      expect(picked, ['Team']);
    });

    testWidgets('arrow keys move the selection', (
      tester,
    ) async {
      var plan = 'Pro';
      await pumpUnder(
        tester,
        StatefulBuilder(
          builder: (context, setState) => PlanPicker(
            plan: plan,
            onChanged: (next) =>
                setState(() => plan = next),
            layout: planRows,
            builder: planRow,
          ),
        ),
      );
      // NakedRadio does not take focus on pointer press, so focus it directly.
      await focusAround(tester, find.text('Pro'));
      await tester.sendKeyEvent(
        LogicalKeyboardKey.arrowDown,
      );
      await tester.pumpAndSettle();
      expect(plan, 'Team');

      await tester.sendKeyEvent(LogicalKeyboardKey.arrowUp);
      await tester.pumpAndSettle();
      expect(plan, 'Pro');

      await tester.sendKeyEvent(LogicalKeyboardKey.arrowUp);
      await tester.pumpAndSettle();
      expect(plan, 'Starter');
    });

    testWidgets(
      'horizontal group answers to left and right arrows',
      (tester) async {
        final picked = <String>[];
        await pumpUnder(
          tester,
          PlanPicker(
            plan: 'Pro',
            onChanged: picked.add,
            layout: planBar,
            builder: planSegment,
          ),
        );
        await focusAround(tester, find.text('Pro'));
        await tester.sendKeyEvent(
          LogicalKeyboardKey.arrowRight,
        );
        await tester.pumpAndSettle();
        expect(picked, ['Team']);
      },
    );
  });

  group('BillingSelect', () {
    Future<List<String>> pumpSelect(
      WidgetTester tester,
    ) async {
      final picked = <String>[];
      await pumpUnder(
        tester,
        BillingSelect(
          cycle: 'Monthly',
          onChanged: picked.add,
        ),
      );
      return picked;
    }

    testWidgets('is closed until tapped', (tester) async {
      await pumpSelect(tester);
      expect(find.text('Monthly'), findsOneWidget);
      expect(find.text('Yearly'), findsNothing);
    });

    testWidgets('opens on tap and shows both options', (
      tester,
    ) async {
      await pumpSelect(tester);
      await tapAndSettle(tester, find.text('Monthly'));
      expect(find.text('Yearly'), findsOneWidget);
      // The trigger and the option both read Monthly.
      expect(find.text('Monthly'), findsNWidgets(2));
    });

    testWidgets('selecting Yearly reports it and closes', (
      tester,
    ) async {
      final picked = await pumpSelect(tester);
      await tapAndSettle(tester, find.text('Monthly'));
      await tapAndSettle(tester, find.text('Yearly'));
      expect(picked, ['Yearly']);
      expect(find.text('Yearly'), findsNothing);
    });

    testWidgets('Escape closes without reporting', (
      tester,
    ) async {
      final picked = await pumpSelect(tester);
      await tapAndSettle(tester, find.text('Monthly'));
      expect(find.text('Yearly'), findsOneWidget);
      await tester.sendKeyEvent(LogicalKeyboardKey.escape);
      await tester.pumpAndSettle();
      expect(find.text('Yearly'), findsNothing);
      expect(picked, isEmpty);
    });
  });
}
