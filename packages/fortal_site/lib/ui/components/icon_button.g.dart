// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'icon_button.dart';

// **************************************************************************
// MixWidgetGenerator
// **************************************************************************

/// Ui-themed IconButton with Ui sizes, variants, and overrides.
class UiIconButton extends StatelessWidget {
  const UiIconButton({
    super.key,
    this.variant = .solid,
    this.size = .size2,
    this.highContrast = false,
    this.style = const IconButtonStyler.create(),
    required this.icon,
    required this.semanticLabel,
    this.iconBuilder,
    this.loadingBuilder,
    this.loading = false,
    this.enabled = true,
    this.enableFeedback = true,
    this.onPressed,
    this.onLongPress,
    this.focusNode,
    this.autofocus = false,
    this.semanticHint,
    this.excludeSemantics = false,
    this.mouseCursor = SystemMouseCursors.click,
  });

  const UiIconButton.solid({
    super.key,
    this.size = .size2,
    this.highContrast = false,
    this.style = const IconButtonStyler.create(),
    required this.icon,
    required this.semanticLabel,
    this.iconBuilder,
    this.loadingBuilder,
    this.loading = false,
    this.enabled = true,
    this.enableFeedback = true,
    this.onPressed,
    this.onLongPress,
    this.focusNode,
    this.autofocus = false,
    this.semanticHint,
    this.excludeSemantics = false,
    this.mouseCursor = SystemMouseCursors.click,
  }) : variant = UiIconButtonVariant.solid;

  const UiIconButton.soft({
    super.key,
    this.size = .size2,
    this.highContrast = false,
    this.style = const IconButtonStyler.create(),
    required this.icon,
    required this.semanticLabel,
    this.iconBuilder,
    this.loadingBuilder,
    this.loading = false,
    this.enabled = true,
    this.enableFeedback = true,
    this.onPressed,
    this.onLongPress,
    this.focusNode,
    this.autofocus = false,
    this.semanticHint,
    this.excludeSemantics = false,
    this.mouseCursor = SystemMouseCursors.click,
  }) : variant = UiIconButtonVariant.soft;

  const UiIconButton.surface({
    super.key,
    this.size = .size2,
    this.highContrast = false,
    this.style = const IconButtonStyler.create(),
    required this.icon,
    required this.semanticLabel,
    this.iconBuilder,
    this.loadingBuilder,
    this.loading = false,
    this.enabled = true,
    this.enableFeedback = true,
    this.onPressed,
    this.onLongPress,
    this.focusNode,
    this.autofocus = false,
    this.semanticHint,
    this.excludeSemantics = false,
    this.mouseCursor = SystemMouseCursors.click,
  }) : variant = UiIconButtonVariant.surface;

  const UiIconButton.outline({
    super.key,
    this.size = .size2,
    this.highContrast = false,
    this.style = const IconButtonStyler.create(),
    required this.icon,
    required this.semanticLabel,
    this.iconBuilder,
    this.loadingBuilder,
    this.loading = false,
    this.enabled = true,
    this.enableFeedback = true,
    this.onPressed,
    this.onLongPress,
    this.focusNode,
    this.autofocus = false,
    this.semanticHint,
    this.excludeSemantics = false,
    this.mouseCursor = SystemMouseCursors.click,
  }) : variant = UiIconButtonVariant.outline;

  const UiIconButton.ghost({
    super.key,
    this.size = .size2,
    this.highContrast = false,
    this.style = const IconButtonStyler.create(),
    required this.icon,
    required this.semanticLabel,
    this.iconBuilder,
    this.loadingBuilder,
    this.loading = false,
    this.enabled = true,
    this.enableFeedback = true,
    this.onPressed,
    this.onLongPress,
    this.focusNode,
    this.autofocus = false,
    this.semanticHint,
    this.excludeSemantics = false,
    this.mouseCursor = SystemMouseCursors.click,
  }) : variant = UiIconButtonVariant.ghost;

  final UiIconButtonVariant variant;

  final UiIconButtonSize size;

  final bool highContrast;

  final IconButtonStyler style;

  final IconData? icon;

  final String semanticLabel;

  final RemixIconButtonIconBuilder? iconBuilder;

  final RemixIconButtonLoadingBuilder? loadingBuilder;

  final bool loading;

  final bool enabled;

  final bool enableFeedback;

  final VoidCallback? onPressed;

  final VoidCallback? onLongPress;

  final FocusNode? focusNode;

  final bool autofocus;

  final String? semanticHint;

  final bool excludeSemantics;

  final MouseCursor mouseCursor;

  @override
  Widget build(BuildContext _) {
    return RemixIconButton(
      key: key,
      style: uiIconButtonStyle(
        variant: variant,
        size: size,
        highContrast: highContrast,
        style: style,
      ),
      icon: icon,
      semanticLabel: semanticLabel,
      iconBuilder: iconBuilder,
      loadingBuilder: loadingBuilder,
      loading: loading,
      enabled: enabled,
      enableFeedback: enableFeedback,
      onPressed: onPressed,
      onLongPress: onLongPress,
      focusNode: focusNode,
      autofocus: autofocus,
      semanticHint: semanticHint,
      excludeSemantics: excludeSemantics,
      mouseCursor: mouseCursor,
    );
  }
}
