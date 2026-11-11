// The eight cards of the opening slide: real Fortal components exactly as
// Fortal draws them, each a small moment from one product (Beira-mar 2.4, a
// release run by Bea Lima, Caio Rocha and Lia Mendes), each a different kind
// of thing. No component here is restyled: only Fortal's own sizes and
// variants are chosen.
//
// Every card is as tall as its content. The hero stacks them in columns
// ([wideColumns], [narrowColumns]) and hands the shader the boxes they end up
// in, so nothing here gives a card a height. The spec is in SHOWCASE-PLAN.md,
// "The hero's eight cards, redesigned".
import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';
import 'package:mix_chart/mix_chart.dart';
import 'package:remix/remix.dart';

import 'kit.dart';
import 'theme.dart';
import 'ui/ui.dart';

/// One column of the collage: where it starts on the canvas, how wide its
/// cards are, and which cards it stacks, top to bottom, by their index in
/// [heroTiles]. Cards in a column are [collageGap] apart.
typedef CollageColumn = ({
  double left,
  double top,
  double width,
  List<int> cards,
});

const collageGap = Gap.x6;

/// The wide collage: four columns on the grid, each 16 lower than the one to
/// its left. The heavier cards sit in the top row, the quieter ones under
/// them, and the columns are filled so they come out about the same height.
final wideColumns = <CollageColumn>[
  (left: columnLeft(0), top: 384, width: columnWidth, cards: [0, 3]),
  (left: columnLeft(1), top: 400, width: columnWidth, cards: [2, 1]),
  (left: columnLeft(2), top: 416, width: columnWidth, cards: [6, 5]),
  (left: columnLeft(3), top: 432, width: columnWidth, cards: [7, 4]),
];

/// The narrow collage, on the 480-wide narrow canvas: one column of all
/// eight, in the order the wide one reads, row by row.
const narrowColumns = <CollageColumn>[
  (left: Gap.x4, top: 400, width: 448, cards: [0, 2, 6, 7, 3, 1, 5, 4]),
];

/// The boxes the cards take at 100% scaling and the medium radius, measured
/// by the hero's layout test. The shader starts from these and is handed the
/// boxes the cards really take after every layout, so they are only a first
/// guess; the test fails if they go stale.
const measuredWideCards = [
  Rect.fromLTWH(115, 384, columnWidth, 186),
  Rect.fromLTWH(423.5, 700, columnWidth, 152),
  Rect.fromLTWH(423.5, 400, columnWidth, 276),
  Rect.fromLTWH(115, 594, columnWidth, 220),
  Rect.fromLTWH(1040.5, 690, columnWidth, 160),
  Rect.fromLTWH(732, 686, columnWidth, 144),
  Rect.fromLTWH(732, 416, columnWidth, 246),
  Rect.fromLTWH(1040.5, 432, columnWidth, 234),
];
const measuredNarrowCards = [
  Rect.fromLTWH(16, 400, 448, 186),
  Rect.fromLTWH(16, 1682, 448, 152),
  Rect.fromLTWH(16, 610, 448, 276),
  Rect.fromLTWH(16, 1438, 448, 220),
  Rect.fromLTWH(16, 2026, 448, 160),
  Rect.fromLTWH(16, 1858, 448, 144),
  Rect.fromLTWH(16, 910, 448, 246),
  Rect.fromLTWH(16, 1180, 448, 234),
];

/// The eight cards, in the order the shader takes their boxes. The Themes
/// slide shows cards 0 and 7 in its previews.
List<Widget> heroTiles() => [
  _release(),
  const _Invite(),
  _basics(),
  _members(),
  _releaseDate(),
  _theme(),
  _chart(),
  _alerts(),
];

// ── The shared story ─────────────────────────────────────────────────────────

/// The day the slide treats as today, so it looks the same every day.
final _today = DateTime(2026, 11, 10);

/// The release's ship date: picked on the Release date card, shown on the
/// release card.
final releaseDate = ValueNotifier(DateTime(2026, 11, 20));

const _months = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];
const _weekdays = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

String _shortDate(DateTime d) =>
    '${_weekdays[d.weekday - 1].substring(0, 3)}, ${_months[d.month - 1]} ${d.day}';

