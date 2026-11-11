// The two components slides: real Fortal components on the sand, in working
// order. Each card shows one family, with room around it; every control
// answers when used.
import 'package:flutter/widgets.dart';
import 'package:remix/remix.dart';
import 'package:remix_ui_icons/remix_ui_icons.dart';

import '../backdrops.dart';
import '../kit.dart';
import '../ui/ui.dart';

/// The controls people use most.
class ControlsSlide extends StatelessWidget {
  const ControlsSlide({
    super.key,
    required this.onNext,
    this.active = true,
    this.compact = false,
  });

  final VoidCallback onNext;
  final bool active;
  final bool compact;

  @override
  Widget build(BuildContext context) => _Gallery(
    title: 'Real components, in real moments.',
    detail: 'Each card is a piece of a product, built only from Fortal components. Try them.',
    next: 'More components',
    onNext: onNext,
    scene: 2,
    active: active,
    compact: compact,
    columns: [
      [_invite(), _release()],
      [_notifications(), _sharing()],
      [_limits(), _workspace()],
    ],
  );
}

/// Dates, data and the smaller pieces.
class DetailsSlide extends StatelessWidget {
  const DetailsSlide({
    super.key,
    required this.onNext,
    this.active = true,
    this.compact = false,
  });

  final VoidCallback onNext;
  final bool active;
  final bool compact;

  @override
  Widget build(BuildContext context) => _Gallery(
    title: 'Dates, data and the small details.',
    detail:
        'Forty-one Fortal components are installed here. These are a few more.',
    next: 'See the themes',
    onNext: onNext,
    scene: 2,
    active: active,
    compact: compact,
    columns: [
      [_schedule(), _details()],
      [_activity(), _sprint()],
      [_questions(), _shortcuts()],
    ],
  );
}

class _Gallery extends StatelessWidget {
  const _Gallery({
    required this.title,
    required this.detail,
    required this.next,
    required this.onNext,
    required this.scene,
    required this.active,
    required this.columns,
    required this.compact,
  });

  final bool compact;

  final String title;
  final String detail;
  final String next;
  final VoidCallback onNext;
  final List<List<_Moment>> columns;
  final double scene;
  final bool active;

  @override
  Widget build(BuildContext context) => compact ? _narrow() : _wide(context);

  Widget _narrow() => NarrowSection(
    backdrop: SandBackdrop(scene: scene, active: active),
    children: [
      SlideHeading(
        label: 'Components',
        title: title,
        detail: detail,
        compact: true,
      ),
      for (final column in columns) ...column,
    ],
  );

  Widget _wide(BuildContext context) => SlideFrame(
    backdrop: SandBackdrop(scene: scene, active: active),
    child: Stack(
      children: [
        Positioned(
          left: gutter,
          top: _headingTop,
          width: 860,
          child: SlideHeading(
            label: 'Components',
            title: title,
            detail: detail,
          ),
        ),
        // The button at the right, level with the detail line.
        Positioned(
          right: gutter,
          top: _headingTop + 84,
          child: UiButton(
            label: next,
            variant: .soft,
            size: .size3,
            trailingIcon: RemixIcons.arrowRight,
            onPressed: onNext,
          ),
        ),
        // Three columns with their tops aligned. The last card of each
        // column takes the height that is left, so every column ends on one
        // line: 48 above the bottom, or 12 at Fortal's 110% scale, which
        // these two slides only just hold.
        Positioned(
          left: gutter,
          right: gutter,
          top: _cardsTop,
          bottom: UiTheme.of(context).scaling == UiScaling.percent110
              ? Gap.x3
              : Gap.x12,
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            spacing: Gap.x6,
            children: [
              for (final column in columns)
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    spacing: Gap.x6,
                    children: [
                      ...column.take(column.length - 1),
                      Expanded(child: column.last.filled()),
                    ],
                  ),
                ),
            ],
          ),
        ),
      ],
    ),
  );
}

// These two slides hold the most cards, so their heading starts higher than
// the other slides' and the cards follow it 48 below its detail line.
const _headingTop = 84.0;
const _cardsTop = _headingTop + 114 + Gap.x12;

/// One small product moment, on the shared card: a title, a line about it,
/// the components at work, and the names of the components it uses.
class _Moment extends StatelessWidget {
  const _Moment({
    required this.title,
    required this.detail,
    required this.uses,
    this.fill = false,
    required this.child,
  });

