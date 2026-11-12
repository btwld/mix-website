// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'card.dart';

// **************************************************************************
// MixWidgetGenerator
// **************************************************************************

/// Flat panels. Elevation is reserved for floating layers, never cards.
class UiCard extends StatelessWidget {
  const UiCard({
    super.key,
    this.variant = .surface,
    this.size = .size1,
    this.style = const CardStyler.create(),
    this.child,
  });

  const UiCard.surface({
    super.key,
    this.size = .size1,
    this.style = const CardStyler.create(),
    this.child,
  }) : variant = UiCardVariant.surface;

  const UiCard.ghost({
    super.key,
    this.size = .size1,
    this.style = const CardStyler.create(),
    this.child,
  }) : variant = UiCardVariant.ghost;

  final UiCardVariant variant;

  final UiCardSize size;

  final CardStyler style;

  final Widget? child;

  @override
  Widget build(BuildContext _) {
    return RemixCard(
      key: key,
      style: uiCardStyle(variant: variant, size: size, style: style),
      child: child,
    );
  }
}
