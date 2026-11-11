import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mix_showcase/starters/mix.dart'
    as mix_starter;
import 'package:mix_showcase/starters/naked_ui.dart'
    as naked_starter;
import 'package:mix_showcase/remix_starter.dart'
    as remix_starter;
import 'package:remix/remix.dart';

/// Runs [body] with debugPrint captured. The restore must happen before the
/// test ends, because the framework checks debug variables right after it.
Future<List<String>> capturePrints(
  Future<void> Function() body,
) async {
  final original = debugPrint;
  final printed = <String>[];
  debugPrint = (message, {wrapWidth}) =>
      printed.add(message ?? '');
  try {
    await body();
  } finally {
    debugPrint = original;
  }
  return printed;
}

void main() {
  group('Mix starter', () {
    testWidgets('pumps', (tester) async {
      await tester.pumpWidget(const mix_starter.App());
      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull);
      expect(find.text('Hello, Mix'), findsOneWidget);
    });

    testWidgets('button responds to a tap', (tester) async {
      final printed = await capturePrints(() async {
        await tester.pumpWidget(const mix_starter.App());
        await tester.tap(find.text('Hello, Mix'));
        await tester.pumpAndSettle();
      });
      expect(printed, ['Pressed']);
    });
  });

  group('Naked UI starter', () {
    testWidgets('pumps', (tester) async {
      await tester.pumpWidget(const naked_starter.App());
      expect(tester.takeException(), isNull);
      expect(find.text('Email me updates'), findsOneWidget);
    });

    testWidgets('checkbox toggles on tap', (tester) async {
      await tester.pumpWidget(const naked_starter.App());
      Color? fill() {
        final deco = tester
            .widgetList<Container>(find.byType(Container))
            .map((c) => c.decoration)
            .whereType<BoxDecoration>()
            .first;
        return deco.color;
      }

      expect(fill(), const Color(0x00000000));
      await tester.tap(find.text('Email me updates'));
      await tester.pumpAndSettle();
      expect(fill(), const Color(0xFF6D4AFF));
      await tester.tap(find.text('Email me updates'));
      await tester.pumpAndSettle();
      expect(fill(), const Color(0x00000000));
    });
  });

  group('Remix starter', () {
    testWidgets('pumps', (tester) async {
      await tester.pumpWidget(const remix_starter.App());
      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull);
      expect(find.byType(RemixButton), findsOneWidget);
      expect(find.text('Save'), findsOneWidget);
    });

    testWidgets('button is tappable', (tester) async {
      final printed = await capturePrints(() async {
        await tester.pumpWidget(const remix_starter.App());
        await tester.tap(find.text('Save'));
        await tester.pumpAndSettle();
      });
      expect(printed, ['Saved']);
    });
  });
}
