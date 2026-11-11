import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

// These run from the package root, which is where `flutter test` starts.

/// Dart files under [dir], leaving out `lib/ui`: those are installed by the
/// Remix CLI and are not edited here.
List<File> dartFiles(String dir) =>
    Directory(dir)
        .listSync(recursive: true)
        .whereType<File>()
        .where((f) => f.path.endsWith('.dart'))
        .where((f) => !f.path.startsWith('lib/ui/'))
        .toList()
      ..sort((a, b) => a.path.compareTo(b.path));

/// The three files under "Get started". The Remix one sits in `lib/` so its
/// `ui/ui.dart` import is the line a reader's `lib/main.dart` needs.
final starterFiles = [
  ...dartFiles('lib/starters'),
  File('lib/remix_starter.dart'),
];

final readerFiles = [
  ...dartFiles('lib/demos'),
  ...starterFiles,
];

void main() {
  test('there are reader-facing files to check', () {
    expect(dartFiles('lib/demos'), isNotEmpty);
    expect(starterFiles, hasLength(3));
    expect(
      starterFiles.every((file) => file.existsSync()),
      isTrue,
    );
  });

  group('reader-facing code stays plain', () {
    for (final file in readerFiles) {
      for (final banned in [
        'Prop.',
        '.resolve(',
        '.onBuilder(',
      ]) {
        test('${file.path} does not use $banned', () {
          expect(
            file.readAsStringSync(),
            isNot(contains(banned)),
          );
        });
      }

      test('${file.path} does not import lib/host', () {
        final imports =
            RegExp(
                  r'''^\s*(?:import|export)\s+['"]([^'"]+)['"]''',
                  multiLine: true,
                )
                .allMatches(file.readAsStringSync())
                .map((m) => m.group(1)!);
        for (final uri in imports) {
          expect(
            uri,
            isNot(contains('host/')),
            reason: uri,
          );
          expect(
            uri,
            isNot(contains('mix_showcase/host')),
            reason: uri,
          );
        }
      });
    }
  });

  group('only the themed_plan example uses tokens', () {
    final token = RegExp(r'\$[A-Za-z]\w*(\(|\.mix\(\))');
    for (final file in dartFiles('lib/demos')) {
      if (file.path.contains('/themed_plan/')) continue;
      test(file.path, () {
        final text = file.readAsStringSync();
        expect(text, isNot(contains("'../theme.dart'")));
        expect(
          text,
          isNot(contains('mix_showcase/theme.dart')),
        );
        expect(token.firstMatch(text)?.group(0), isNull);
      });
    }
  });

  group(
    'examples name their colors in lib/colors.dart',
    () {
      for (final file in dartFiles('lib/demos')) {
        test(file.path, () {
          expect(
            file.readAsStringSync(),
            isNot(contains('Color(0x')),
          );
        });
      }
    },
  );

  group('styles are called, never passed as style:', () {
    final banned = RegExp(
      r'\bStyledText\(|\bStyledIcon\(|\b(Flex|Grid)?Box\(style:',
    );
    for (final file in readerFiles) {
      test(file.path, () {
        final text = file.readAsStringSync();
        expect(banned.firstMatch(text)?.group(0), isNull);
      });
    }
  });

  group('a chain of two or more calls is stacked', () {
    // One call per line, so the hierarchy reads at a glance: a chain
    // passed as an argument sits inside its parentheses, each call
    // on its own line. The formatter joins short chains, so a style
    // file starts with `// dart format off`.
    final joined = RegExp(
      r'(^[ \t]*|[(,=][ \t]*\w*(\(\))?)\.[a-zA-Z]\w*\([^()\n]*(\([^()\n]*\))?[^()\n]*\)\.[a-zA-Z]\w*\(',
      multiLine: true,
    );
    for (final file in readerFiles) {
      test(file.path, () {
        final text = file.readAsStringSync();
        expect(joined.firstMatch(text)?.group(0), isNull);
      });
    }
  });

  group('layout is a Mix style, not a Flutter widget', () {
    final layout = RegExp(r'\b(Row|Column|Flex)\(');
    // Plain Flutter on purpose: it shows Naked UI without Mix.
    final exempt = 'lib/starters/naked_ui.dart';
    for (final file in readerFiles) {
      if (file.path == exempt) continue;
      test(file.path, () {
        final text = file.readAsStringSync();
        expect(layout.firstMatch(text)?.group(0), isNull);
      });
    }
  });

  test(
    'the Remix example only composes installed components',
    () {
      final text = dartFiles(
        'lib/demos/checkout',
      ).map((file) => file.readAsStringSync()).join();
      for (final name in [
        'UiTokens',
        'UiTheme',
        'MixScope',
      ]) {
        expect(text, isNot(contains(name)), reason: name);
      }
      // Its only styles are layout.
      final stylers = RegExp(
        r'\b\w*Styler\b',
      ).allMatches(text).map((m) => m.group(0)).toSet();
      expect(stylers, {'FlexBoxStyler'});
    },
  );

  group('starters name each color once, at the top', () {
    final declaration = RegExp(
      r'^const \w+ = Color\(0x[0-9A-Fa-f]{8}\);$',
    );
    for (final file in starterFiles) {
      test(file.path, () {
        for (final line in file.readAsLinesSync()) {
          if (!line.contains('Color(0x')) continue;
          expect(line, matches(declaration));
        }
      });
    }
  });

  group('deprecated Mix shorthands are not used', () {
    const deprecated = [
      '.borderRounded(',
      '.paddingAll(',
      '.paddingX(',
      '.paddingY(',
      '.shapeCircle(',
    ];
    final files = [...readerFiles, File('lib/theme.dart')];
    for (final file in files) {
      test(file.path, () {
        final text = file.readAsStringSync();
        for (final name in deprecated) {
          expect(text, isNot(contains(name)), reason: name);
        }
      });
    }
  });

  test(
    'every #docregion has a matching #enddocregion in the same file',
    () {
      final open = RegExp(r'#docregion\s+([\w.-]+)');
      final close = RegExp(r'#enddocregion\s+([\w.-]+)');
      var regions = 0;
      for (final file in dartFiles('lib')) {
        final text = file.readAsStringSync();
        final opened = open
            .allMatches(text)
            .map((m) => m.group(1)!)
            .toList();
        final closed = close
            .allMatches(text)
            .map((m) => m.group(1)!)
            .toList();
        regions += opened.length;
        for (final name in opened) {
          expect(
            closed,
            contains(name),
            reason: '${file.path}: $name',
          );
        }
        for (final name in closed) {
          expect(
            opened,
            contains(name),
            reason: '${file.path}: $name',
          );
        }
      }
      expect(regions, greaterThan(0));
    },
  );

  test(
    'theme_test checks every color token declared in theme.dart',
    () {
      final declared =
          RegExp(r"const \$(\w+) = ColorToken\(")
              .allMatches(
                File('lib/theme.dart').readAsStringSync(),
              )
              .length;
      final tested = RegExp(r'^\s+\$\w+,$', multiLine: true)
          .allMatches(
            File(
              'test/theme_test.dart',
            ).readAsStringSync().split('void main').first,
          )
          .length;
      expect(tested, declared);
    },
  );
}
