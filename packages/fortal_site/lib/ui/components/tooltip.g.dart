// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'tooltip.dart';

// **************************************************************************
// MixWidgetGenerator
// **************************************************************************

/// The Ui Tooltip recipe: `gray1` text on a `gray12` fill with `radius2`
/// corners, inverted from the page, that appears after a 200ms wait.
class UiTooltip extends StatelessWidget {
  const UiTooltip({
    super.key,
    this.style = const TooltipStyler.create(),
    required this.tooltipChild,
    required this.child,
    this.tooltipKey,
    this.onOpenChanged,
    this.tooltipSemantics,
    this.positioning = const OverlayPositionConfig(),
  });

  final TooltipStyler style;

  final Widget tooltipChild;

  final Widget child;

  final GlobalKey<RawTooltipState>? tooltipKey;

  final ValueChanged<bool>? onOpenChanged;

  final String? tooltipSemantics;

  final OverlayPositionConfig positioning;

  @override
  Widget build(BuildContext _) {
    return RemixTooltip(
      key: key,
      style: uiTooltipStyle(style: style),
      tooltipChild: tooltipChild,
      child: child,
      tooltipKey: tooltipKey,
      onOpenChanged: onOpenChanged,
      tooltipSemantics: tooltipSemantics,
      positioning: positioning,
    );
  }
}
