// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'toggle_group.dart';

// **************************************************************************
// MixWidgetGenerator
// **************************************************************************

/// Ui-themed segmented-control preset for [RemixToggleGroup].
class UiToggleGroup<T> extends StatelessWidget {
  const UiToggleGroup({
    super.key,
    this.variant = .soft,
    this.size = .size2,
    this.highContrast = false,
    this.style = const ToggleGroupStyler.create(),
    required this.items,
    required this.selectedValue,
    this.onChanged,
    this.enabled = true,
    this.orientation = .horizontal,
    this.loop = true,
    this.semanticLabel,
    this.excludeSemantics = false,
  });

  const UiToggleGroup.soft({
    super.key,
    this.size = .size2,
    this.highContrast = false,
    this.style = const ToggleGroupStyler.create(),
    required this.items,
    required this.selectedValue,
    this.onChanged,
    this.enabled = true,
    this.orientation = .horizontal,
    this.loop = true,
    this.semanticLabel,
    this.excludeSemantics = false,
  }) : variant = UiToggleGroupVariant.soft;

  const UiToggleGroup.surface({
    super.key,
    this.size = .size2,
    this.highContrast = false,
    this.style = const ToggleGroupStyler.create(),
    required this.items,
    required this.selectedValue,
    this.onChanged,
    this.enabled = true,
    this.orientation = .horizontal,
    this.loop = true,
    this.semanticLabel,
    this.excludeSemantics = false,
  }) : variant = UiToggleGroupVariant.surface;

  final UiToggleGroupVariant variant;

  final UiToggleGroupSize size;

  final bool highContrast;

  final ToggleGroupStyler style;

  final List<RemixToggleGroupItem<T>> items;

  final T? selectedValue;

  final ValueChanged<T?>? onChanged;

  final bool enabled;

  final Axis orientation;

  final bool loop;

  final String? semanticLabel;

  final bool excludeSemantics;

  @override
  Widget build(BuildContext _) {
    return RemixToggleGroup<T>(
      key: key,
      style: uiToggleGroupStyle(
        variant: variant,
        size: size,
        highContrast: highContrast,
        style: style,
      ),
      items: items,
      selectedValue: selectedValue,
      onChanged: onChanged,
      enabled: enabled,
      orientation: orientation,
      loop: loop,
      semanticLabel: semanticLabel,
      excludeSemantics: excludeSemantics,
    );
  }
}
