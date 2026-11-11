// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'radio.dart';

// **************************************************************************
// MixWidgetGenerator
// **************************************************************************

/// Ui-themed preset for [RemixRadio].
class UiRadio<T> extends StatelessWidget {
  const UiRadio({
    super.key,
    this.variant = .surface,
    this.size = .size2,
    this.highContrast = false,
    this.style = const RadioStyler.create(),
    required this.value,
    this.label,
    this.semanticLabel,
    this.minimumTapTargetSize = Size.zero,
    this.enabled = true,
    this.toggleable = false,
    this.mouseCursor,
    this.focusNode,
    this.autofocus = false,
    this.excludeSemantics = false,
  });

  /// Surface treatment with neutral border.
  const UiRadio.surface({
    super.key,
    this.size = .size2,
    this.highContrast = false,
    this.style = const RadioStyler.create(),
    required this.value,
    this.label,
    this.semanticLabel,
    this.minimumTapTargetSize = Size.zero,
    this.enabled = true,
    this.toggleable = false,
    this.mouseCursor,
    this.focusNode,
    this.autofocus = false,
    this.excludeSemantics = false,
  }) : variant = UiRadioVariant.surface;

  /// Soft accent treatment.
  const UiRadio.soft({
    super.key,
    this.size = .size2,
    this.highContrast = false,
    this.style = const RadioStyler.create(),
    required this.value,
    this.label,
    this.semanticLabel,
    this.minimumTapTargetSize = Size.zero,
    this.enabled = true,
    this.toggleable = false,
    this.mouseCursor,
    this.focusNode,
    this.autofocus = false,
    this.excludeSemantics = false,
  }) : variant = UiRadioVariant.soft;

  final UiRadioVariant variant;

  final UiRadioSize size;

  final bool highContrast;

  final RadioStyler style;

  final T value;

  final String? label;

  final String? semanticLabel;

  final Size minimumTapTargetSize;

  final bool enabled;

  final bool toggleable;

  final MouseCursor? mouseCursor;

  final FocusNode? focusNode;

  final bool autofocus;

  final bool excludeSemantics;

  @override
  Widget build(BuildContext _) {
    return RemixRadio<T>(
      key: key,
      style: uiRadioStyle(
        variant: variant,
        size: size,
        highContrast: highContrast,
        style: style,
      ),
      value: value,
      label: label,
      semanticLabel: semanticLabel,
      minimumTapTargetSize: minimumTapTargetSize,
      enabled: enabled,
      toggleable: toggleable,
      mouseCursor: mouseCursor,
      focusNode: focusNode,
      autofocus: autofocus,
      excludeSemantics: excludeSemantics,
    );
  }
}
