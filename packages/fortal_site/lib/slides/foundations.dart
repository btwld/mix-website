// The foundations slide: the colour, type and shape every component is built
// from, each read live from the current theme.
import 'package:flutter/widgets.dart';
import 'package:remix/remix.dart';

import '../backdrops.dart';
import '../kit.dart';
import '../theme.dart';
import '../ui/ui.dart';

class FoundationsSlide extends StatelessWidget {
  const FoundationsSlide({super.key, this.active = true, this.compact = false});

  final bool active;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final heading = SlideHeading(
      label: 'Foundations',
      title: 'One set of tokens behind it all.',
      detail: 'Colour, type and shape come from tokens, so a theme changes them together.',
      compact: compact,
    );
    final credit = Builder(
      builder: (context) => Text(
        'Built with Mix and Remix.',
        style: TextStyle(
          fontSize: 17,
          fontWeight: FontWeight.w600,
          color: tokenColor(context, UiTokens.gray11),
        ),
      ),
    );
    if (compact) {
      return NarrowSection(
        backdrop: SandBackdrop(scene: 2, shore: true, active: active),
        children: [heading, _colour(), _type(), _shape(), _spacing(), credit],
      );
    }
    return SlideFrame(
      backdrop: SandBackdrop(scene: 2, shore: true, active: active),
      child: Stack(
        children: [
          Positioned(left: gutter, top: headingTop, width: 900, child: heading),
          // Four cards of three grid columns each, the same height.
          Positioned(
            left: gutter,
            right: gutter,
            top: headingTop + 114 + Gap.x12,
            child: IntrinsicHeight(
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                spacing: Gap.x6,
                children: [
                  Expanded(child: _colour()),
                  Expanded(child: _type()),
                  Expanded(child: _shape()),
                  Expanded(child: _spacing()),
                ],
              ),
            ),
          ),
          // The closing line, 48 above the water's edge, which the sand
          // backdrop draws at about 785 at its highest.
          Positioned(left: gutter, bottom: 900 - 785 + Gap.x12, child: credit),
        ],
      ),
    );
  }
}

const _accentSteps = [
  UiTokens.accent1,
  UiTokens.accent2,
  UiTokens.accent3,
  UiTokens.accent4,
  UiTokens.accent5,
  UiTokens.accent6,
  UiTokens.accent7,
  UiTokens.accent8,
  UiTokens.accent9,
  UiTokens.accent10,
  UiTokens.accent11,
  UiTokens.accent12,
];

const _graySteps = [
  UiTokens.gray1,
  UiTokens.gray2,
  UiTokens.gray3,
  UiTokens.gray4,
  UiTokens.gray5,
  UiTokens.gray6,
  UiTokens.gray7,
  UiTokens.gray8,
  UiTokens.gray9,
  UiTokens.gray10,
  UiTokens.gray11,
  UiTokens.gray12,
];

Widget _scale(String name, List<ColorToken> steps) => Column(
  crossAxisAlignment: CrossAxisAlignment.stretch,
  spacing: Gap.x2,
  children: [
    UiText(name, size: .size2, weight: .medium),
    Builder(
      builder: (context) => DecoratedBox(
        position: DecorationPosition.foreground,
        decoration: BoxDecoration(
          border: Border.all(color: tokenColor(context, UiTokens.gray6)),
          borderRadius: tokenRadius(context, UiTokens.radius4),
        ),
        child: ClipRRect(
          borderRadius: tokenRadius(context, UiTokens.radius4),
          child: SizedBox(
            height: 36,
            child: Row(
              children: [
                for (final step in steps)
                  Expanded(child: Box(style: BoxStyler().color(step()))),
              ],
            ),
          ),
        ),
      ),
    ),
    Row(
      children: [
        for (var i = 1; i <= steps.length; i++)
          Expanded(child: Center(child: Muted('$i', small: true))),
      ],
    ),
  ],
);

Widget _colour() => Slab(
  label: 'Colour',
  child: Column(
    crossAxisAlignment: CrossAxisAlignment.stretch,
    spacing: Gap.x4,
    children: [
      _scale('Accent', _accentSteps),
      _scale('Neutral', _graySteps),
      const UiText(
        'Twelve steps: backgrounds, borders, fills, then text.',
        size: .size2,
      ),
    ],
  ),
);

Widget _type() => const Slab(
  label: 'Type',
  child: Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    spacing: Gap.x3,
    children: [
      UiHeading('Heading', size: .size8),
      UiHeading('Section title', size: .size6),
      UiHeading('Card title', size: .size4),
      UiText('Body text for reading, set a little larger.', size: .size3),
      UiText('Labels, captions and other small print.', size: .size2),
    ],
  ),
);

Widget _shape() => Slab(
  label: 'Shape',
  child: Column(
    crossAxisAlignment: CrossAxisAlignment.stretch,
    spacing: Gap.x3,
    children: [
      for (final (name, radius) in const [
        ('None', UiRadius.none),
        ('Small', UiRadius.small),
        ('Medium', UiRadius.medium),
        ('Large', UiRadius.large),
        ('Full', UiRadius.full),
      ])
        Row(
          children: [
            Expanded(
              child: UiText(name, size: .size2, weight: .medium),
            ),
            // The same button under each radius setting.
            ValueListenableBuilder(
              valueListenable: siteAccent,
              builder: (context, accent, _) => FortalTheme(
                accent: accent,
                radius: radius,
                child: UiButton(
                  label: 'Button',
                  variant: .soft,
                  onPressed: () {},
                ),
              ),
            ),
          ],
        ),
    ],
  ),
);

// Fortal's spacing steps, each drawn at its own length.
Widget _spacing() => Slab(
  label: 'Spacing',
  child: Column(
    crossAxisAlignment: CrossAxisAlignment.stretch,
    spacing: Gap.x2,
    children: [
      for (final (name, step) in const [
        ('1', UiTokens.space1),
        ('2', UiTokens.space2),
        ('3', UiTokens.space3),
        ('4', UiTokens.space4),
        ('5', UiTokens.space5),
        ('6', UiTokens.space6),
        ('7', UiTokens.space7),
        ('8', UiTokens.space8),
      ])
        Row(
          spacing: Gap.x3,
          children: [
            SizedBox(
              width: Gap.x3,
              child: UiText(name, size: .size2),
            ),
            Builder(
              builder: (context) {
                final length = MixScope.tokenOf(step, context);
                return Row(
                  spacing: Gap.x2,
                  children: [
                    Box(
                      style: BoxStyler()
                          .size(length, 12)
                          .color(UiTokens.accent9())
                          .borderRadius(.circular(2)),
                    ),
                    Muted('${length.round()}', small: true),
                  ],
                );
              },
            ),
          ],
        ),
    ],
  ),
);
