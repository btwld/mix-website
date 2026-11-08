// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'badge.dart';

// **************************************************************************
// MixWidgetGenerator
// **************************************************************************

/// Fortal-themed Badge with Fortal sizes, variants, and overrides.
class FortalBadge extends StatelessWidget {
  const FortalBadge({
    super.key,
    this.variant = .soft,
    this.size = .size1,
    this.highContrast = false,
    this.style = const BadgeStyler.create(),
    this.label,
    this.child,
    this.labelBuilder,
  });

  const FortalBadge.solid({
    super.key,
    this.size = .size1,
    this.highContrast = false,
    this.style = const BadgeStyler.create(),
    this.label,
    this.child,
    this.labelBuilder,
  }) : variant = FortalBadgeVariant.solid;

  const FortalBadge.soft({
    super.key,
    this.size = .size1,
    this.highContrast = false,
    this.style = const BadgeStyler.create(),
    this.label,
    this.child,
    this.labelBuilder,
  }) : variant = FortalBadgeVariant.soft;

  const FortalBadge.surface({
    super.key,
    this.size = .size1,
    this.highContrast = false,
    this.style = const BadgeStyler.create(),
    this.label,
    this.child,
    this.labelBuilder,
  }) : variant = FortalBadgeVariant.surface;

  const FortalBadge.outline({
    super.key,
    this.size = .size1,
    this.highContrast = false,
    this.style = const BadgeStyler.create(),
    this.label,
    this.child,
    this.labelBuilder,
  }) : variant = FortalBadgeVariant.outline;

  final FortalBadgeVariant variant;

  final FortalBadgeSize size;

  final bool highContrast;

  final BadgeStyler style;

  final String? label;

  final Widget? child;

  final RemixBadgeLabelBuilder? labelBuilder;

  @override
  Widget build(BuildContext _) {
    return RemixBadge(
      key: key,
      style: fortalBadgeStyle(
        variant: variant,
        size: size,
        highContrast: highContrast,
        style: style,
      ),
      label: label,
      child: child,
      labelBuilder: labelBuilder,
    );
  }
}
