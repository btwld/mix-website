// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'toggle.dart';

// **************************************************************************
// MixWidgetGenerator
// **************************************************************************

/// Ui-themed preset for [RemixToggle].
class UiToggle extends StatelessWidget {
  const UiToggle({
    super.key,
    this.variant = .ghost,
    this.size = .size2,
    this.highContrast = false,
    this.style = const ToggleStyler.create(),
    required this.selected,
    this.onChanged,
    this.enabled = true,
    this.label,
    this.icon,
    this.enableFeedback = true,
    this.focusNode,
    this.autofocus = false,
    this.semanticLabel,
    this.excludeSemantics = false,
    this.mouseCursor = SystemMouseCursors.click,
  });

  const UiToggle.ghost({
    super.key,
    this.size = .size2,
    this.highContrast = false,
    this.style = const ToggleStyler.create(),
    required this.selected,
    this.onChanged,
    this.enabled = true,
    this.label,
    this.icon,
    this.enableFeedback = true,
    this.focusNode,
    this.autofocus = false,
    this.semanticLabel,
    this.excludeSemantics = false,
    this.mouseCursor = SystemMouseCursors.click,
  }) : variant = UiToggleVariant.ghost;

  const UiToggle.outline({
    super.key,
    this.size = .size2,
    this.highContrast = false,
    this.style = const ToggleStyler.create(),
    required this.selected,
    this.onChanged,
    this.enabled = true,
    this.label,
    this.icon,
    this.enableFeedback = true,
    this.focusNode,
    this.autofocus = false,
    this.semanticLabel,
    this.excludeSemantics = false,
    this.mouseCursor = SystemMouseCursors.click,
  }) : variant = UiToggleVariant.outline;

  final UiToggleVariant variant;

  final UiToggleSize size;

  final bool highContrast;

  final ToggleStyler style;

  final bool selected;

  final ValueChanged<bool>? onChanged;

  final bool enabled;

  final String? label;

  final IconData? icon;

  final bool enableFeedback;

  final FocusNode? focusNode;

  final bool autofocus;

  final String? semanticLabel;

  final bool excludeSemantics;

  final MouseCursor mouseCursor;

  @override
  Widget build(BuildContext _) {
    return RemixToggle(
      key: key,
      style: uiToggleStyle(
        variant: variant,
        size: size,
        highContrast: highContrast,
        style: style,
      ),
      selected: selected,
      onChanged: onChanged,
      enabled: enabled,
      label: label,
      icon: icon,
      enableFeedback: enableFeedback,
      focusNode: focusNode,
      autofocus: autofocus,
      semanticLabel: semanticLabel,
      excludeSemantics: excludeSemantics,
      mouseCursor: mouseCursor,
    );
  }
}
