// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'checkbox.dart';

// **************************************************************************
// MixWidgetGenerator
// **************************************************************************

/// The application's Checkbox recipe.
///
/// Everything visual about a checkbox lives in this function: the box
/// geometry, the indicator, the label, and the
/// checked/indeterminate/focus/disabled fragments. Remix keeps
/// ownership of rendering, the tristate transition, pointer and keyboard
/// behavior, the minimum tap target, and the checkbox accessibility
/// semantics — this recipe never reimplements any of that.
///
/// There is deliberately no hover or pressed fragment. A button needs them
/// because nothing else about it changes on tap; a checkbox flips its own
/// state, and that is the feedback. The pointer cursor Remix sets says it can
/// be clicked.
class UiCheckbox extends StatelessWidget {
  const UiCheckbox({
    super.key,
    this.style = const CheckboxStyler.create(),
    required this.selected,
    this.onChanged,
    this.enabled = true,
    this.tristate = false,
    this.checkedIcon,
    this.uncheckedIcon,
    this.indeterminateIcon,
    this.focusNode,
    this.autofocus = false,
    this.enableFeedback = true,
    this.label,
    this.semanticLabel,
    this.minimumTapTargetSize = const Size.square(48),
    this.mouseCursor = SystemMouseCursors.click,
  });

  final CheckboxStyler style;

  final bool? selected;

  final ValueChanged<bool?>? onChanged;

  final bool enabled;

  final bool tristate;

  final IconData? checkedIcon;

  final IconData? uncheckedIcon;

  final IconData? indeterminateIcon;

  final FocusNode? focusNode;

  final bool autofocus;

  final bool enableFeedback;

  final String? label;

  final String? semanticLabel;

  final Size minimumTapTargetSize;

  final MouseCursor mouseCursor;

  @override
  Widget build(BuildContext _) {
    return RemixCheckbox(
      key: key,
      style: uiCheckboxStyle(style: style),
      selected: selected,
      onChanged: onChanged,
      enabled: enabled,
      tristate: tristate,
      checkedIcon: checkedIcon,
      uncheckedIcon: uncheckedIcon,
      indeterminateIcon: indeterminateIcon,
      focusNode: focusNode,
      autofocus: autofocus,
      enableFeedback: enableFeedback,
      label: label,
      semanticLabel: semanticLabel,
      minimumTapTargetSize: minimumTapTargetSize,
      mouseCursor: mouseCursor,
    );
  }
}

/// The application's Checkbox recipe for one option in a checkbox group.
///
/// `RemixCheckboxGroup` is behavioral: it owns the selected set and the
/// group-wide enabled and required configuration, and carries no styler of
/// its own. Without this second adapter every option in a group would need
/// the recipe attached by hand, and one missed option in a loop would render
/// unstyled beside its styled siblings.
///
/// It delegates to [uiCheckboxStyle] rather than restating it:
/// a group option is the same checkbox, so editing the recipe above restyles
/// both.
class UiCheckboxGroupItem<T extends Object> extends StatelessWidget {
  const UiCheckboxGroupItem({
    super.key,
    this.style = const CheckboxStyler.create(),
    required this.value,
    required this.label,
    this.semanticLabel,
    this.enabled = true,
    this.focusNode,
    this.autofocus = false,
    this.checkedIcon,
    this.uncheckedIcon,
    this.enableFeedback = true,
    this.minimumTapTargetSize = const Size.square(48),
    this.mouseCursor = SystemMouseCursors.click,
  });

  final CheckboxStyler style;

  final T value;

  final String label;

  final String? semanticLabel;

  final bool enabled;

  final FocusNode? focusNode;

  final bool autofocus;

  final IconData? checkedIcon;

  final IconData? uncheckedIcon;

  final bool enableFeedback;

  final Size minimumTapTargetSize;

  final MouseCursor mouseCursor;

  @override
  Widget build(BuildContext _) {
    return RemixCheckboxGroupItem<T>(
      key: key,
      style: uiCheckboxGroupItemStyle(style: style),
      value: value,
      label: label,
      semanticLabel: semanticLabel,
      enabled: enabled,
      focusNode: focusNode,
      autofocus: autofocus,
      checkedIcon: checkedIcon,
      uncheckedIcon: uncheckedIcon,
      enableFeedback: enableFeedback,
      minimumTapTargetSize: minimumTapTargetSize,
      mouseCursor: mouseCursor,
    );
  }
}