String _fullDate(DateTime d) => '${_months[d.month - 1]} ${d.day}, ${d.year}';

/// How far off a date is, in words: "In 10 days, on a Friday."
String _fromToday(DateTime d) {
  final days = DateTime.utc(
    d.year,
    d.month,
    d.day,
  ).difference(DateTime.utc(_today.year, _today.month, _today.day)).inDays;
  final weekday = _weekdays[d.weekday - 1];
  return switch (days) {
    0 => 'Today.',
    1 => 'Tomorrow, on a $weekday.',
    _ => 'In $days days, on a $weekday.',
  };
}

// ── The card ─────────────────────────────────────────────────────────────────

/// A hero card: Fortal's card at size 3, a header (the title, and something
/// that describes the whole card at its right), at most one muted line under
/// it, then the content 16 below. As tall as its content.
Widget _card(
  String title, {
  String? detail,
  Widget? trailing,
  required Widget child,
}) => UiCard(
  size: .size3,
  child: Column(
    crossAxisAlignment: .stretch,
    mainAxisSize: .min,
    children: [
      Row(
        spacing: Gap.x3,
        children: [
          Expanded(child: UiHeading(title, size: .size3)),
          ?trailing,
        ],
      ),
      if (detail != null) ...[const SizedBox(height: Gap.x1), Muted(detail)],
      const SizedBox(height: Gap.x4),
      child,
    ],
  ),
);

/// A figure with its unit beside it on one baseline.
Widget _figure(String value, String unit, {required UiTextSize size}) => Row(
  crossAxisAlignment: .baseline,
  textBaseline: TextBaseline.alphabetic,
  spacing: Gap.x2,
  children: [
    UiHeading(value, size: size),
    Muted(unit),
  ],
);

/// A settings row: its label at the left, its control at the right, as tall
/// as the control's touch box.
Widget _settingRow(String label, Widget control) => Row(
  spacing: Gap.x3,
  children: [
    Expanded(child: UiText(label, size: .size2)),
    control,
  ],
);

// ── 1. Release progress: how far along the release is ──────────────────────
Widget _release() => _card(
  'Beira-mar 2.4',
  trailing: const UiBadge(label: 'In progress'),
  child: Column(
    crossAxisAlignment: .stretch,
    children: [
      _figure('68%', '17 of 25 tasks', size: .size8),
      const SizedBox(height: Gap.x3),
      const UiProgress(
        value: 0.68,
        variant: .soft,
        semanticsLabel: 'Release progress',
      ),
      const SizedBox(height: Gap.x4),
      Row(
        children: [
          Semantics(
            label: 'Bea Lima, Caio Rocha and Lia Mendes',
            child: const ExcludeSemantics(
              child: Row(
                spacing: Gap.x1,
                children: [
                  UiAvatar(label: 'B', variant: .solid, size: .size1),
                  UiAvatar(label: 'C', size: .size1),
                  UiAvatar(label: 'L', size: .size1),
                ],
              ),
            ),
          ),
          const Spacer(),
          ValueListenableBuilder(
            valueListenable: releaseDate,
            builder: (context, date, _) => Muted('Ships ${_shortDate(date)}'),
          ),
        ],
      ),
    ],
  ),
);

// ── 2. Invite: one person, by email ─────────────────────────────────────────
class _Invite extends StatefulWidget {
  const _Invite();

  @override
  State<_Invite> createState() => _InviteState();
}

class _InviteState extends State<_Invite> {
  final _email = TextEditingController();
  var _sent = false;

  void _send() {
    if (_email.text.trim().isEmpty) return;
    setState(() => _sent = true);
    _email.clear();
  }

