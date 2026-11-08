// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'card.dart';

// **************************************************************************
// MixWidgetGenerator
// **************************************************************************

/// Flat panels. Elevation is reserved for floating layers, never cards.
class FortalCard extends StatelessWidget {
  const FortalCard({
    super.key,
    this.variant = .surface,
    this.size = .size1,
    this.style = const CardStyler.create(),
    this.child,
  });

  const FortalCard.surface({
    super.key,
    this.size = .size1,
    this.style = const CardStyler.create(),
    this.child,
  }) : variant = FortalCardVariant.surface;

  const FortalCard.ghost({
    super.key,
    this.size = .size1,
    this.style = const CardStyler.create(),
    this.child,
  }) : variant = FortalCardVariant.ghost;

  final FortalCardVariant variant;

  final FortalCardSize size;

  final CardStyler style;

  final Widget? child;

  @override
  Widget build(BuildContext _) {
    return RemixCard(
      key: key,
      style: fortalCardStyle(variant: variant, size: size, style: style),
      child: child,
    );
  }
}
