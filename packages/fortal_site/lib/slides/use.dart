// The "use it" slide, the last: how Fortal gets into an app, in three steps,
// over the Beira-Mar photo it shares with the foundations slide before it.
import 'package:flutter/widgets.dart';

import '../backdrops.dart';
import '../kit.dart';
import '../theme.dart';
import '../ui/ui.dart';

class UseSlide extends StatelessWidget {
  const UseSlide({super.key, this.compact = false});

  final bool compact;

  @override
  Widget build(BuildContext context) => ValueListenableBuilder(
    valueListenable: siteAccent,
    builder: (context, accent, _) => _build(accent),
  );

  Widget _build(UiAccentColor accent) {
    final heading = SlideHeading(
      label: 'Use it',
      title: 'Installed as source you can edit.',
      detail: 'Fortal components are copied into your app, so you can read and edit every one.',
      onDark: true,
      compact: compact,
    );
    // The command-line tool is installed once, globally; `remix` is then on
    // the path. The version constraint is needed while 1.0 is in beta: the
    // newest stable release is the older 0.1.
    final setUp = _Step(
      number: '1',
      title: 'Install the CLI',
      detail: '',
      code: const CodeCard(
        oneLine: true,
        lines: [
          CodeLine([
            ('dart pub global ', CodeTone.plain),
            ('activate', CodeTone.value),
            (' remix_cli ', CodeTone.type),
            ("'^1.0.0-beta.1'", CodeTone.text),
          ]),
        ],
      ),
    );
    final add = _Step(
      number: '2',
      title: 'Add Fortal',
      detail: '',
      code: const CodeCard(
        oneLine: true,
        lines: [
          CodeLine([
            ('remix', CodeTone.type),
            (' init', CodeTone.value),
            (' --preset fortal', CodeTone.plain),
          ]),
          CodeLine([
            ('remix', CodeTone.type),
            (' add', CodeTone.value),
            (' button card textfield', CodeTone.plain),
          ]),
        ],
      ),
    );
    final use = _Step(
      number: '3',
      title: 'Use it',
      detail: '',
      code: CodeCard(
        oneLine: true,
        lines: [
          const CodeLine([('UiTheme', CodeTone.type), ('(', CodeTone.plain)]),
          CodeLine([
            ('  accent: .', CodeTone.plain),
            (accent.name, CodeTone.value),
            (',', CodeTone.plain),
          ]),
          const CodeLine([
            ('  child: ', CodeTone.plain),
            ('UiButton', CodeTone.type),
            ('(', CodeTone.plain),
          ]),
          const CodeLine([
            ('    label: ', CodeTone.plain),
            ("'Send invite'", CodeTone.text),
            (',', CodeTone.plain),
          ]),
          const CodeLine([('    onPressed: send,', CodeTone.plain)]),
          const CodeLine([('  ),', CodeTone.plain)]),
          const CodeLine([(')', CodeTone.plain)]),
        ],
      ),
    );
    final backdrop = CityBackdrop(compact: compact);
    // The site's closing line, white over the photo's dark green wash.
    const closing = Text(
      'Built with Mix and Remix.',
      style: TextStyle(
        fontSize: 17,
        fontWeight: FontWeight.w600,
        color: Color(0xF2FFFFFF),
      ),
    );
    // What "installed as source" means, under the two steps that do it.
    final note = Text(
      'The files land in lib/ui, and are yours to edit.',
      style: TextStyle(
        fontSize: compact ? 17 : TypeSize.detail,
        height: 1.4,
        color: const Color(0xC7FFFFFF),
      ),
    );
    if (compact) {
      return NarrowSection(
        backdrop: backdrop,
        children: [heading, setUp, add, note, use, closing, const CityCredit()],
      );
    }
    return SlideFrame(
      backdrop: backdrop,
      child: Stack(
        children: [
          Positioned(left: gutter, top: headingTop, width: 900, child: heading),
          // The two commands stacked in a column two walls wide, so each
          // stays on one line, with the note under them; the code that uses
          // Fortal in the third wall.
          Positioned(
            left: gutter,
            right: gutter,
            top: _stepsTop,
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              spacing: Gap.x6,
              children: [
                SizedBox(
                  width: 2 * wallWidth + Gap.x6,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    spacing: Gap.x6,
                    children: [setUp, add, note],
                  ),
                ),
                SizedBox(width: wallWidth, child: use),
              ],
            ),
          ),
          // The closing line, over the bay below the steps.
          Positioned(left: gutter, bottom: 900 - 785 + Gap.x12, child: closing),
        ],
      ),
    );
  }
}

