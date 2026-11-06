import 'package:flutter/material.dart' show Icons;
import 'package:flutter/widgets.dart';
import 'package:naked_ui/naked_ui.dart';
import 'package:remix/remix.dart';

import 'app.dart';
import 'cards.dart';
import 'showcase.dart';
import 'styles.dart';
import 'tokens.dart';

class _Page extends StatelessWidget {
  const _Page({required this.title, required this.subtitle, this.action, required this.children});

  final String title;
  final String subtitle;
  final Widget? action;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    final shout = ShowcaseScope.of(context).activeLook.shout;
    final heading = shout ? text($display).uppercase() : text($display);
    return SingleChildScrollView(
      child: Box(
        style: pageStyle,
        child: Column(
          crossAxisAlignment: .stretch,
          spacing: 18,
          children: [
            Row(
              crossAxisAlignment: .start,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: .start,
                    spacing: 6,
                    children: [
                      StyledText(title, style: heading),
                      StyledText(subtitle, style: text($body, $muted)),
                    ],
                  ),
                ),
                ?action,
              ],
            ),
            ...children,
          ],
        ),
      ),
    );
  }
}

class TasksScreen extends StatefulWidget {
  const TasksScreen({super.key});

  @override
  State<TasksScreen> createState() => _TasksScreenState();
}

class _TasksScreenState extends State<TasksScreen> {
  final _draft = TextEditingController();
  String? _error;

  void _add(Showcase showcase) {
    final error = showcase.addTask(_draft.text);
    setState(() => _error = error);
    if (error == null) _draft.clear();
  }

  @override
  void dispose() {
    _draft.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final showcase = ShowcaseScope.of(context);
    final total = showcase.tasks.length;
    final done = showcase.doneCount;
    final visible = showcase.visibleTasks;
    return _Page(
      title: 'Launch checklist',
      subtitle: '$done of $total done',
      action: Xray(
        'RemixButton',
        child: RemixButton(label: 'Reset', onPressed: showcase.reset, style: quietButton),
      ),
      children: [
        Xray(
          'RemixProgress',
          child: RemixProgress(
            value: total == 0 ? 0 : done / total,
            semanticsLabel: 'Checklist progress',
            style: progress,
          ),
        ),
        Row(
          crossAxisAlignment: .start,
          spacing: 10,
          children: [
            Expanded(
              child: Xray(
                'RemixTextField',
                child: RemixTextField(
                  controller: _draft,
                  hintText: 'Add a task',
                  helperText: _error,
                  error: _error != null,
                  onSubmitted: (_) => _add(showcase),
                  style: field,
                ),
              ),
            ),
            Xray(
              'RemixButton',
              child: RemixButton(label: 'Add', onPressed: () => _add(showcase), style: primaryButton),
            ),
          ],
        ),
        Align(
          alignment: .centerLeft,
          child: Xray(
            'RemixSegmentedControl',
            child: RemixSegmentedControl<TaskFilter>(
              semanticLabel: 'Filter tasks',
              selectedValue: showcase.filter,
              onChanged: showcase.setFilter,
              style: segments,
              items: const [
                RemixSegmentedControlItem(value: TaskFilter.all, label: 'All'),
                RemixSegmentedControlItem(value: TaskFilter.active, label: 'Active'),
                RemixSegmentedControlItem(value: TaskFilter.done, label: 'Done'),
              ],
            ),
          ),
        ),
        Box(
          style: cardStyle,
          child: visible.isEmpty
              ? Padding(
                  padding: const EdgeInsets.all(24),
                  child: StyledText('Nothing here yet.', style: text($body, $muted)),
                )
              : Column(
                  children: [
                    for (final task in visible)
                      _TaskRow(task: task, named: task == visible.first, key: ObjectKey(task)),
                  ],
                ),
        ),
      ],
    );
  }
}

class _TaskRow extends StatelessWidget {
  const _TaskRow({super.key, required this.task, required this.named});

  final Task task;
  final bool named;

