// The charts slide: Fortal's three charts, each drawn from a small set of
// believable numbers and coloured by the current theme.
//
// Only the charts' data and configuration are set here: their axes (bounds,
// steps and how a step is written) and, for the pie, a palette taken from the
// theme's accent scale. How they are drawn is Fortal's.
import 'package:flutter/widgets.dart';
import 'package:mix_chart/mix_chart.dart';

import '../backdrops.dart';
import '../kit.dart';
import '../theme.dart';
import '../ui/ui.dart';

class ChartsSlide extends StatelessWidget {
  const ChartsSlide({super.key, this.active = true, this.compact = false});

  final bool active;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final heading = SlideHeading(
      label: 'Charts',
      title: 'Charts in the same language.',
      detail: 'Line, bar and pie charts take their colours and type from the theme.',
      compact: compact,
    );
    final cards = [_line(), _bars(), _pie()];
    if (compact) {
      return NarrowSection(
        backdrop: SandBackdrop(scene: 2, active: active),
        children: [heading, ...cards],
      );
    }
    return SlideFrame(
      backdrop: SandBackdrop(scene: 2, active: active),
      child: Stack(
        children: [
          Positioned(left: gutter, top: headingTop, width: 900, child: heading),
          Positioned(
            left: gutter,
            right: gutter,
            top: headingTop + 114 + Gap.x12,
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              spacing: Gap.x6,
              children: [for (final card in cards) Expanded(child: card)],
            ),
          ),
        ],
      ),
    );
  }
}

/// The height every chart is given, so the three cards end on one line.
const _chartHeight = 320.0;

Widget _chartCard({
  required String title,
  required String figure,
  required String note,
  required String uses,
  required Widget chart,
}) => ShowCard(
  title: title,
  snug: false,
  uses: uses,
  lead: Row(
    crossAxisAlignment: CrossAxisAlignment.end,
    spacing: Gap.x2,
    children: [
      UiHeading(figure, size: .size7),
      Padding(
        padding: const EdgeInsets.only(bottom: Gap.x1),
        child: Muted(note),
      ),
    ],
  ),
  child: SizedBox(height: _chartHeight, child: chart),
);

const _months = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'];

/// Writes a month's index on the bottom axis as its name. Steps that fall
/// between two months, or outside the six, are left blank.
String _month(double value) {
  final i = value.round();
  return (value - i).abs() < 0.01 && i >= 0 && i < _months.length
      ? _months[i]
      : '';
}

/// Writes a count without a decimal point.
String _whole(double value) => '${value.round()}';

/// Writes 1250 as "1,250".
String _thousands(double value) {
  final n = value.round();
  return n >= 1000 ? '${n ~/ 1000},${'${n % 1000}'.padLeft(3, '0')}' : '$n';
}

Widget _line() => _chartCard(
  title: 'Active teams',
  figure: '1,284',
  note: 'up 18% since June',
  uses: 'Line chart',
  chart: UiLineChart(
    showMarkers: true,
    semanticsLabel: 'Active teams each month',
    // One step per month, named. The bounds sit a little outside the first
    // and last month, so their markers are not cut by the plot's edge, and
    // the bounds themselves are not written.
    xAxis: ChartAxis.numeric(
      min: -0.3,
      max: _months.length - 0.7,
      interval: 1,
      minIncluded: false,
      maxIncluded: false,
      labelFormatter: _month,
    ),
    // Fortal's grid picks its own steps (always 1, 2 or 5 times a power of
    // ten) and draws no line at the plot's top and bottom edges, so the
    // labels are left on the grid's steps. The top bound sits just above
    // 1,300, so that label has its line. The same formatter writes the
    // value in the tooltip.
    yAxis: ChartAxis.numeric(
      min: 1000,
      max: 1320,
      maxIncluded: false,
      labelFormatter: _thousands,
    ),
    series: [
      LineSeries(
        id: 'teams',
        label: 'Teams',
        points: [
          for (final (i, y) in const [
            1088.0,
            1102.0,
            1150.0,
            1171.0,
            1236.0,
            1284.0,
          ].indexed)
            ChartPoint(id: _months[i], x: i.toDouble(), y: y),
        ],
      ),
    ],
  ),
);

Widget _bars() => _chartCard(
  title: 'Releases shipped',
  figure: '42',
  note: 'this half-year',
  uses: 'Bar chart',
  chart: UiBarChart(
    semanticsLabel: 'Releases shipped each month',
    // As for the line: the grid's steps, with the top bound just above 12
    // so the top label has its line.
    yAxis: ChartAxis.numeric(
      min: 0,
      max: 12.5,
      maxIncluded: false,
      labelFormatter: _whole,
    ),
    groups: [
      for (final (i, count) in const [5.0, 6.0, 4.0, 8.0, 9.0, 10.0].indexed)
        BarGroup(
          id: _months[i],
          label: _months[i],
          bars: [BarValue(id: 'shipped', label: 'Shipped', toY: count)],
        ),
    ],
  ),
);

const _sources = [('Planned', 56.0), ('Requests', 29.0), ('Fixes', 15.0)];

/// Three steps of the theme's own accent, from its solid colour to its
/// darkest text step and a light fill, so the pie wears the theme and every
/// slice stands apart from its neighbours and from the card.
const _sourceSteps = [UiTokens.accent9, UiTokens.accent11, UiTokens.accent6];

/// The width the pie is given: Fortal draws it 160 across, and a slice under
/// the pointer moves out by 8.
const _pieWidth = 176.0;

Widget _pie() => _chartCard(
  title: 'Where work comes from',
  figure: '3',
  note: 'sources',
  uses: 'Pie chart · Text',
  chart: Builder(
    builder: (context) {
      final palette = [
        for (final step in _sourceSteps) tokenColor(context, step),
      ];
      return Row(
        spacing: Gap.x6,
        children: [
          // The legend, built from Fortal text beside a swatch of each
          // slice's colour.
          Expanded(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              spacing: Gap.x3,
              children: [
                for (final (i, (name, share)) in _sources.indexed)
                  Row(
                    spacing: Gap.x2,
                    children: [
                      Container(
                        width: Gap.x3,
                        height: Gap.x3,
                        decoration: BoxDecoration(
                          color: palette[i],
                          borderRadius: tokenRadius(context, UiTokens.radius1),
                        ),
                      ),
                      Expanded(child: UiText(name, size: .size2)),
                      Muted('${share.round()}%'),
                    ],
                  ),
              ],
            ),
          ),
          SizedBox(
            width: _pieWidth,
            child: UiPieChart(
              semanticsLabel: 'Share of work by source',
              palette: palette,
              valueFormatter: (share) => '${share.round()}%',
              slices: [
                for (final (name, share) in _sources)
                  PieSlice(id: name, label: name, value: share),
              ],
            ),
          ),
        ],
      );
    },
  ),
);