  final String title;
  final String detail;
  final String uses;
  final bool fill;
  final Widget child;

  /// The same card, taking the height it is given.
  _Moment filled() => _Moment(
    title: title,
    detail: detail,
    uses: uses,
    fill: true,
    child: child,
  );

  @override
  Widget build(BuildContext context) => ShowCard(
    title: title,
    detail: detail,
    uses: uses,
    fill: fill,
    child: child,
  );
}

Widget _label(String text) => UiText(text, size: .size2, weight: .medium);

Widget _muted(String text) => Muted(text);

Widget _field(String label, Widget control) => Column(
  crossAxisAlignment: CrossAxisAlignment.stretch,
  spacing: Gap.x2,
  children: [_label(label), control],
);

Widget _actions(List<Widget> buttons) => Row(
  mainAxisAlignment: MainAxisAlignment.end,
  spacing: Gap.x2,
  children: buttons,
);

// ── Controls ─────────────────────────────────────────────────────────────────
_Moment _invite() => _Moment(
  title: 'Invite your team',
  detail: 'Add someone and choose what they can do.',
  uses: 'Text field · Select · Button',
  child: Column(
    crossAxisAlignment: CrossAxisAlignment.stretch,
    spacing: Gap.x3,
    children: [
      _field('Email', const UiTextField(hintText: 'name@team.dev')),
      _field(
        'Role',
        Live<String>(
          initial: 'edit',
          builder: (value, set) => UiSelect<String>(
            selectedValue: value,
            trigger: const RemixSelectTrigger(placeholder: 'Choose a role'),
            items: const [
              RemixSelectItem(value: 'view', label: 'Can view'),
              RemixSelectItem(value: 'edit', label: 'Can edit'),
              RemixSelectItem(value: 'manage', label: 'Can manage'),
            ],
            onChanged: (next) => set(next ?? value),
          ),
        ),
      ),
      _actions([
        UiButton(label: 'Cancel', variant: .soft, onPressed: () {}),
        UiButton(label: 'Send invite', onPressed: () {}),
      ]),
    ],
  ),
);

_Moment _release() => _Moment(
  title: 'Beira-mar 2.4',
  detail: 'Ships on Friday. Two tasks are left.',
  uses: 'Badge · Progress · Avatar',
  child: Column(
    crossAxisAlignment: CrossAxisAlignment.stretch,
    spacing: Gap.x3,
    children: [
      const Row(
        spacing: Gap.x2,
        children: [
          UiBadge(label: 'In progress', size: .size2),
          UiBadge(label: 'On track', variant: .outline, size: .size2),
        ],
      ),
      const UiProgress(value: 0.68, size: .size3),
      Row(
        spacing: Gap.x1,
        children: [
          const UiAvatar(label: 'B', variant: .solid, size: .size2),
          const UiAvatar(label: 'C', size: .size2),
          const UiAvatar(label: 'L', size: .size2),
          const Spacer(),
          _muted('68% done'),
        ],
      ),
    ],
  ),
);

_Moment _notifications() => _Moment(
  title: 'Notifications',
  detail: 'Choose what reaches your inbox.',
  uses: 'Switch · Divider · Button',
  child: Column(
    crossAxisAlignment: CrossAxisAlignment.stretch,
    children: [
      for (final (i, label, on) in const [
        (0, 'Comments', true),
        (1, 'Mentions', true),
        (2, 'Weekly digest', false),
      ]) ...[
        if (i > 0) const UiDivider(),
        Row(
          children: [
            Expanded(child: _label(label)),
            Live<bool>(
              initial: on,
              builder: (value, set) => UiSwitch(
                selected: value,
                semanticLabel: label,
                onChanged: set,
              ),
            ),
          ],
        ),
      ],
      const SizedBox(height: Gap.x3),
      _actions([UiButton(label: 'Save preferences', onPressed: () {})]),
    ],
  ),
);

