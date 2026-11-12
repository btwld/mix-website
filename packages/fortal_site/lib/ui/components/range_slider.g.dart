// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'range_slider.dart';

// **************************************************************************
// MixWidgetGenerator
// **************************************************************************

/// Two-bound slider sharing [uiSliderStyle]'s variants, sizes and states.
/// Each thumb keeps independent hover, press and visible keyboard focus.
/// Supply distinct localized `semanticLabels`. For custom value announcements,
/// use [RemixRangeSlider] with this recipe and `semanticFormatterCallbacks`.
class UiRangeSlider extends StatelessWidget {
  const UiRangeSlider({
    super.key,
    this.variant = .surface,
    this.size = .size2,
    this.highContrast = false,
    this.style = const SliderStyler.create(),
    required this.values,
    this.onChanged,
    this.onChangeStart,
    this.onChangeEnd,
    this.min = 0,
    this.max = 1,
    this.minSpacing = 0,
    this.snapDivisions,
    this.enabled = true,
    this.enableFeedback = true,
    this.focusNodes,
    this.autofocusThumbIndex,
    this.semanticLabels,
    this.excludeSemantics = false,
  });

  const UiRangeSlider.surface({
    super.key,
    this.size = .size2,
    this.highContrast = false,
    this.style = const SliderStyler.create(),
    required this.values,
    this.onChanged,
    this.onChangeStart,
    this.onChangeEnd,
    this.min = 0,
    this.max = 1,
    this.minSpacing = 0,
    this.snapDivisions,
    this.enabled = true,
    this.enableFeedback = true,
    this.focusNodes,
    this.autofocusThumbIndex,
    this.semanticLabels,
    this.excludeSemantics = false,
  }) : variant = UiSliderVariant.surface;

  const UiRangeSlider.soft({
    super.key,
    this.size = .size2,
    this.highContrast = false,
    this.style = const SliderStyler.create(),
    required this.values,
    this.onChanged,
    this.onChangeStart,
    this.onChangeEnd,
    this.min = 0,
    this.max = 1,
    this.minSpacing = 0,
    this.snapDivisions,
    this.enabled = true,
    this.enableFeedback = true,
    this.focusNodes,
    this.autofocusThumbIndex,
    this.semanticLabels,
    this.excludeSemantics = false,
  }) : variant = UiSliderVariant.soft;

  final UiSliderVariant variant;

  final UiSliderSize size;

  final bool highContrast;

  final SliderStyler style;

  final List<double> values;

  final ValueChanged<List<double>>? onChanged;

  final ValueChanged<List<double>>? onChangeStart;

  final ValueChanged<List<double>>? onChangeEnd;

  final double min;

  final double max;

  final double minSpacing;

  final int? snapDivisions;

  final bool enabled;

  final bool enableFeedback;

  final List<FocusNode?>? focusNodes;

  final int? autofocusThumbIndex;

  final List<String?>? semanticLabels;

  final bool excludeSemantics;

  @override
  Widget build(BuildContext _) {
    return RemixRangeSlider(
      key: key,
      style: uiRangeSliderStyle(
        variant: variant,
        size: size,
        highContrast: highContrast,
        style: style,
      ),
      values: values,
      onChanged: onChanged,
      onChangeStart: onChangeStart,
      onChangeEnd: onChangeEnd,
      min: min,
      max: max,
      minSpacing: minSpacing,
      snapDivisions: snapDivisions,
      enabled: enabled,
      enableFeedback: enableFeedback,
      focusNodes: focusNodes,
      autofocusThumbIndex: autofocusThumbIndex,
      semanticLabels: semanticLabels,
      excludeSemantics: excludeSemantics,
    );
  }
}
