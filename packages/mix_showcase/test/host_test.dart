import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mix_showcase/demos/billing_select/billing_select.dart';
import 'package:mix_showcase/demos/checkout/checkout.dart';
import 'package:mix_showcase/demos/bell/bell.dart';
import 'package:mix_showcase/demos/confirm_button/confirm_button.dart';
import 'package:mix_showcase/demos/toggle/toggle.dart';
import 'package:mix_showcase/demos/plan_picker/plan_picker.dart';
import 'package:mix_showcase/demos/plan_picker/plan_row.dart';
import 'package:mix_showcase/demos/plan_picker/plan_segment.dart';
import 'package:mix_showcase/demos/action_button/action_button.dart';
import 'package:mix_showcase/host/demos.dart';
import 'package:mix_showcase/host/host.dart';
import 'package:mix_showcase/host/views.dart';
import 'package:mix_showcase/theme.dart';
import 'package:mix_showcase/ui/ui.dart';
import 'package:remix/remix.dart';

import 'support.dart';

void main() {
  group('Host', () {
    late Host host;
    late int notified;

    setUp(() {
      host = Host();
      notified = 0;
      host.addListener(() => notified++);
    });
    tearDown(() => host.dispose());

    test('starts on midnight', () {
      expect(host.theme, midnight);
    });

    test('apply theme switches and notifies', () {
      host.apply({'theme': 'paper'});
      expect(host.theme, paper);
      expect(notified, 1);
    });

    test('unknown theme ids are ignored', () {
      host.apply({'theme': 'paper'});
      host.apply({'theme': 'nope'});
      expect(host.theme, paper);
    });

    test('apply set stores values readable per demo', () {
      host.apply({
        'demo': 'x',
        'set': {'name': 'Ada', 'flag': true},
      });
      expect(host.read('x', 'name', ''), 'Ada');
      expect(host.read('x', 'flag', false), isTrue);
      expect(
        host.read('y', 'name', 'fallback'),
        'fallback',
      );
    });

    test(
      'read falls back when the type does not match',
      () {
        host.apply({
          'demo': 'x',
          'set': {'name': 3},
        });
        expect(
          host.read('x', 'name', 'fallback'),
          'fallback',
        );
        expect(host.read('x', 'missing', 7), 7);
      },
    );

    test('read coerces an int to a double', () {
      host.apply({
        'demo': 'x',
        'set': {'width': 360},
      });
      expect(host.read('x', 'width', 840.0), 360.0);
      expect(host.read('x', 'width', 840.0), isA<double>());
    });

    test('successive set messages merge', () {
      host.apply({
        'demo': 'x',
        'set': {'a': 1},
      });
      host.apply({
        'demo': 'x',
        'set': {'b': 2},
      });
      expect(host.read('x', 'a', 0), 1);
      expect(host.read('x', 'b', 0), 2);
    });

    test('list keeps only strings', () {
      host.apply({
        'demo': 'x',
        'set': {
          'hold': ['hovered', 3, null, 'focused'],
        },
      });
      expect(host.list('x', 'hold'), [
        'hovered',
        'focused',
      ]);
      expect(host.list('x', 'missing'), isEmpty);
    });

    test('set and keep store values and notify', () {
      host.set('x', 'k', 'v');
      host.keep('x', 'k2', 'v2');
      expect(host.read('x', 'k', ''), 'v');
      expect(host.read('x', 'k2', ''), 'v2');
      expect(notified, 2);
    });

    testWidgets('assign points a view at a demo', (
      tester,
    ) async {
      expect(host.demoOf(3), '');
      host.apply({
        'assign': {'view': 3, 'demo': 'tokens'},
      });
      expect(host.demoOf(3), 'tokens');
      expect(host.demoOf(4), '');
      await tester.pump();
    });
  });

  group('buildDemo', () {
    test('ids are the eight page demos', () {
      expect(demoIds.toSet(), {
        'button',
        'style',
        'tokens',
        'states',
        'responsive',
        'motion',
        'naked',
        'remix',
      });
    });

    test('unknown ids build an empty box', () {
      expect(buildDemo('nope', Host()), isA<SizedBox>());
    });

    for (final name in themes.keys) {
      for (final id in demoIds) {
        testWidgets(
          '$id pumps in DemoView under $name',
          (tester) async {
            final host = Host()..apply({'theme': name});
            addTearDown(host.dispose);
            await tester.pumpWidget(
              DemoView(demo: id, host: host),
            );
            await tester.pumpAndSettle();
            expect(tester.takeException(), isNull);
          },
        );
      }
    }
  });

  group('demo variants', () {
    late Host host;
    setUp(() => host = Host());
    tearDown(() => host.dispose());

    Future<void> pump(
      WidgetTester tester,
      String id,
    ) async {
      await tester.pumpWidget(
        DemoView(demo: id, host: host),
      );
      await tester.pumpAndSettle();
    }

    testWidgets(
      'remix shows the checkout under the installed theme',
      (tester) async {
        await pump(tester, 'remix');
        expect(find.byType(Checkout), findsOneWidget);
        expect(
          find.ancestor(
            of: find.byType(Checkout),
            matching: find.byType(UiTheme),
          ),
          findsOneWidget,
        );
        expect(
          tester.widget<UiTheme>(find.byType(UiTheme)).mode,
          UiThemeMode.light,
        );
      },
    );

    testWidgets('only the remix view places UiTheme', (
      tester,
    ) async {
      await pump(tester, 'states');
      expect(find.byType(UiTheme), findsNothing);
    });

    testWidgets(
      'remix button shows loading, then returns',
      (tester) async {
        await pump(tester, 'remix');
        final start = find.byWidgetPredicate(
          (widget) =>
              widget is RemixButton &&
              widget.label.startsWith('Start'),
        );
        bool loading() =>
            tester.widget<RemixButton>(start).loading;
        expect(loading(), isFalse);
        await tester.tap(start);
        await tester.pump();
        expect(loading(), isTrue);
        await tester.pump(
          const Duration(milliseconds: 1500),
        );
        expect(loading(), isFalse);
      },
    );

    testWidgets('naked shows both drawings of one picker', (
      tester,
    ) async {
      await pump(tester, 'naked');
      expect(find.byType(BillingSelect), findsNothing);
      final pickers = tester
          .widgetList<PlanPicker>(find.byType(PlanPicker))
          .toList();
      expect(pickers.map((p) => (p.layout, p.builder)), [
        (planRows, planRow),
        (planBar, planSegment),
      ]);
      expect(pickers.map((p) => p.plan), ['Pro', 'Pro']);
    });

    testWidgets('naked switches to BillingSelect', (
      tester,
    ) async {
      host.apply({
        'demo': 'naked',
        'set': {'widget': 'select'},
      });
      await pump(tester, 'naked');
      expect(find.byType(BillingSelect), findsOneWidget);
      expect(find.byType(PlanPicker), findsNothing);
    });

    testWidgets(
      'naked focus reporting preserves radio traversal and select operation',
      (tester) async {
        await pump(tester, 'naked');
        await focusAround(tester, find.text('Pro').first);
        await tester.sendKeyEvent(
          LogicalKeyboardKey.arrowDown,
        );
        await tester.pumpAndSettle();
        expect(host.read('naked', 'plan', ''), 'Team');

        await tester.sendKeyEvent(LogicalKeyboardKey.tab);
        await tester.pumpAndSettle();
        final second = Focus.of(
          tester.element(find.text('Team').last),
        );
        expect(second.hasPrimaryFocus, isTrue);
        await tester.sendKeyEvent(LogicalKeyboardKey.tab);
        await tester.pumpAndSettle();
        expect(second.hasFocus, isFalse);

        host.set('naked', 'widget', 'select');
        await tester.pumpAndSettle();
        await focusAround(tester, find.text('Monthly'));
        await tester.sendKeyEvent(LogicalKeyboardKey.enter);
        await tester.pumpAndSettle();
        expect(find.text('Yearly'), findsOneWidget);
        await tester.sendKeyEvent(
          LogicalKeyboardKey.arrowDown,
        );
        await tester.sendKeyEvent(LogicalKeyboardKey.enter);
        await tester.pumpAndSettle();
        expect(host.read('naked', 'cycle', ''), 'Yearly');
      },
    );

    testWidgets(
      'choosing a plan is remembered by the host',
      (tester) async {
        await pump(tester, 'naked');
        await tester.tap(find.text('Team').first);
        await tester.pumpAndSettle();
        expect(host.read('naked', 'plan', ''), 'Team');
        // Both drawings follow the one selection.
        expect(
          tester
              .widgetList<PlanPicker>(
                find.byType(PlanPicker),
              )
              .map((picker) => picker.plan),
          ['Team', 'Team'],
        );
      },
    );

    testWidgets(
      'selecting a cycle is remembered by the host',
      (tester) async {
        host.apply({
          'demo': 'naked',
          'set': {'widget': 'select'},
        });
        await pump(tester, 'naked');
        await tester.tap(find.text('Monthly'));
        await tester.pumpAndSettle();
        await tester.tap(find.text('Yearly'));
        await tester.pumpAndSettle();
        expect(host.read('naked', 'cycle', ''), 'Yearly');
        expect(find.text('Yearly'), findsOneWidget);
      },
    );

    /// Whether the three plan cards share one row. The
    /// featured card is lifted a few pixels, so tops closer
    /// than 20 pixels count as one row.
    bool inOneRow(WidgetTester tester) {
      final tops = [
        for (final name in ['Starter', 'Pro', 'Team'])
          tester.getTopLeft(find.text(name)).dy,
      ]..sort();
      return tops.last - tops.first < 20;
    }

    testWidgets('responsive is compact at width 360', (
      tester,
    ) async {
      host.apply({
        'demo': 'responsive',
        'set': {'width': 360},
      });
      await pump(tester, 'responsive');
      expect(inOneRow(tester), isFalse);
    });

    testWidgets('responsive is wide at width 840', (
      tester,
    ) async {
      host.apply({
        'demo': 'responsive',
        'set': {'width': 840},
      });
      await pump(tester, 'responsive');
      expect(inOneRow(tester), isTrue);
    });

    testWidgets('motion picks its example from mode', (
      tester,
    ) async {
      await pump(tester, 'motion');
      expect(find.byType(Toggle), findsOneWidget);

      host.apply({
        'demo': 'motion',
        'set': {'mode': 'phases'},
      });
      await tester.pumpAndSettle();
      expect(find.byType(ConfirmButton), findsOneWidget);

      host.apply({
        'demo': 'motion',
        'set': {'mode': 'keyframes'},
      });
      await tester.pumpAndSettle();
      expect(find.byType(Bell), findsOneWidget);
    });

    testWidgets('states can be disabled from the page', (
      tester,
    ) async {
      host.apply({
        'demo': 'states',
        'set': {'enabled': false},
      });
      await pump(tester, 'states');
      expect(
        tester
            .widget<ActionButton>(find.byType(ActionButton))
            .onPress,
        isNull,
      );
    });

    for (final release in [true, false]) {
      testWidgets(
        'focused hold restores the prior strategy when ${release ? 'released' : 'recycled'}',
        (tester) async {
          final focus = FocusManager.instance;
          final original = focus.highlightStrategy;
          addTearDown(
            () => focus.highlightStrategy = original,
          );
          focus.highlightStrategy =
              FocusHighlightStrategy.alwaysTouch;
          host.set('states', 'hold', ['focused']);
          await pump(tester, 'states');
          expect(
            focus.highlightStrategy,
            FocusHighlightStrategy.alwaysTraditional,
          );

          if (release) {
            host.set('states', 'hold', <String>[]);
            await tester.pumpAndSettle();
          } else {
            await pump(tester, 'button');
          }
          expect(
            focus.highlightStrategy,
            FocusHighlightStrategy.alwaysTouch,
          );
        },
      );
    }

    testWidgets(
      'replacing a focused demo preserves its hold and original strategy',
      (tester) async {
        final focus = FocusManager.instance;
        final original = focus.highlightStrategy;
        addTearDown(
          () => focus.highlightStrategy = original,
        );
        focus.highlightStrategy =
            FocusHighlightStrategy.alwaysTouch;
        host.set('states', 'hold', ['focused']);
        for (final key in ['first', 'replacement']) {
          await tester.pumpWidget(
            DemoView(
              key: ValueKey(key),
              demo: 'states',
              host: host,
            ),
          );
          await tester.pumpAndSettle();
          expect(
            focus.highlightStrategy,
            FocusHighlightStrategy.alwaysTraditional,
          );
        }
        host.set('states', 'hold', <String>[]);
        await tester.pumpAndSettle();
        expect(
          focus.highlightStrategy,
          FocusHighlightStrategy.alwaysTouch,
        );
      },
    );

    testWidgets(
      'states restores held states after remount',
      (tester) async {
        WidgetStatesController controller() => tester
            .widget<ActionButton>(find.byType(ActionButton))
            .controller!;

        await pump(tester, 'states');
        host.apply({
          'demo': 'states',
          'set': {
            'hold': ['hovered', 'pressed'],
          },
        });
        await tester.pumpAndSettle();
        final original = controller();
        expect(
          original.value,
          containsAll([
            WidgetState.hovered,
            WidgetState.pressed,
          ]),
        );

        await pump(tester, 'button');
        await pump(tester, 'states');
        expect(controller(), isNot(same(original)));
        expect(
          controller().value,
          containsAll([
            WidgetState.hovered,
            WidgetState.pressed,
          ]),
        );

        host.apply({
          'demo': 'states',
          'set': {'hold': <String>[]},
        });
        await tester.pumpAndSettle();
        expect(
          controller().value,
          isNot(contains(WidgetState.hovered)),
        );
        expect(
          controller().value,
          isNot(contains(WidgetState.pressed)),
        );
      },
    );
  });

  testWidgets('Gallery pumps', (tester) async {
    final host = Host();
    addTearDown(host.dispose);
    await tester.pumpWidget(Gallery(host: host));
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull);
    expect(find.text('Midnight'), findsOneWidget);
  });

  testWidgets('Gallery theme chips switch the host theme', (
    tester,
  ) async {
    final host = Host();
    addTearDown(host.dispose);
    await tester.pumpWidget(Gallery(host: host));
    await tester.tap(find.text('Terminal'));
    await tester.pumpAndSettle();
    expect(host.theme, terminal);
  });
}
