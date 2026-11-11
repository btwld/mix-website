// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'accordion.dart';

// **************************************************************************
// MixWidgetGenerator
// **************************************************************************

/// Ui-themed preset for [RemixAccordion].
class UiAccordion<T> extends StatelessWidget {
  const UiAccordion({
    super.key,
    this.variant = .surface,
    this.size = .size2,
    this.style = const AccordionStyler.create(),
    required this.value,
    required this.child,
    this.title,
    this.leadingIcon,
    this.trailingIcon,
    this.builder,
    this.enabled = true,
    this.mouseCursor = SystemMouseCursors.click,
    this.enableFeedback = true,
    this.autofocus = false,
    this.focusNode,
    this.onFocusChange,
    this.onHoverChange,
    this.onPressChange,
    this.semanticLabel,
    this.transitionBuilder,
  });

  const UiAccordion.surface({
    super.key,
    this.size = .size2,
    this.style = const AccordionStyler.create(),
    required this.value,
    required this.child,
    this.title,
    this.leadingIcon,
    this.trailingIcon,
    this.builder,
    this.enabled = true,
    this.mouseCursor = SystemMouseCursors.click,
    this.enableFeedback = true,
    this.autofocus = false,
    this.focusNode,
    this.onFocusChange,
    this.onHoverChange,
    this.onPressChange,
    this.semanticLabel,
    this.transitionBuilder,
  }) : variant = UiAccordionVariant.surface;

  const UiAccordion.soft({
    super.key,
    this.size = .size2,
    this.style = const AccordionStyler.create(),
    required this.value,
    required this.child,
    this.title,
    this.leadingIcon,
    this.trailingIcon,
    this.builder,
    this.enabled = true,
    this.mouseCursor = SystemMouseCursors.click,
    this.enableFeedback = true,
    this.autofocus = false,
    this.focusNode,
    this.onFocusChange,
    this.onHoverChange,
    this.onPressChange,
    this.semanticLabel,
    this.transitionBuilder,
  }) : variant = UiAccordionVariant.soft;

  final UiAccordionVariant variant;

  final UiAccordionSize size;

  final AccordionStyler style;

  final T value;

  final Widget child;

  final String? title;

  final IconData? leadingIcon;

  final IconData? trailingIcon;

  final NakedAccordionTriggerBuilder<T>? builder;

  final bool enabled;

  final MouseCursor mouseCursor;

  final bool enableFeedback;

  final bool autofocus;

  final FocusNode? focusNode;

  final ValueChanged<bool>? onFocusChange;

  final ValueChanged<bool>? onHoverChange;

  final ValueChanged<bool>? onPressChange;

  final String? semanticLabel;

  final Widget Function(Widget, Animation<double>)? transitionBuilder;

  @override
  Widget build(BuildContext _) {
    return RemixAccordion<T>(
      key: key,
      style: uiAccordionStyle(variant: variant, size: size, style: style),
      value: value,
      child: child,
      title: title,
      leadingIcon: leadingIcon,
      trailingIcon: trailingIcon,
      builder: builder,
      enabled: enabled,
      mouseCursor: mouseCursor,
      enableFeedback: enableFeedback,
      autofocus: autofocus,
      focusNode: focusNode,
      onFocusChange: onFocusChange,
      onHoverChange: onHoverChange,
      onPressChange: onPressChange,
      semanticLabel: semanticLabel,
      transitionBuilder: transitionBuilder,
    );
  }
}