// The steps follow the one-line heading 48 below its detail line.
const _stepsTop = headingTop + 114 + Gap.x12;

class _Step extends StatelessWidget {
  const _Step({
    required this.number,
    required this.title,
    required this.detail,
    required this.code,
  });

  final String number;
  final String title;
  final String detail;
  final Widget code;

  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.stretch,
    spacing: Gap.x3,
    children: [
      Row(
        spacing: Gap.x3,
        children: [
          Container(
            width: 30,
            height: 30,
            alignment: Alignment.center,
            decoration: const BoxDecoration(
              color: Color(0x298FE3D6),
              shape: BoxShape.circle,
            ),
            child: Text(
              number,
              style: const TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w700,
                color: Color(0xFF8FE3D6),
              ),
            ),
          ),
          Text(
            title,
            style: const TextStyle(
              fontSize: 21,
              fontWeight: FontWeight.w700,
              color: Color(0xFFFFFFFF),
            ),
          ),
          Expanded(
            child: Text(
              detail,
              textAlign: TextAlign.right,
              style: const TextStyle(fontSize: 15.5, color: Color(0xB3FFFFFF)),
            ),
          ),
        ],
      ),
      code,
    ],
  );
}

/// How one run of code is coloured.
enum CodeTone {
  plain(Color(0xFFDDEEEA)),
  type(Color(0xFF8FE3D6)),
  value(Color(0xFFF2C879)),
  text(Color(0xFFB8E28A));

  const CodeTone(this.color);

  final Color color;
}

/// One line of code, as runs of text and their tones.
class CodeLine {
  const CodeLine(this.runs);

  final List<(String, CodeTone)> runs;
}

/// Code on a dark panel, in a fixed-width face.
class CodeCard extends StatelessWidget {
  const CodeCard({super.key, required this.lines, this.oneLine = false});

  final List<CodeLine> lines;

  /// Keeps every line whole: where one is too wide, as on a phone, the code
  /// shrinks to fit rather than breaking a command in two.
  final bool oneLine;

  Widget _text({required bool softWrap}) => Text.rich(
    TextSpan(
      children: [
        for (final (i, line) in lines.indexed) ...[
          if (i > 0) const TextSpan(text: '\n'),
          for (final (text, tone) in line.runs)
            TextSpan(
              text: text,
              style: TextStyle(color: tone.color),
            ),
        ],
      ],
    ),
    softWrap: softWrap,
    style: const TextStyle(fontFamily: mono, fontSize: 16.5, height: 1.55),
  );

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: Gap.x6, vertical: Gap.x4),
    decoration: BoxDecoration(
      color: const Color(0xF2071E1B),
      borderRadius: tokenRadius(context, UiTokens.radius5),
      border: Border.all(color: const Color(0x24FFFFFF)),
      boxShadow: const [
        BoxShadow(
          color: Color(0x33000000),
          blurRadius: 16,
          offset: Offset(4, 7),
        ),
      ],
    ),
    child: oneLine
        ? FittedBox(
            fit: BoxFit.scaleDown,
            alignment: Alignment.centerLeft,
            child: _text(softWrap: false),
          )
        : _text(softWrap: true),
  );
}
