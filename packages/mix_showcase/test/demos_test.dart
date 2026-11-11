import 'dart:math';

import 'package:flutter/gestures.dart';
import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mix/mix.dart' show Box;
import 'package:mix_showcase/colors.dart';
import 'package:mix_showcase/demos/upgrade_button/upgrade_button.dart';
import 'package:mix_showcase/demos/bell/bell.dart';
import 'package:mix_showcase/demos/confirm_button/confirm_button.dart';
import 'package:mix_showcase/demos/toggle/style.dart';
import 'package:mix_showcase/demos/toggle/toggle.dart';
import 'package:mix_showcase/demos/plan_card/plan_card.dart';
import 'package:mix_showcase/demos/plans.dart';
import 'package:mix_showcase/demos/plan_list/plan_list.dart';
import 'package:mix_showcase/demos/action_button/action_button.dart';
import 'package:mix_showcase/demos/themed_plan/themed_plan.dart';
import 'package:mix_showcase/theme.dart';

import 'support.dart';

/// The border color of the first decorated box that has a border.
Color? borderColor(WidgetTester tester) {
  for (final box in tester.widgetList<DecoratedBox>(
    find.byType(DecoratedBox),
  )) {
    final deco = box.decoration;
    if (deco is BoxDecoration && deco.border is Border) {
      return (deco.border! as Border).top.color;
    }
  }
  return null;
}

/// The plan the single-card tests show.
const pro = (
  name: 'Pro',
  price: r'$12',
  note: 'Unlimited projects',
);

