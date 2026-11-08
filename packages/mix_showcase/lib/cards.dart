import 'dart:math' as math;

import 'package:flutter/material.dart' show Icons;
import 'package:flutter/widgets.dart';
import 'package:naked_ui/naked_ui.dart';
import 'package:remix/remix.dart';

import 'app.dart';
import 'fortal_today.dart';
import 'invite.dart';
import 'showcase.dart';
import 'styles.dart';
import 'tokens.dart';

/// Rings the block the tour is pointing at.
class Block extends StatelessWidget {
  const Block(
    this.id, {
    super.key,
    required this.child,
    this.nakedFocus = false,
  });

  final String id;
  final Widget child;

  /// Whether this block keeps keyboard focus in the Naked chapter.
  final bool nakedFocus;

  @override
  Widget build(BuildContext context) {
    final showcase = ShowcaseScope.of(context);
    return Stack(
      fit: .passthrough,
      children: [
        ExcludeFocus(
          excluding: showcase.naked && !nakedFocus,
          // Keep a card's controls together when adjacent cards overlap its rows.
          child: FocusTraversalGroup(child: child),
        ),
        Positioned.fill(
          child: IgnorePointer(
            child: AnimatedOpacity(
              duration: const Duration(milliseconds: 320),
              opacity: showcase.highlight == id ? 1 : 0,
              child: Box(style: BoxStyler().shape($cardRing.mix())),
            ),
          ),
        ),
      ],
    );
  }
}

/// A wall of small finished blocks, sized to the stage. It never scrolls, so a
/// card is dropped rather than cut off when there is not room for it.
class CardDeck extends StatelessWidget {
  const CardDeck({super.key});