  @override
  void dispose() {
    _email.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => _card(
    'Invite',
    detail: _sent
        ? 'Invite sent. Add someone else?'
        : 'They join Beira-mar as editors.',
    child: Row(
      spacing: Gap.x2,
      children: [
        Expanded(
          child: UiTextField(
            controller: _email,
            hintText: 'name@team.dev',
            semanticLabel: 'Email',
            keyboardType: TextInputType.emailAddress,
            textInputAction: TextInputAction.send,
            onChanged: (_) {
              if (_sent) setState(() => _sent = false);
            },
            onSubmitted: (_) => _send(),
          ),
        ),
        UiButton(label: 'Invite', onPressed: _send),
      ],
    ),
  );
}

// ── 3. The basics, as publishing the release notes ──────────────────────────
Widget _basics() => _card(
  'Release notes',
  child: Column(
    crossAxisAlignment: .stretch,
    children: [
      const Row(
        spacing: Gap.x2,
        children: [
          UiBadge(label: '4 new', variant: .solid),
          UiBadge(label: '5 improved'),
          UiBadge(label: '3 fixed', variant: .outline),
        ],
      ),
      const SizedBox(height: Gap.x4),
      const UiText('Visible to', size: .size2, weight: .medium),
      // Fortal's radio gives its label no size, so it takes the text around
      // it; that is set to Fortal's small body size, as the switch row's.
      Builder(
        builder: (context) => DefaultTextStyle.merge(
          style: MixScope.tokenOf(UiTokens.text2, context),
          child: Live<String>(
            initial: 'team',
            builder: (value, set) => RemixRadioGroup<String>(
              groupValue: value,
              onChanged: (next) => set(next ?? value),
              child: const Row(
                spacing: Gap.x4,
                children: [
                  UiRadio<String>(value: 'team', label: 'Team'),
                  UiRadio<String>(value: 'all', label: 'Everyone'),
                ],
              ),
            ),
          ),
        ),
      ),
      Live<bool>(
        initial: true,
        builder: (value, set) => _settingRow(
          'Email subscribers',
          UiSwitch(
            selected: value,
            semanticLabel: 'Email subscribers',
            onChanged: set,
          ),
        ),
      ),
      const SizedBox(height: Gap.x3),
      Row(
        mainAxisAlignment: .end,
        spacing: Gap.x2,
        children: [
          UiButton(label: 'Share', variant: .outline, onPressed: () {}),
          UiButton(label: 'Edit', variant: .soft, onPressed: () {}),
          UiButton(label: 'Publish', onPressed: () {}),
        ],
      ),
    ],
  ),
);

// ── 4. Members: who is on the project ───────────────────────────────────────
Widget _members() => _card(
  'Members',
  trailing: const Muted('3 people'),
  child: Column(
    crossAxisAlignment: .stretch,
    spacing: Gap.x3,
    children: [
      for (final (initial, name, email, role) in const [
        ('B', 'Bea Lima', 'bea@beiramar.dev', 'Owner'),
        ('C', 'Caio Rocha', 'caio@beiramar.dev', 'Editor'),
        ('L', 'Lia Mendes', 'lia@beiramar.dev', 'Viewer'),
      ])
        Row(
          spacing: Gap.x3,
          children: [
            UiAvatar(
              label: initial,
              variant: initial == 'B' ? .solid : .soft,
              size: .size2,
            ),
            Expanded(
              child: Column(
                crossAxisAlignment: .start,
                children: [
                  UiText(name, size: .size2, weight: .medium),
                  Muted(email, small: true),
                ],
              ),
            ),
            Muted(role),
          ],
        ),
    ],
  ),
);

// ── 5. Release date: a date picker, which opens Fortal's calendar ───────────
Widget _releaseDate() => ValueListenableBuilder(
  valueListenable: releaseDate,
  builder: (context, date, _) => _card(
    'Release date',
    child: Column(
      crossAxisAlignment: .start,
      children: [
        UiDatePicker(
          value: date,
          firstDate: _today,
          lastDate: DateTime(2027, 12, 31),
          currentDate: _today,
          semanticLabel: 'Release date',
          formatDate: _fullDate,
          onChanged: (picked) => releaseDate.value = picked,
        ),
        const SizedBox(height: Gap.x2),
        Muted(_fromToday(date)),
      ],
    ),
  ),
);

// ── 6. Theme: the seven to pick from; picking one retints the site ──────────
Widget _theme() => ValueListenableBuilder(
  valueListenable: siteAccent,
  builder: (context, accent, _) => _card(
    'Theme',
    trailing: UiBadge(label: accentNames[accent]),
    detail: 'Pick a colour to retint the site.',
    child: Semantics(
      label: 'Theme',
      explicitChildNodes: true,
      child: Row(
        children: [
          for (final choice in accentNames.keys) _ThemeDot(accent: choice),
        ],
      ),
    ),
  ),
);

/// One theme as a dot of its colour in a 32 target, so the dots sit 8 apart;
/// the current one wears a ring. It takes a tap, a click, or Enter or Space
/// when focused.
class _ThemeDot extends StatefulWidget {
  const _ThemeDot({required this.accent});

