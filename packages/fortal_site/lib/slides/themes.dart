// The themes slide: Fortal's seven themes. Picking one changes the whole
// site, and the same interface is shown in that theme's light and dark.
import 'dart:ui' as ui;

import 'package:flutter/widgets.dart';
import 'package:remix/remix.dart';

import '../backdrops.dart';
import '../bento.dart';
import '../kit.dart';
import '../theme.dart';
import '../ui/ui.dart';
import 'use.dart' show CodeCard, CodeLine, CodeTone;

class ThemesSlide extends StatelessWidget {
  const ThemesSlide({
    super.key,
    this.horizonProgram,
    this.active = true,
    this.compact = false,
  });

  final ui.FragmentProgram? horizonProgram;
  final bool active;
  final bool compact;

  @override
  Widget build(BuildContext context) => ListenableBuilder(
    listenable: siteTheme,
    builder: (context, _) => _build(siteAccent.value),
  );

  Widget _build(UiAccentColor accent) {
    final light = themeTokens(accent);
    Color at(ColorToken token) => light[token]! as Color;
    final backdrop = HorizonBackdrop(
      sky: at(UiTokens.accent3),
      haze: at(UiTokens.accent1),
      sea: at(UiTokens.accent8),
      deep: at(UiTokens.accent10),
      program: horizonProgram,
      active: active,
    );
    final code = CodeCard(
      lines: [
        CodeLine([
          ('UiTheme', CodeTone.type),
          ('(accent: .', CodeTone.plain),
          (accent.name, CodeTone.value),
          (', radius: .', CodeTone.plain),
          (siteRadius.value.name, CodeTone.value),
          (', scaling: .', CodeTone.plain),
          (siteScaling.value.name, CodeTone.value),
          (', child: app)', CodeTone.plain),
        ]),
      ],
    );
    Widget choices({bool fill = false}) => Slab(
      snug: true,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        mainAxisSize: fill ? MainAxisSize.max : MainAxisSize.min,
        children: [
          for (final choice in accentNames.keys)
            _Choice(accent: choice, on: choice == accent),
          if (fill) const Spacer(),
          const SizedBox(height: Gap.x3),
          const UiDivider(),
          const SizedBox(height: Gap.x3),
          cardLabel('Radius'),
          const SizedBox(height: Gap.x2),
          UiSegmentedControl<UiRadius>(
            size: .size1,
            items: const [
              RemixSegmentedControlItem(value: UiRadius.none, label: 'None'),
              RemixSegmentedControlItem(value: UiRadius.small, label: 'S'),
              RemixSegmentedControlItem(value: UiRadius.medium, label: 'M'),
              RemixSegmentedControlItem(value: UiRadius.large, label: 'L'),
              RemixSegmentedControlItem(value: UiRadius.full, label: 'Full'),
            ],
            selectedValue: siteRadius.value,
            onChanged: (radius) => siteRadius.value = radius,
          ),
          const SizedBox(height: Gap.x3),
          cardLabel('Scaling'),
          const SizedBox(height: Gap.x2),
          UiSegmentedControl<UiScaling>(
            size: .size1,
            items: const [
              RemixSegmentedControlItem(
                value: UiScaling.percent90,
                label: '90%',
              ),
              RemixSegmentedControlItem(
                value: UiScaling.percent100,
                label: '100%',
              ),
              RemixSegmentedControlItem(
                value: UiScaling.percent110,
                label: '110%',
              ),
            ],
            selectedValue: siteScaling.value,
            onChanged: (scaling) => siteScaling.value = scaling,
          ),
        ],
      ),
    );
    const heading = SlideHeading(
      label: 'Themes',
      title: 'Seven themes, light and dark.',
      detail: 'Pick one. The whole site follows.',
    );
    if (compact) {
      return NarrowSection(
        backdrop: backdrop,
        children: [
          const SlideHeading(
            label: 'Themes',
            title: 'Seven themes, light and dark.',
            detail: 'Pick one. The whole site follows.',
            compact: true,
          ),
          choices(),
          _Preview(accent: accent, dark: false),
          _Preview(accent: accent, dark: true),
          code,
        ],
      );
    }
    // The list takes the first of three columns and the light and dark
    // previews the other two, all ending on one line; the code line sits
    // under the previews.
    return SlideFrame(
      backdrop: backdrop,
      child: Stack(
        children: [
          const Positioned(
            left: gutter,
            top: headingTop,
            width: 900,
            child: heading,
          ),
          Positioned(
            left: gutter,
            right: gutter,
            top: _cardsTop,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              spacing: Gap.x6,
              children: [
                IntrinsicHeight(
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    spacing: Gap.x6,
                    children: [
                      SizedBox(width: wallWidth, child: choices(fill: true)),
                      Expanded(child: _Preview(accent: accent, dark: false)),
                      Expanded(child: _Preview(accent: accent, dark: true)),
                    ],
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.only(left: wallWidth + Gap.x6),
                  child: code,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// The cards follow the one-line heading 48 below its detail line.
const _cardsTop = headingTop + 114 + Gap.x12;

/// One theme in the list: its colour, its name and its scale.
class _Choice extends StatelessWidget {
  const _Choice({required this.accent, required this.on});

  final UiAccentColor accent;
  final bool on;

  @override
  Widget build(BuildContext context) {
    final tokens = themeTokens(accent);
    Color at(ColorToken token) => tokens[token]! as Color;
    return Semantics(
      button: true,
      selected: on,
      child: MouseRegion(
        cursor: SystemMouseCursors.click,
        child: GestureDetector(
          behavior: HitTestBehavior.opaque,
          onTap: () => siteAccent.value = accent,
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 160),
            height: 40,
            padding: const EdgeInsets.symmetric(horizontal: Gap.x3),
            decoration: BoxDecoration(
              color: on ? at(UiTokens.accent3) : const Color(0x00FFFFFF),
              borderRadius: tokenRadius(context, UiTokens.radius4),
            ),
            child: Row(
              spacing: Gap.x3,
              children: [
                Container(
                  width: 22,
                  height: 22,
                  decoration: BoxDecoration(
                    color: at(UiTokens.accent9),
                    shape: BoxShape.circle,
                  ),
                ),
                Expanded(
                  child: Text(
                    accentNames[accent]!,
                    style: TextStyle(
                      fontSize: 17,
                      fontWeight: on ? FontWeight.w700 : FontWeight.w500,
                      color: on
                          ? at(UiTokens.accent11)
                          : tokenColor(context, UiTokens.gray12),
                    ),
                  ),
                ),
                ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: Row(
                    children: [
                      for (final step in const [
                        UiTokens.accent3,
                        UiTokens.accent5,
                        UiTokens.accent7,
                        UiTokens.accent9,
                        UiTokens.accent11,
                      ])
                        Container(width: 15, height: 15, color: at(step)),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// The same small interface in one mode of the theme.
class _Preview extends StatelessWidget {
  const _Preview({required this.accent, required this.dark});

  final UiAccentColor accent;
  final bool dark;

  @override
  Widget build(BuildContext context) => UiTheme(
    mode: dark ? UiThemeMode.dark : UiThemeMode.light,
    accent: accent,
    radius: siteRadius.value,
    scaling: siteScaling.value,
    hasBackground: false,
    child: FortalTheme(
      accent: accent,
      dark: dark,
      child: Builder(
        builder: (context) => Container(
          decoration: BoxDecoration(
            color: tokenColor(context, UiTokens.gray1),
            borderRadius: tokenRadius(context, UiTokens.radius6),
            boxShadow: const [
              BoxShadow(
                color: Color(0x2E000000),
                blurRadius: 22,
                offset: Offset(5, 9),
              ),
            ],
          ),
          padding: const EdgeInsets.all(Gap.x4),
          // Two of the opening slide's cards, release progress and alerts,
          // each as tall as its content, as on that slide.
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            spacing: Gap.x4,
            children: [heroTiles()[0], heroTiles()[7]],
          ),
        ),
      ),
    ),
  );
}