_Moment _sharing() => _Moment(
  title: 'Share project',
  detail: 'Decide who can open Beira-mar.',
  uses: 'Segmented control · Radio',
  child: Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    spacing: Gap.x2,
    children: [
      Live<String>(
        initial: 'team',
        builder: (value, set) => UiSegmentedControl<String>(
          items: const [
            RemixSegmentedControlItem(value: 'private', label: 'Private'),
            RemixSegmentedControlItem(value: 'team', label: 'Team'),
            RemixSegmentedControlItem(value: 'public', label: 'Public'),
          ],
          selectedValue: value,
          onChanged: set,
        ),
      ),
      Live<String>(
        initial: 'edit',
        builder: (value, set) => RemixRadioGroup<String>(
          groupValue: value,
          onChanged: (next) => set(next ?? value),
          child: const Row(
            spacing: Gap.x4,
            children: [
              UiRadio<String>(value: 'view', label: 'Can view'),
              UiRadio<String>(value: 'edit', label: 'Can edit'),
            ],
          ),
        ),
      ),
    ],
  ),
);

_Moment _limits() => _Moment(
  title: 'Upload limits',
  detail: 'Set the largest file and when to warn.',
  uses: 'Slider · Range slider · Toggle group',
  child: Live<double>(
    initial: 0.62,
    builder: (value, set) => Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      spacing: Gap.x3,
      children: [
        // Each setting on one row: its name, its slider, and what it is set
        // to, so the two tracks start and end on the same lines.
        _setting(
          'Largest file',
          UiSlider(value: value, semanticLabel: 'Largest file', onChanged: set),
          '${(value * 500).round()} MB',
        ),
        Live<List<double>>(
          initial: const [0.25, 0.7],
          builder: (range, setRange) => _setting(
            'Warn between',
            UiRangeSlider(values: range, onChanged: setRange),
            '${(range.first * 100).round()}–${(range.last * 100).round()}%',
          ),
        ),
        Align(
          alignment: Alignment.centerLeft,
          child: Live<String>(
            initial: 'week',
            builder: (period, setPeriod) => UiToggleGroup<String>(
              items: const [
                RemixToggleGroupItem(value: 'day', label: 'Day'),
                RemixToggleGroupItem(value: 'week', label: 'Week'),
                RemixToggleGroupItem(value: 'month', label: 'Month'),
              ],
              selectedValue: period,
              onChanged: (next) => setPeriod(next ?? period),
            ),
          ),
        ),
      ],
    ),
  ),
);

Widget _setting(String name, Widget slider, String value) => Row(
  spacing: Gap.x3,
  children: [
    SizedBox(width: 104, child: _label(name)),
    Expanded(child: slider),
    SizedBox(
      width: 64,
      child: Align(alignment: Alignment.centerRight, child: _muted(value)),
    ),
  ],
);

_Moment _workspace() => _Moment(
  title: 'Workspace',
  detail: 'Everything about the project in one place.',
  uses: 'Tabs · Icon button',
  child: Column(
    crossAxisAlignment: CrossAxisAlignment.stretch,
    spacing: Gap.x3,
    children: [
      Live<String>(
        initial: 'overview',
        builder: (tab, set) => RemixTabs(
          selectedTabId: tab,
          onChanged: set,
          child: const UiTabBar(
            child: Row(
              children: [
                UiTab(tabId: 'overview', child: Text('Overview')),
                UiTab(tabId: 'activity', child: Text('Activity')),
                UiTab(tabId: 'settings', child: Text('Settings')),
              ],
            ),
          ),
        ),
      ),
      Row(
        spacing: Gap.x2,
        children: [
          Expanded(child: _muted('3 members · updated today')),
          UiIconButton(
            icon: RemixIcons.search,
            semanticLabel: 'Search',
            variant: .soft,
            onPressed: () {},
          ),
          UiIconButton(
            icon: RemixIcons.plus,
            semanticLabel: 'Add',
            onPressed: () {},
          ),
        ],
      ),
    ],
  ),
);

// ── Dates, data and details ──────────────────────────────────────────────────
// The calendar opens on a fixed month, so the slide looks the same every day.
final _first = DateTime(2026, 1, 1);
final _last = DateTime(2027, 12, 31);
final _picked = DateTime(2026, 11, 18);
final _today = DateTime(2026, 11, 10);

_Moment _schedule() => _Moment(
  title: 'Schedule the launch',
  detail: 'The team is told as soon as you save.',
  uses: 'Date picker · Callout',
  child: Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    spacing: Gap.x3,
    children: [
      _field(
        'Launch day',
        Align(
          alignment: Alignment.centerLeft,
          child: Live<DateTime?>(
            initial: _picked,
            builder: (value, set) => UiDatePicker(
              value: value,
              firstDate: _first,
              lastDate: _last,
              currentDate: _today,
              onChanged: set,
            ),
          ),
        ),
      ),
      const UiCallout(
        icon: RemixIcons.bell,
        text: 'Your changes are saved as you go.',
      ),
    ],
  ),
);