  @override
  Widget build(BuildContext context) {
    final showcase = ShowcaseScope.of(context);
    return LayoutBuilder(
      builder: (context, constraints) {
        if (showcase.highlight case final selected?) {
          return _FocusedBlock(id: selected, height: constraints.maxHeight);
        }
        if (showcase.naked && constraints.maxHeight < 548) {
          return _FocusedBlock(id: 'today', height: constraints.maxHeight);
        }
        // #docregion responsive-deck
        if (constraints.maxWidth < 640) {
          return _CompactDeck(height: constraints.maxHeight);
        }
        // #enddocregion responsive-deck
        final height = math.min(constraints.maxHeight, 790.0);
        final room = height - 48;
        return Center(
          child: SizedBox(
            height: height,
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Row(
                crossAxisAlignment: .stretch,
                spacing: 14,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: .stretch,
                      spacing: 14,
                      children: [
                        const Expanded(
                          child: Block(
                            'player',
                            nakedFocus: true,
                            child: NowPlaying(fill: true),
                          ),
                        ),
                        if (room >= 500)
                          const Block(
                            'today',
                            nakedFocus: true,
                            child: Today(),
                          ),
                      ],
                    ),
                  ),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: .stretch,
                      spacing: 14,
                      children: [
                        if (room >= 600) ...const [
                          Block('spending', child: Spending(chartHeight: 112)),
                          Block('appearance', child: MakeItYours()),
                          Expanded(
                            child: Block(
                              'team',
                              nakedFocus: true,
                              child: Team(),
                            ),
                          ),
                        ] else ...[
                          const Expanded(
                            child: Block('spending', child: Spending()),
                          ),
                          if (room >= 390)
                            const Block('appearance', child: MakeItYours()),
                        ],
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}

/// Blocks remain reachable on a small stage: selection gives the actual card
/// room to breathe instead of pointing at a card the overview could not fit.
class _FocusedBlock extends StatelessWidget {
  const _FocusedBlock({required this.id, required this.height});

  final String id;
  final double height;

  @override
  Widget build(BuildContext context) {
    final reduceMotion = ShowcaseScope.of(context).reduceMotion;
    final Widget card = switch (id) {
      'today' => const Today(),
      'spending' => Spending(
        chartHeight: (height - (MediaQuery.widthOf(context) < 320 ? 208 : 172))
            .clamp(40, 144),
      ),
      'appearance' => const MakeItYours(),
      'team' => const Team(),
      _ => SizedBox(
        height: height >= 390 ? (height - 32).clamp(200, 540) : 216,
        child: NowPlaying(fill: height >= 390),
      ),
    };
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 460),
          child: SizedBox(
            width: double.infinity,
            child: AnimatedSwitcher(
              duration: reduceMotion
                  ? Duration.zero
                  : const Duration(milliseconds: 320),
              child: Block(
                id,
                key: ValueKey(id),
                nakedFocus: true,
                child: card,
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _CompactDeck extends StatelessWidget {
  const _CompactDeck({required this.height});

  final double height;

  // Tallest each block gets in any look, in priority order.
  static const _gap = 12.0;
  static const _blocks = <(double, Widget)>[
    (216, Block('player', nakedFocus: true, child: NowPlaying(fill: false))),
    (172, Block('today', nakedFocus: true, child: Today())),
    (158, Block('appearance', child: MakeItYours())),
    (84, Block('spending', child: Spending(compact: true))),
  ];

  @override
  Widget build(BuildContext context) {
    var room = height - 2 * _gap;
    final shown = <Widget>[];
    final blocks = ShowcaseScope.of(context).naked
        ? [_blocks[1], _blocks[0], ..._blocks.skip(2)]
        : _blocks;
    for (final (blockHeight, block) in blocks) {
      final cost = blockHeight + (shown.isEmpty ? 0 : _gap);
      if (cost > room) break;
      room -= cost;
      shown.add(block);
    }
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(_gap),
        child: Column(
          mainAxisSize: .min,
          crossAxisAlignment: .stretch,
          spacing: _gap,
          children: shown,
        ),
      ),
    );
  }
}

class NowPlaying extends StatelessWidget {
  const NowPlaying({super.key, required this.fill});

  final bool fill;

  @override
  Widget build(BuildContext context) => Box(
    style: cardPad,
    child: _Player(fill: fill),
  );
}

/// Generated cover art: a grid of styled boxes. It needs no imagery, and every
/// tile reads tokens, so the art repaints itself with the look.
class CoverArt extends StatelessWidget {
  const CoverArt({super.key, this.seed = 0, this.columns = 6});

  final int seed;
  final int columns;

  // Corner each tile rounds off: 0 none, 1 to 4 top-left clockwise, 5 all.
  static const _corners = [
    3,
    0,
    2,
    5,
    1,
    4,
    0,
    4,
    1,
    3,
    2,
    0,
    5,
    2,
    4,
    3,
    0,
    1,
    2,
    5,
    4,
    0,
    3,
    1,
  ];
  static const _inks = [$accent, $art, $ink, $accent, $line, $art, $accent];

  BorderRadiusMix _radius(int corner, double size) {
    final round = Radius.circular(size);
    return switch (corner) {
      1 => .topLeft(round),
      2 => .topRight(round),
      3 => .bottomRight(round),
      4 => .bottomLeft(round),
      5 => .circular(size / 2),
      _ => .circular(0),
    };
  }

  @override
  Widget build(BuildContext context) {
    final showcase = ShowcaseScope.of(context);
    final cut = showcase.activeLook.cut;
    return Box(
      style: BoxStyler()
          .color($raised())
          .shape($artShape.mix())
          .clipBehavior(.antiAlias)
          .animate(motion),
      // With styling off there is nothing to draw, only the space it holds.
      child: showcase.naked
          ? null
          : LayoutBuilder(
              builder: (context, constraints) {
                // Whole-pixel tiles leave no seams. The clip trims the last row and column.
                final size = (constraints.maxWidth / columns).ceilToDouble();
                final rows = (constraints.maxHeight / size).ceil();
                return ClipRect(
                  child: OverflowBox(
                    alignment: .topLeft,
                    maxWidth: double.infinity,
                    maxHeight: double.infinity,
                    child: Column(
                      mainAxisSize: .min,
                      children: [
                        for (var row = 0; row < rows; row++)
                          Row(
                            mainAxisSize: .min,
                            children: [
                              for (var column = 0; column < columns; column++)
                                _tile(
                                  row * columns + column + seed * 5,
                                  size,
                                  cut,
                                ),
                            ],
                          ),
                      ],
                    ),
                  ),
                );
              },
            ),
    );
  }

  Widget _tile(int index, double size, bool cut) {
    final radius = _radius(_corners[index % _corners.length], size);
    return Box(
      style: BoxStyler()
          .size(size, size)
          .color(_inks[(index * 5 + seed) % _inks.length]())
          .shape(
            cut
                ? .beveledRectangle(borderRadius: radius)
                : .roundedRectangle(borderRadius: radius),
          )
          .animate(motion),
    );
  }
}

class _Player extends StatelessWidget {
  const _Player({required this.fill});

  final bool fill;

  @override
  Widget build(BuildContext context) {
    final showcase = ShowcaseScope.of(context);
    final track = showcase.track;
    final titles = Column(
      crossAxisAlignment: .start,
      mainAxisSize: .min,
      spacing: 2,
      children: [
        StyledText(track.title, style: oneLine(text($lead))),
        StyledText(track.artist, style: oneLine(text($body, $muted))),
      ],
    );
    return Column(
      crossAxisAlignment: .stretch,
      spacing: 16,
      children: [
        if (fill) ...[
          Expanded(child: CoverArt(seed: showcase.current, columns: 7)),
          Row(
            children: [
              Expanded(child: titles),
              const Equalizer(),
            ],
          ),
        ] else
          Row(
            spacing: 12,
            children: [
              SizedBox.square(
                dimension: 60,
                child: CoverArt(seed: showcase.current, columns: 3),
              ),
              Expanded(child: titles),
              const Equalizer(),
            ],
          ),
        ExcludeFocus(excluding: showcase.naked, child: const _Timeline()),
        if (showcase.naked) const _NakedTransport() else const _Transport(),
      ],
    );
  }
}

class _Transport extends StatelessWidget {
  const _Transport();

  @override
  Widget build(BuildContext context) {
    final showcase = ShowcaseScope.of(context);
    return Row(
      mainAxisAlignment: .center,
      spacing: 10,
      children: [
        Xray(
          'RemixIconButton',
          named: false,
          child: RemixIconButton(
            icon: Icons.skip_previous_rounded,
            semanticLabel: 'Previous track',
            onPressed: () => showcase.skip(-1),
            style: transportButton,
          ),
        ),
        Xray(
          'RemixIconButton',
          below: true,
          child: RemixIconButton(
            icon: showcase.playing
                ? Icons.pause_rounded
                : Icons.play_arrow_rounded,
            semanticLabel: showcase.playing ? 'Pause' : 'Play',
            onPressed: () => showcase.setPlaying(!showcase.playing),
            style: playButton,
          ),
        ),
        Xray(
          'RemixIconButton',
          named: false,
          child: RemixIconButton(
            icon: Icons.skip_next_rounded,
            semanticLabel: 'Next track',
            onPressed: () => showcase.skip(1),
            style: transportButton,
          ),
        ),
      ],
    );
  }
}

class _Timeline extends StatelessWidget {
  const _Timeline();

  @override
  Widget build(BuildContext context) {
    final showcase = ShowcaseScope.of(context);
    return ValueListenableBuilder(
      valueListenable: showcase.position,
      builder: (context, position, _) => Row(
        spacing: 10,
        children: [
          StyledText(
            formatTime((position * showcase.track.seconds).round()),
            style: text($small, $muted),
          ),
          Expanded(
            child: Xray(
              'RemixSlider',
              below: true,
              child: RemixSlider(
                value: position,
                semanticLabel: 'Playback position',
                onChanged: showcase.seek,
                style: slider,
              ),
            ),
          ),
          StyledText(showcase.track.length, style: text($small, $muted)),
        ],
      ),
    );
  }
}

/// Five bars, each its own keyframe timeline. Paused, they hold a resting shape.
class Equalizer extends StatelessWidget {
  const Equalizer({super.key});

  static const _bars = [
    (16.0, 310, 9.0),
    (24.0, 240, 15.0),
    (12.0, 380, 7.0),
    (22.0, 270, 13.0),
    (15.0, 340, 10.0),
  ];

  @override
  Widget build(BuildContext context) {
    final showcase = ShowcaseScope.of(context);
    // Playback still works with reduced motion; only the bounce stops.
    final playing = showcase.playing && !showcase.reduceMotion;
    return SizedBox(
      height: 26,
      child: Row(
        mainAxisSize: .min,
        crossAxisAlignment: .end,
        spacing: 3,
        children: [
          for (final (index, (peak, beat, rest)) in _bars.indexed)
            Box(
              // A new key restarts the bar, because Mix keeps its driver otherwise.
              key: ValueKey((index, playing)),
              style: playing
                  ? equalizerBar(peak, Duration(milliseconds: beat))
                  : BoxStyler().width(3).height(rest).color($muted()),
            ),
        ],
      ),
    );
  }
}

/// A short simple list. In the Naked chapter its rows become bare checkboxes.
class Today extends StatelessWidget {
  const Today({super.key});

  @override
  Widget build(BuildContext context) {
    final showcase = ShowcaseScope.of(context);
    if (showcase.preset == 'fortal' && !showcase.naked) {
      return const FortalToday();
    }
    final tasks = showcase.today;
    final done = tasks.where((task) => task.done).length;
    return Box(
      // Rows carry their own 6px so their hover fill can extend past the text.
      style: cardStyle.padding(.horizontal(12)).padding(.vertical(18)),
      child: Column(
        mainAxisSize: .min,
        crossAxisAlignment: .stretch,
        spacing: 6,
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 6),
            child: CardHeader('Today', meta: '$done of ${tasks.length} done'),
          ),
          for (final task in tasks)
            if (showcase.naked)
              _NakedTask(task: task)
            else
              _TodayRow(task: task, last: task == tasks.last),
        ],
      ),
    );
  }
}

class _NakedTask extends StatefulWidget {
  const _NakedTask({required this.task});

  final Task task;

  @override
  State<_NakedTask> createState() => _NakedTaskState();
}

class _NakedTaskState extends State<_NakedTask> {
  final _focus = FocusNode();

  @override
  void dispose() {
    _focus.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final showcase = ShowcaseScope.of(context);
    final task = widget.task;
    // #docregion naked-row
    return NakedCheckbox(
      value: task.done,
      focusNode: _focus,
      semanticLabel: task.title,
      onChanged: (_) {
        _focus.requestFocus();
        showcase.toggle(task);
      },
      builder: (context, state, child) => _NakedRow(
        title: task.title,
        done: task.done,
        hovered: state.isHovered,
        focused: state.isFocused,
        pressed: state.isPressed,
      ),
    );
    // #enddocregion naked-row
  }
}

class _TodayRow extends StatelessWidget {
  const _TodayRow({required this.task, required this.last});

  final Task task;
  final bool last;

  @override
  Widget build(BuildContext context) {
    final showcase = ShowcaseScope.of(context);
    return listRow.pressable(
      // The checkbox is the row's one keyboard stop and its one semantic control.
      canRequestFocus: false,
      excludeFromSemantics: true,
      onPress: () => showcase.toggle(task),
      child: Row(
        spacing: 10,
        children: [
          Xray(
            'RemixCheckbox',
            named: last,
            below: true,
            // #docregion remix-checkbox
            child: RemixCheckbox(
              selected: task.done,
              semanticLabel: task.title,
              minimumTapTargetSize: Size.zero,
              onChanged: (_) => showcase.toggle(task),
              style: checkbox,
            ),
            // #enddocregion remix-checkbox
          ),
          Expanded(
            child: StyledText(
              task.title,
              style: oneLine(
                task.done
                    ? text(
                        $body,
                        $muted,
                      ).decoration(.lineThrough).decorationColor($muted())
                    : text($body),
              ),
            ),
          ),
          Xray(
            'RemixBadge',
            named: last,
            below: true,
            right: true,
            child: RemixBadge(label: task.tag, style: badge),
          ),
        ],
      ),
    );
  }
}

class Spending extends StatelessWidget {
  const Spending({super.key, this.compact = false, this.chartHeight});

  final bool compact;

  /// Fixed bar area. Without it the chart takes whatever height is left.
  final double? chartHeight;

  static const _days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  static const _dayNames = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ];
  static const _thisWeek = [132, 228, 96, 284, 164, 312, 68];
  static const _lastWeek = [204, 88, 176, 120, 252, 84, 38];

  @override
  Widget build(BuildContext context) {
    final showcase = ShowcaseScope.of(context);
    final thisWeek = showcase.range == SpendRange.thisWeek;
    final values = thisWeek ? _thisWeek : _lastWeek;
    final total = values.reduce((a, b) => a + b);
    final peak = values.reduce(math.max);
    final day = showcase.spendDay;
    final range = Xray(
      'RemixSegmentedControl',
      right: true,
      child: RemixSegmentedControl<SpendRange>(
        semanticLabel: 'Spending range',
        selectedValue: showcase.range,
        onChanged: showcase.setRange,
        style: segments,
        items: const [
          RemixSegmentedControlItem(
            value: SpendRange.thisWeek,
            label: 'This week',
          ),
          RemixSegmentedControlItem(
            value: SpendRange.lastWeek,
            label: 'Last week',
          ),
        ],
      ),
    );
    final figure = StyledText(
      '\$${day == null ? _withComma(total) : values[day]}',
      style: oneLine(text($stat)),
    );
    final note = StyledText(
      day == null
          ? (thisWeek ? '+33% vs last week' : 'Weekly total')
          : _dayNames[day],
      style: oneLine(text($small, $muted)),
    );
    if (compact) {
      return Box(
        style: cardStyle.padding(.horizontal(18)).padding(.vertical(12)),
        child: Row(
          spacing: 10,
          children: [
            Expanded(
              child: Column(
                mainAxisSize: .min,
                crossAxisAlignment: .start,
                children: [figure, note],
              ),
            ),
            range,
          ],
        ),
      );
    }
    final chart = LayoutBuilder(
      builder: (context, constraints) {
        // Leaves room for the value above the bar and the day below it.
        final showValues = constraints.maxHeight >= 80;
        final tallest = math.max(
          constraints.maxHeight - (showValues ? 46 : 24),
          12.0,
        );
        return Row(
          crossAxisAlignment: .end,
          spacing: 6,
          children: [
            for (final (index, value) in values.indexed)
              Expanded(
                child: MouseRegion(
                  onEnter: (_) => showcase.setSpendDay(index),
                  onExit: (_) => showcase.setSpendDay(null),
                  child: BoxStyler()
                      .onFocusVisible(.shape($focusShape.mix()))
                      .pressable(
                        onPress: () => showcase.setSpendDay(index),
                        semanticsLabel: '${_dayNames[index]}, \$$value spent',
                        child: Column(
                          mainAxisAlignment: .end,
                          spacing: 6,
                          children: [
                            if (showValues &&
                                (day == null ? value == peak : day == index))
                              StyledText('\$$value', style: text($small)),
                            Box(
                              style: barStyle(
                                height: tallest * value / peak,
                                active: day == null
                                    ? value == peak
                                    : day == index,
                              ),
                            ),
                            StyledText(
                              _days[index],
                              style: text($small, $muted),
                            ),
                          ],
                        ),
                      ),
                ),
              ),
          ],
        );
      },
    );
    return Box(
      style: cardPad,
      child: Column(
        mainAxisSize: .min,
        crossAxisAlignment: .stretch,
        spacing: 10,
        children: [
          if (MediaQuery.widthOf(context) < 320)
            Column(
              crossAxisAlignment: .start,
              spacing: 8,
              children: [
                StyledText('Spending', style: text($title)),
                range,
              ],
            )
          else
            Row(
              children: [
                Expanded(
                  child: StyledText('Spending', style: oneLine(text($title))),
                ),
                range,
              ],
            ),
          Column(
            crossAxisAlignment: .start,
            spacing: 1,
            children: [figure, note],
          ),
          if (chartHeight case final height?)
            SizedBox(height: height, child: chart)
          else
            Expanded(child: chart),
        ],
      ),
    );
  }
}

String _withComma(int value) => value >= 1000
    ? '${value ~/ 1000},${(value % 1000).toString().padLeft(3, '0')}'
    : '$value';

/// Edits the tokens the whole stage reads, as you drag.
class MakeItYours extends StatelessWidget {
  const MakeItYours({super.key});

  static const _accents = [
    Color(0xFF8B5CF6),
    Color(0xFF2BB673),
    Color(0xFFE5484D),
    Color(0xFF2540FF),
    Color(0xFFF59E0B),
    Color(0xFF06B6D4),
    Color(0xFFEC4899),
  ];

  /// Hue distance in degrees, used to drop swatches that nearly match the look.
  static double _hueGap(Color a, Color b) {
    final gap = (HSLColor.fromColor(a).hue - HSLColor.fromColor(b).hue).abs();
    return math.min(gap, 360 - gap);
  }

  @override
  Widget build(BuildContext context) {
    final showcase = ShowcaseScope.of(context);
    final corner = showcase.corner ?? showcase.look.control;
    final hasShadows = showcase.look.lift != null;
    final own = showcase.look.accent;
    final current = showcase.accent ?? own;
    final swatches = [
      own,
      ..._accents.where((color) => _hueGap(color, own) > 30),
    ].take(5);
    return Box(
      style: cardPad,
      child: Column(
        mainAxisSize: .min,
        crossAxisAlignment: .stretch,
        spacing: 12,
        children: [
          Wrap(
            alignment: .spaceBetween,
            crossAxisAlignment: .center,
            spacing: 12,
            runSpacing: 10,
            children: [
              StyledText('Make it yours', style: oneLine(text($title))),
              Row(
                mainAxisSize: .min,
                children: [
                  for (final color in swatches)
                    Padding(
                      padding: const EdgeInsets.only(left: 4),
                      child: _Swatch(
                        color: showcase.naked ? const Color(0xFF3A3A44) : color,
                        selected: color == current,
                        onPress: () => showcase.setAccent(color),
                      ),
                    ),
                ],
              ),
            ],
          ),
          Row(
            spacing: 12,
            children: [
              StyledText('Corners', style: text($body, $muted)),
              Expanded(
                child: RemixSlider(
                  value: corner.clamp(0, 24),
                  max: 24,
                  semanticLabel: 'Corner radius',
                  onChanged: showcase.setCorner,
                  style: quietSlider,
                ),
              ),
              SizedBox(
                width: 34,
                child: StyledText(
                  '${corner.round()}px',
                  style: text($small, $muted).textAlign(.right),
                ),
              ),
            ],
          ),
          Row(
            children: [
              Expanded(
                child: StyledText(
                  hasShadows ? 'Shadows' : 'Shadows · none',
                  style: text($body, $muted),
                ),
              ),
              Xray(
                'RemixSwitch',
                right: true,
                below: true,
                child: RemixSwitch(
                  selected: hasShadows && !showcase.flat,
                  enabled: hasShadows,
                  semanticLabel: 'Shadows',
                  onChanged: (on) => showcase.setFlat(!on),
                  style: quietSwitch,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

String _colorName(Color color) => switch (color.toARGB32()) {
  0xFF8B5CF6 => 'violet',
  0xFF2BB673 => 'green',
  0xFFE5484D => 'red',
  0xFF2540FF => 'blue',
  0xFFF59E0B => 'amber',
  0xFF06B6D4 => 'cyan',
  0xFFEC4899 => 'pink',
  _ => 'original',
};

class _Swatch extends StatelessWidget {
  const _Swatch({
    required this.color,
    required this.selected,
    required this.onPress,
  });

  final Color color;
  final bool selected;
  final VoidCallback onPress;

  @override
  Widget build(BuildContext context) {
    return Box(
      style: BoxStyler()
          .padding(.all(2))
          .shape(selected ? $swatchRing.mix() : $swatchShape.mix())
          .animate(.easeOut(200.ms)),
      child: BoxStyler()
          .size(20, 20)
          .color(color)
          .shape($tinyShape.mix())
          .onHovered(.scale(1.14))
          .animate(motion)
          .pressable(
            onPress: onPress,
            semanticsLabel: 'Use ${_colorName(color)} accent',
            child: const SizedBox.shrink(),
          ),
    );
  }
}

/// The same header on every card that has one.
class CardHeader extends StatelessWidget {
  const CardHeader(this.title, {super.key, this.meta});

  final String title;
  final String? meta;

  @override
  Widget build(BuildContext context) {
    final detail = meta;
    return Row(
      mainAxisAlignment: .spaceBetween,
      children: [
        StyledText(title, style: oneLine(text($title))),
        if (detail != null)
          StyledText(detail, style: oneLine(text($small, $muted))),
      ],
    );
  }
}

class Team extends StatelessWidget {
  const Team({super.key});

  @override
  Widget build(BuildContext context) {
    final showcase = ShowcaseScope.of(context);
    return Box(
      style: cardPad,
      child: Column(
        mainAxisSize: .min,
        mainAxisAlignment: .spaceBetween,
        crossAxisAlignment: .stretch,
        spacing: 10,
        children: [
          CardHeader(
            'Team',
            meta:
                '${showcase.people.where((person) => person.invited).length} invited',
          ),
          for (final person in showcase.people)
            Row(
              spacing: 10,
              children: [
                Xray(
                  'RemixAvatar',
                  named: person == showcase.people.first,
                  child: showcase.naked
                      ? StyledText(person.initials, style: text($small))
                      : RemixAvatar(label: person.initials, style: avatar),
                ),
                Expanded(
                  child: Column(
                    crossAxisAlignment: .start,
                    children: [
                      StyledText(person.name, style: oneLine(text($body))),
                      StyledText(
                        person.job,
                        style: oneLine(text($small, $muted)),
                      ),
                    ],
                  ),
                ),
                Xray(
                  'RemixButton',
                  named: person == showcase.people.last,
                  right: true,
                  below: true,
                  child: InviteButton(key: ObjectKey(person), person: person),
                ),
              ],
            ),
        ],
      ),
    );
  }
}

class _NakedTransport extends StatelessWidget {
  const _NakedTransport();

  @override
  Widget build(BuildContext context) {
    final showcase = ShowcaseScope.of(context);
    Widget button(String label, VoidCallback onPressed) => NakedButton(
      onPressed: onPressed,
      semanticLabel: label,
      builder: (context, state, child) => Text(
        '[ $label ]',
        style: TextStyle(
          fontFamily: 'GeistMono',
          fontSize: 13,
          decoration: state.isFocused
              ? TextDecoration.underline
              : TextDecoration.none,
          color: state.isHovered || state.isFocused
              ? const Color(0xFFFFFFFF)
              : const Color(0xFFA0A0AC),
        ),
      ),
    );
    return Row(
      mainAxisAlignment: .center,
      spacing: 14,
      children: [
        button('prev', () => showcase.skip(-1)),
        button(
          showcase.playing ? 'pause' : 'play',
          () => showcase.setPlaying(!showcase.playing),
        ),
        button('next', () => showcase.skip(1)),
      ],
    );
  }
}

class _NakedRow extends StatelessWidget {
  const _NakedRow({
    required this.title,
    required this.done,
    required this.hovered,
    required this.focused,
    required this.pressed,
  });

  final String title;
  final bool done;
  final bool hovered;
  final bool focused;
  final bool pressed;

  @override
  Widget build(BuildContext context) {
    final compact = MediaQuery.widthOf(context) < 420;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 8),
      decoration: BoxDecoration(
        border: Border(
          left: BorderSide(
            color: focused ? const Color(0xFFFFFFFF) : const Color(0x00000000),
            width: 2,
          ),
        ),
      ),
      child: Row(
        spacing: 8,
        children: [
          StyledText(done ? '[x]' : '[ ]', style: text($body)),
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

class NakedFlag extends StatelessWidget {
  const NakedFlag(this.label, {super.key, required this.on});

  final String label;
  final bool on;

  @override
  Widget build(BuildContext context) {
    return Text(
      label,
      style: TextStyle(
        fontFamily: 'GeistMono',
        fontSize: 10.5,
        color: on ? const Color(0xFFFFFFFF) : const Color(0xFF8A8A96),
        fontWeight: on ? FontWeight.w500 : FontWeight.w400,
      ),
    );
  }
}