  final UiAccentColor accent;

  @override
  State<_ThemeDot> createState() => _ThemeDotState();
}

class _ThemeDotState extends State<_ThemeDot> {
  var _focused = false;

  void _pick() => siteAccent.value = widget.accent;

  @override
  Widget build(BuildContext context) {
    final color = themeTokens(widget.accent)[UiTokens.accent9]! as Color;
    final on = widget.accent == siteAccent.value;
    final ring = _focused
        ? tokenColor(context, UiTokens.focus8)
        : on
        ? color
        : const Color(0x00000000);
    return Semantics(
      button: true,
      selected: on,
      inMutuallyExclusiveGroup: true,
      label: '${accentNames[widget.accent]} theme',
      child: FocusableActionDetector(
        mouseCursor: SystemMouseCursors.click,
        onShowFocusHighlight: (value) => setState(() => _focused = value),
        // Space and Enter, as the web and other platforms send them.
        actions: {
          ActivateIntent: CallbackAction<ActivateIntent>(
            onInvoke: (_) => _pick(),
          ),
          ButtonActivateIntent: CallbackAction<ButtonActivateIntent>(
            onInvoke: (_) => _pick(),
          ),
        },
        child: GestureDetector(
          onTap: _pick,
          child: SizedBox.square(
            dimension: 32,
            child: DecoratedBox(
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(color: ring, width: 2),
              ),
              // The ring's 2 and a gap of 2, so the dot is 24.
              child: Padding(
                padding: const EdgeInsets.all(Gap.x1),
                child: DecoratedBox(
                  decoration: BoxDecoration(
                    color: color,
                    shape: BoxShape.circle,
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

// ── 7. This week: activity as a small bar chart ─────────────────────────────
Widget _chart() => _card(
  'This week',
  trailing: const Muted('Nov 9 to 15'),
  child: Column(
    crossAxisAlignment: .stretch,
    children: [
      _figure('128', 'updates', size: .size6),
      const SizedBox(height: Gap.x4),
      SizedBox(
        height: 112,
        child: UiBarChart(
          semanticsLabel: 'Updates each day this week',
          // Round bounds, so the axis reads 0, 20, 40 rather than the
          // tallest bar's own value; the steps are the grid's.
          yAxis: ChartAxis.numeric(
            min: 0,
            max: 40,
            labelFormatter: (value) => '${value.round()}',
          ),
          groups: [
            for (final (day, count) in const [
              ('M', 14.0),
              ('T', 22.0),
              ('W', 18.0),
              ('T', 31.0),
              ('F', 26.0),
              ('S', 9.0),
              ('S', 8.0),
            ].indexed.map((e) => ('${e.$2.$1}${e.$1}', e.$2.$2)))
              BarGroup(
                id: day,
                label: day[0],
                bars: [BarValue(id: 'updates', label: 'Updates', toY: count)],
              ),
          ],
        ),
      ),
    ],
  ),
);

// ── 8. Alerts: three notification settings ──────────────────────────────────
Widget _alerts() => _card(
  'Alerts',
  detail: 'Email me about Beira-mar.',
  child: Column(
    crossAxisAlignment: .stretch,
    children: [
      for (final (i, label, on) in const [
        (0, 'Comments', true),
        (1, 'Mentions', true),
        (2, 'Weekly digest', false),
      ]) ...[
        if (i > 0) const UiDivider(),
        Live<bool>(
          initial: on,
          builder: (value, set) => _settingRow(
            label,
            UiSwitch(selected: value, semanticLabel: label, onChanged: set),
          ),
        ),
      ],
    ],
  ),
);