void main() {
  group('every demo pumps under every theme', () {
    final demos = <String, Widget Function()>{
      'UpgradeButton': () => UpgradeButton(onPress: () {}),
      'PlanCard': () => const PlanCard(plan: pro),
      'PlanCard highlighted': () =>
          const PlanCard(plan: pro, highlight: true),
      'ActionButton': () =>
          ActionButton(label: 'Save', onPress: () {}),
      'ActionButton disabled': () =>
          const ActionButton(label: 'Save'),
      'PlanList': () => const SizedBox(
        width: 800,
        height: 300,
        child: PlanList(),
      ),
      'Toggle': () => Toggle(
        label: 'Yearly billing',
        on: true,
        onChanged: (_) {},
        motion: spring,
      ),
      'ConfirmButton': () => const ConfirmButton(),
      'Bell': () => const Bell(),
      'ThemedPlan': () => ThemedPlan(onUpgrade: () {}),
    };
    for (final MapEntry(key: name, value: theme)
        in themes.entries) {
      for (final MapEntry(:key, :value) in demos.entries) {
        testWidgets('$key / $name', (tester) async {
          await pumpUnder(tester, value(), theme: theme);
          await tester.pumpAndSettle();
          expect(tester.takeException(), isNull);
        });
      }
    }
  });

  group('UpgradeButton', () {
    testWidgets('calls onPress on tap', (tester) async {
      var presses = 0;
      await pumpUnder(
        tester,
        UpgradeButton(onPress: () => presses++),
      );
      await tapAndSettle(
        tester,
        find.text('Upgrade to Pro'),
      );
      expect(presses, 1);
    });

    for (final (name, key) in [
      ('Enter', LogicalKeyboardKey.enter),
      ('Space', LogicalKeyboardKey.space),
    ]) {
      testWidgets('calls onPress on $name', (tester) async {
        var presses = 0;
        await pumpUnder(
          tester,
          UpgradeButton(onPress: () => presses++),
        );
        await focusAround(
          tester,
          find.text('Upgrade to Pro'),
        );
        await tester.sendKeyEvent(key);
        await tester.pumpAndSettle();
        expect(presses, 1);
      });
    }
  });

  group('PlanCard', () {
    testWidgets('highlight changes the border color', (
      tester,
    ) async {
      await pumpUnder(tester, const PlanCard(plan: pro));
      await tester.pumpAndSettle();
      expect(borderColor(tester), slate);

      await pumpUnder(
        tester,
        const PlanCard(plan: pro, highlight: true),
      );
      await tester.pumpAndSettle();
      expect(borderColor(tester), purple);
    });

    testWidgets('renders name, price and note', (
      tester,
    ) async {
      await pumpUnder(tester, const PlanCard(plan: pro));
      expect(find.text('Pro'), findsOneWidget);
      expect(find.text(r'$12'), findsOneWidget);
      expect(
        find.text('Unlimited projects'),
        findsOneWidget,
      );
    });
  });

  group('ThemedPlan', () {
    Iterable<Color?> fills(WidgetTester tester) => tester
        .widgetList<DecoratedBox>(find.byType(DecoratedBox))
        .map((box) => box.decoration)
        .whereType<BoxDecoration>()
        .map((deco) => deco.color);

    for (final MapEntry(key: name, value: theme)
        in themes.entries) {
      testWidgets(
        'the card takes its color from $name',
        (tester) async {
          await pumpUnder(
            tester,
            ThemedPlan(onUpgrade: () {}),
            theme: theme,
          );
          await tester.pumpAndSettle();
          expect(
            fills(tester),
            contains(theme.colors[$surface]),
          );
          expect(
            fills(tester),
            contains(theme.colors[$primary]),
          );
        },
      );
    }

    testWidgets('a theme change reaches the card', (
      tester,
    ) async {
      await pumpUnder(
        tester,
        ThemedPlan(onUpgrade: () {}),
        theme: midnight,
      );
      await tester.pumpAndSettle();
      await pumpUnder(
        tester,
        ThemedPlan(onUpgrade: () {}),
        theme: pop,
      );
      await tester.pumpAndSettle();
      expect(fills(tester), contains(pop.colors[$surface]));
      expect(
        fills(tester),
        isNot(contains(midnight.colors[$surface])),
      );
    });

    testWidgets('tapping the button calls onUpgrade', (
      tester,
    ) async {
      var upgrades = 0;
      await pumpUnder(
        tester,
        ThemedPlan(onUpgrade: () => upgrades++),
      );
      await tapAndSettle(
        tester,
        find.text('Upgrade to Pro'),
      );
      expect(upgrades, 1);
    });
  });

  group('ActionButton', () {
    testWidgets(
      'onPress null is not tappable and reports disabled',
      (tester) async {
        final controller = WidgetStatesController();
        addTearDown(controller.dispose);
        await pumpUnder(
          tester,
          ActionButton(
            label: 'Save',
            controller: controller,
          ),
        );
        await tester.pumpAndSettle();
        expect(
          controller.value,
          contains(WidgetState.disabled),
        );
        await tester.tap(
          find.text('Save'),
          warnIfMissed: false,
        );
        await tester.pumpAndSettle();
        expect(
          controller.value,
          isNot(contains(WidgetState.pressed)),
        );
      },
    );

    testWidgets('enabled button is not disabled and taps', (
      tester,
    ) async {
      final controller = WidgetStatesController();
      addTearDown(controller.dispose);
      var presses = 0;
      await pumpUnder(
        tester,
        ActionButton(
          label: 'Save',
          onPress: () => presses++,
          controller: controller,
        ),
      );
      expect(
        controller.value,
        isNot(contains(WidgetState.disabled)),
      );
      await tapAndSettle(tester, find.text('Save'));
      expect(presses, 1);
    });

    testWidgets('mouse hover sets hovered', (tester) async {
      final controller = WidgetStatesController();
      addTearDown(controller.dispose);
      await pumpUnder(
        tester,
        ActionButton(
          label: 'Save',
          onPress: () {},
          controller: controller,
        ),
      );
      final gesture = await tester.createGesture(
        kind: PointerDeviceKind.mouse,
      );
      addTearDown(gesture.removePointer);
      await gesture.addPointer(location: Offset.zero);
      await gesture.moveTo(
        tester.getCenter(find.text('Save')),
      );
      await tester.pump();
      expect(
        controller.value,
        contains(WidgetState.hovered),
      );
      await gesture.moveTo(const Offset(1, 1));
      await tester.pump();
      expect(
        controller.value,
        isNot(contains(WidgetState.hovered)),
      );
    });
  });

  group('PlanList', () {
    Future<void> pumpAt(WidgetTester tester, double width) {
      return pumpUnder(
        tester,
        MediaQuery(
          data: MediaQueryData(size: Size(width, 600)),
          child: SizedBox(
            width: width,
            height: 600,
            child: const PlanList(),
          ),
        ),
      );
    }

    /// The top edge of each plan card, in plan order.
    List<double> tops(WidgetTester tester) => [
      for (final plan in plans)
        tester.getTopLeft(find.text(plan.name)).dy,
    ];

    testWidgets(
      'puts the three cards in one row when wide',
      (tester) async {
        await pumpAt(tester, 840);
        // The featured card is lifted a few pixels; a row
        // is anything closer than a card's height.
        final row = tops(tester);
        expect(
          row.reduce(max) - row.reduce(min),
          lessThan(20),
        );
      },
    );

    testWidgets('stacks the cards when compact', (
      tester,
    ) async {
      await pumpAt(tester, 360);
      final [first, second, third] = tops(tester);
      expect(second, greaterThan(first + 40));
      expect(third, greaterThan(second + 40));
    });

    testWidgets('shows all three plans', (tester) async {
      await pumpAt(tester, 840);
      for (final plan in plans) {
        expect(find.text(plan.name), findsOneWidget);
      }
    });
  });

  group('motion', () {
    testWidgets(
      'Toggle tap calls onChanged with the opposite value',
      (tester) async {
        final calls = <bool>[];
        await pumpUnder(
          tester,
          Toggle(
            label: 'Yearly billing',
            on: false,
            onChanged: calls.add,
            motion: ease,
          ),
        );
        await tapAndSettle(tester, find.byType(Toggle));
        expect(calls, [true]);

        await pumpUnder(
          tester,
          Toggle(
            label: 'Yearly billing',
            on: true,
            onChanged: calls.add,
            motion: ease,
          ),
        );
        await tapAndSettle(tester, find.byType(Toggle));
        expect(calls, [true, false]);
      },
    );

    testWidgets('Toggle moves its thumb when on changes', (
      tester,
    ) async {
      Widget toggle(bool on) => Toggle(
        label: 'Yearly billing',
        on: on,
        onChanged: (_) {},
        motion: ease,
      );
      await pumpUnder(tester, toggle(false));
      await tester.pumpAndSettle();
      final thumb = find.descendant(
        of: find.byType(Toggle),
        matching: find.byType(Box),
      );
      final off = tester.getCenter(thumb.last).dx;
      await pumpUnder(tester, toggle(true));
      await tester.pumpAndSettle();
      expect(
        tester.getCenter(thumb.last).dx,
        greaterThan(off + 20),
      );
    });

    testWidgets(
      'ConfirmButton animates after a tap and settles',
      (tester) async {
        await pumpUnder(tester, const ConfirmButton());
        await tester.tap(find.text('Add to plan'));
        await tester.pump(const Duration(milliseconds: 60));
        expect(tester.hasRunningAnimations, isTrue);
        await tester.pumpAndSettle();
        expect(tester.takeException(), isNull);
        expect(tester.hasRunningAnimations, isFalse);
      },
    );

    testWidgets('Bell animates after a tap and settles', (
      tester,
    ) async {
      await pumpUnder(tester, const Bell());
      await tester.tap(find.byType(Bell));
      await tester.pump(const Duration(milliseconds: 60));
      expect(tester.hasRunningAnimations, isTrue);
      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull);
    });
  });
}