  @override
  Widget build(BuildContext context) {
    final showcase = ShowcaseScope.of(context);
    final compact = MediaQuery.widthOf(context) < 520;
    return PressableBox(
      onPress: () => showcase.toggle(task),
      style: taskRow,
      child: Row(
        spacing: 12,
        children: [
          Xray(
            'RemixCheckbox',
            named: named,
            child: RemixCheckbox(
              selected: task.done,
              semanticLabel: task.title,
              minimumTapTargetSize: Size.zero,
              onChanged: (_) => showcase.toggle(task),
              style: checkbox,
            ),
          ),
          Expanded(
            child: AnimatedOpacity(
              duration: const Duration(milliseconds: 260),
              opacity: task.done ? 0.55 : 1,
              child: StyledText(
                task.title,
                style: oneLine(
                  task.done
                      ? text($body).decoration(.lineThrough).decorationColor($muted())
                      : text($body),
                ),
              ),
            ),
          ),
          if (!compact) Xray('RemixBadge', named: named, child: RemixBadge(label: task.tag, style: badge)),
          Xray('RemixAvatar', named: named, below: true, child: RemixAvatar(label: task.owner, style: avatar)),
        ],
      ),
    );
  }
}

class TeamScreen extends StatefulWidget {
  const TeamScreen({super.key});

  @override
  State<TeamScreen> createState() => _TeamScreenState();
}

class _TeamScreenState extends State<TeamScreen> {
  final _email = TextEditingController();
  String? _error;

  void _invite(Showcase showcase) {
    final error = showcase.invite(_email.text);
    setState(() => _error = error);
    if (error == null) _email.clear();
  }

  @override
  void dispose() {
    _email.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final showcase = ShowcaseScope.of(context);
    return _Page(
      title: 'Team',
      subtitle: '${showcase.team.length} people in ${showcase.workspace}',
      action: Xray(
        'RemixButton',
        child: RemixButton(label: 'Reset', onPressed: showcase.reset, style: quietButton),
      ),
      children: [
        Row(
          crossAxisAlignment: .start,
          spacing: 10,
          children: [
            Expanded(
              child: Xray(
                'RemixTextField',
                child: RemixTextField(
                  controller: _email,
                  hintText: 'teammate@company.test',
                  helperText: _error ?? 'Adds to this demo only. No email is sent.',
                  error: _error != null,
                  onSubmitted: (_) => _invite(showcase),
                  style: field,
                ),
              ),
            ),
            Xray(
              'RemixButton',
              child: RemixButton(label: 'Invite', onPressed: () => _invite(showcase), style: primaryButton),
            ),
          ],
        ),
        Box(
          style: cardStyle,
          child: Column(
            children: [
              for (final member in showcase.team) _MemberRow(member: member, key: ObjectKey(member)),
            ],
          ),
        ),
      ],
    );
  }
}

class _MemberRow extends StatelessWidget {
  const _MemberRow({super.key, required this.member});

  final Member member;

