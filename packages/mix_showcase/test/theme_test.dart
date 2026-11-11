import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mix/mix.dart';
import 'package:mix_showcase/theme.dart';

import 'support.dart';

const colorTokens = [
  $canvas,
  $surface,
  $outline,
  $ink,
  $muted,
  $primary,
  $primaryHover,
  $onPrimary,
];

void main() {
  test('there are four themes with unique ids', () {
    expect(themes.keys, [
      'midnight',
      'paper',
      'pop',
      'terminal',
    ]);
  });

  for (final MapEntry(key: name, value: theme)
      in themes.entries) {
    group(name, () {
      test('supplies every color token', () {
        for (final token in colorTokens) {
          expect(
            theme.colors.containsKey(token),
            isTrue,
            reason: token.name,
          );
        }
        expect(theme.colors.length, colorTokens.length);
      });

      test('text styles cover title, body and label', () {
        final styles = theme.textStyles;
        expect(
          styles.keys,
          containsAll([$title, $body, $label]),
        );
        expect(styles[$body]!.fontFamily, theme.font);
        expect(
          styles[$title]!.fontFamily,
          theme.titleFont ?? theme.font,
        );
      });

      testWidgets('resolves every token through MixScope', (
        tester,
      ) async {
        late BuildContext captured;
        await pumpUnder(
          tester,
          Builder(
            builder: (context) {
              captured = context;
              return const SizedBox();
            },
          ),
          theme: theme,
        );
        for (final token in colorTokens) {
          expect(
            MixScope.tokenOf(token, captured),
            theme.colors[token],
            reason: token.name,
          );
        }
        expect(
          MixScope.tokenOf($radius, captured),
          Radius.circular(theme.radius),
        );
        expect(MixScope.tokenOf($gap, captured), theme.gap);
        for (final token in [$title, $body, $label]) {
          expect(
            MixScope.tokenOf(token, captured),
            theme.textStyles[token],
          );
        }
      });
    });
  }

  testWidgets(
    'switching the theme changes the color of a styled Box',
    (tester) async {
      final style = BoxStyler()
          .color($primary())
          .size(40, 40);
      Color? colorOf() {
        final box = tester.widget<DecoratedBox>(
          find.byType(DecoratedBox).last,
        );
        return (box.decoration as BoxDecoration).color;
      }

      await pumpUnder(
        tester,
        Box(style: style),
        theme: midnight,
      );
      expect(colorOf(), midnight.colors[$primary]);

      await pumpUnder(
        tester,
        Box(style: style),
        theme: paper,
      );
      await tester.pumpAndSettle();
      expect(colorOf(), paper.colors[$primary]);
    },
  );

  testWidgets('radius and gap tokens follow the theme', (
    tester,
  ) async {
    final style = BoxStyler()
        .padding(.all($gap()))
        .borderRadius(.all($radius()))
        .color($ink());
    for (final theme in [pop, terminal]) {
      await pumpUnder(
        tester,
        Box(style: style),
        theme: theme,
      );
      final padding = tester.widget<Padding>(
        find
            .descendant(
              of: find.byType(Box),
              matching: find.byType(Padding),
            )
            .first,
      );
      expect(padding.padding, EdgeInsets.all(theme.gap));
      final deco = tester
          .widgetList<DecoratedBox>(
            find.byType(DecoratedBox),
          )
          .map((d) => d.decoration)
          .whereType<BoxDecoration>()
          .firstWhere((d) => d.color == theme.colors[$ink]);
      expect(
        deco.borderRadius,
        BorderRadius.all(Radius.circular(theme.radius)),
      );
    }
  });
}