_Moment _details() => const _Moment(
  title: 'Project details',
  detail: 'The facts people ask about most.',
  uses: 'Data list',
  child: UiDataList(
    items: [
      RemixDataListItem(label: 'Project', value: 'Beira-mar'),
      RemixDataListItem(label: 'Owner', value: 'Bea Lima'),
      RemixDataListItem(label: 'Updated', value: 'Today'),
    ],
  ),
);

_Moment _shortcuts() => _Moment(
  title: 'Find anything',
  detail: 'Search works from every screen.',
  uses: 'Keyboard key · Code · Link',
  child: Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    spacing: Gap.x3,
    children: [
      const Wrap(
        spacing: Gap.x1,
        runSpacing: Gap.x2,
        crossAxisAlignment: WrapCrossAlignment.center,
        children: [
          UiText('Press', size: .size2),
          UiKbd('Ctrl'),
          UiKbd('K'),
          UiText('or type', size: .size2),
          UiCode('/find'),
        ],
      ),
      UiLink('See every shortcut', onPressed: () {}),
    ],
  ),
);

_Moment _activity() => _Moment(
  title: 'Activity',
  detail: 'What changed, and who changed it.',
  uses: 'Data table',
  child: UiDataTable<(String, String, String)>(
    size: .size1,
    rows: const [
      ('Bea Lima', 'Opened release 2.4', 'Today'),
      ('Caio Rocha', 'Closed 3 tasks', 'Yesterday'),
      ('Lia Mendes', 'Left a comment', 'Monday'),
    ],
    columns: [
      RemixDataTableColumn(
        id: 'who',
        label: 'Who',
        width: const FlexColumnWidth(1.1),
        cellBuilder: (context, row) => UiText(row.$1, size: .size2),
      ),
      RemixDataTableColumn(
        id: 'what',
        label: 'What',
        width: const FlexColumnWidth(1.9),
        cellBuilder: (context, row) => UiText(row.$2, size: .size2),
      ),
      RemixDataTableColumn(
        id: 'when',
        label: 'When',
        cellBuilder: (context, row) => UiText(row.$3, size: .size2),
      ),
    ],
  ),
);

_Moment _questions() => const _Moment(
  title: 'Questions',
  detail: 'Short answers to what people ask.',
  uses: 'Accordion',
  child: _Answers(),
);

/// The accordion, holding its one controller: at most one answer open.
class _Answers extends StatefulWidget {
  const _Answers();

  @override
  State<_Answers> createState() => _AnswersState();
}

class _AnswersState extends State<_Answers> {
  final _answers = RemixAccordionController<String>(min: 0, max: 1);

  @override
  void dispose() {
    _answers.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => RemixAccordionGroup<String>(
    controller: _answers,
    initialExpandedValues: const ['own'],
    child: const Column(
      spacing: Gap.x2,
      children: [
        UiAccordion<String>(
          value: 'own',
          title: 'Do I own the code?',
          child: UiText(
            'Yes. Components are copied into your app.',
            size: .size2,
          ),
        ),
        UiAccordion<String>(
          value: 'theme',
          title: 'Can I change the theme?',
          child: UiText(
            'Yes. Pick an accent, a radius and a scale.',
            size: .size2,
          ),
        ),
        UiAccordion<String>(
          value: 'dark',
          title: 'Is there a dark mode?',
          child: UiText('Yes, for every theme.', size: .size2),
        ),
      ],
    ),
  );
}

_Moment _sprint() => _Moment(
  title: 'Plan the sprint',
  detail: 'Pick the first and last day in one go.',
  uses: 'Date range picker',
  child: _field(
    'Sprint dates',
    Align(
      alignment: Alignment.centerLeft,
      child: Live<CivilDateRange?>(
        initial: CivilDateRange(
          start: DateTime(2026, 11, 9),
          end: DateTime(2026, 11, 20),
        ),
        builder: (value, set) => UiDateRangePicker(
          value: value,
          firstDate: _first,
          lastDate: _last,
          currentDate: _today,
          onChanged: set,
        ),
      ),
    ),
  ),
);