  @override
  Widget build(BuildContext context) {
    final showcase = ShowcaseScope.of(context);
    final compact = MediaQuery.widthOf(context) < 420;
    return Box(
      style: taskRow,
      child: Row(
        spacing: compact ? 8 : 12,
        children: [
          if (!compact) Xray('RemixAvatar', child: RemixAvatar(label: member.initials, style: avatar)),
          Expanded(
            child: Column(
              crossAxisAlignment: .start,
              spacing: 1,
              children: [
                StyledText(member.name, style: oneLine(text($title))),
                StyledText(member.email, style: oneLine(text($small, $muted))),
              ],
            ),
          ),
          Xray(
            'RemixSelect',
            child: SizedBox(
              width: compact ? 88 : 96,
              child: RemixSelect<Role>(
                trigger: const RemixSelectTrigger(placeholder: 'Role'),
                selectedValue: member.role,
                semanticLabel: 'Role for ${member.name}',
                onChanged: (role) {
                  if (role != null) showcase.setRole(member, role);
                },
                style: selectStyle,
                items: const [
                  RemixSelectItem(value: Role.owner, label: 'Owner'),
                  RemixSelectItem(value: Role.editor, label: 'Editor'),
                  RemixSelectItem(value: Role.viewer, label: 'Viewer'),
                ],
              ),
            ),
          ),
          PressableBox(
            onPress: () => showcase.removeMember(member),
            semanticsLabel: 'Remove ${member.name}',
            style: navStyle(active: false).padding(.all(6)),
            child: StyledIcon(icon: Icons.close, style: IconStyler().size(15).color($muted())),
          ),
        ],
      ),
    );
  }
}

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  static const _accents = [
    Color(0xFF8B5CF6),
    Color(0xFF2BB673),
    Color(0xFFE5484D),
    Color(0xFF2540FF),
    Color(0xFFF59E0B),
  ];

  late final _name = TextEditingController(text: ShowcaseScope.of(context).workspace);

  @override
  void dispose() {
    _name.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final showcase = ShowcaseScope.of(context);
    final invalid = showcase.workspace.trim().isEmpty;
    final corner = showcase.corner ?? showcase.look.control;
    return _Page(
      title: 'Settings',
      subtitle: showcase.saved ? 'Saved in this page.' : 'Changes apply as you make them.',
      action: Xray(
        'RemixButton',
        child: RemixButton(
          label: 'Save',
          enabled: !invalid,
          onPressed: invalid ? null : showcase.save,
          style: primaryButton,
        ),
      ),
      children: [
        Xray(
          'RemixTextField',
          child: RemixTextField(
            controller: _name,
            label: 'Workspace name',
            helperText: invalid ? 'A workspace needs a name.' : null,
            error: invalid,
            onChanged: showcase.setWorkspace,
            style: field,
          ),
        ),
        Box(
          style: cardStyle.padding(.all(16)),
          child: Column(
            crossAxisAlignment: .stretch,
            spacing: 14,
            children: [
              _SwitchRow(label: 'Weekly summary', value: showcase.weekly, onChanged: showcase.setWeekly),
              _SwitchRow(label: 'Mentions', value: showcase.mentions, onChanged: showcase.setMentions),
            ],
          ),
        ),
        Box(
          style: cardStyle.padding(.all(16)),
          child: Column(
            crossAxisAlignment: .stretch,
            spacing: 12,
            children: [
              StyledText('Accent', style: text($title)),
              Row(
                spacing: 8,
                children: [
                  for (final color in _accents)
                    PressableBox(
                      onPress: () => showcase.setAccent(color),
                      semanticsLabel: 'Use accent color',
                      style: BoxStyler()
                          .size(28, 28)
                          .color(color)
                          .decoration(shape(showcase.accent == color ? $focusShape : $solidShape))
                          .onHovered(.scale(1.12))
                          .animate(motion),
                      child: const SizedBox.shrink(),
                    ),
                ],
              ),
              StyledText('Corners: ${corner.round()}px', style: text($title)),
              Xray(
                'RemixSlider',
                child: RemixSlider(
                  value: corner.clamp(0, 24),
                  max: 24,
                  semanticLabel: 'Corner radius',
                  onChanged: showcase.setCorner,
                  style: slider,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _SwitchRow extends StatelessWidget {
  const _SwitchRow({required this.label, required this.value, required this.onChanged});

  final String label;
  final bool value;
  final ValueChanged<bool> onChanged;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(child: StyledText(label, style: text($body))),
        Xray(
          'RemixSwitch',
          child: RemixSwitch(selected: value, semanticLabel: label, onChanged: onChanged, style: switchStyle),
        ),
      ],
    );
  }
}

/// The same task data, rendered with Naked UI's unstyled widgets. Hover, focus,
/// press and keyboard behavior below are real, read straight from each widget.
class NakedTasks extends StatelessWidget {
  const NakedTasks({super.key});

  @override
  Widget build(BuildContext context) {
    final showcase = ShowcaseScope.of(context);
    return _Page(
      title: 'Launch checklist',
      subtitle: 'No styles. Tab, Space and hover still work.',
      children: [
        Column(
          crossAxisAlignment: .stretch,
          children: [
            for (final task in showcase.tasks)
              NakedCheckbox(
                value: task.done,
                semanticLabel: task.title,
                onChanged: (_) => showcase.toggle(task),
                builder: (context, state, child) => _NakedRow(
                  mark: task.done ? '[x]' : '[ ]',
                  title: task.title,
                  hovered: state.isHovered,
                  focused: state.isFocused,
                  pressed: state.isPressed,
                ),
              ),
          ],
        ),
      ],
    );
  }
}

class _NakedRow extends StatelessWidget {
  const _NakedRow({
    required this.mark,
    required this.title,
    required this.hovered,
    required this.focused,
    required this.pressed,
  });

  final String mark;
  final String title;
  final bool hovered;
  final bool focused;
  final bool pressed;

  @override
  Widget build(BuildContext context) {
    final compact = MediaQuery.widthOf(context) < 520;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 11),
      decoration: BoxDecoration(
        border: Border(
          bottom: const BorderSide(color: Color(0xFF26262E)),
          left: BorderSide(color: focused ? const Color(0xFFFFFFFF) : const Color(0x00000000), width: 2),
        ),
      ),
      child: Row(
        spacing: 10,
        children: [
          StyledText(mark, style: text($body)),
          Expanded(child: StyledText(title, style: oneLine(text($body)))),
          if (!compact) ...[
            NakedFlag('hover', on: hovered),
            NakedFlag('focus', on: focused),
            NakedFlag('press', on: pressed),
          ],
        ],
      ),
    );
  }
}
