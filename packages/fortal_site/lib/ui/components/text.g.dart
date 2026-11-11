// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'text.dart';

// **************************************************************************
// MixWidgetGenerator
// **************************************************************************

/// Ui-themed body text on the Ui nine-step scale.
class UiText extends StatelessWidget {
  const UiText(
    this.text, {
    super.key,
    this.size,
    this.weight,
    this.align,
    this.softWrap = true,
    this.truncate = false,
    this.accent = false,
    this.highContrast = false,
    this.style = const TextStyler.create(),
  });

  final UiTextSize? size;

  final UiTextWeight? weight;

  final TextAlign? align;

  final bool softWrap;

  final bool truncate;

  final bool accent;

  final bool highContrast;

  final TextStyler style;

  final String text;

  @override
  Widget build(BuildContext _) {
    return uiTextStyle(
      size: size,
      weight: weight,
      align: align,
      softWrap: softWrap,
      truncate: truncate,
      accent: accent,
      highContrast: highContrast,
      style: style,
    ).call(text, key: key);
  }
}
