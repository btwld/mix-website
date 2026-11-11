// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'progress.dart';

// **************************************************************************
// MixWidgetGenerator
// **************************************************************************

/// Ui-themed preset for [RemixProgress].
class UiProgress extends StatelessWidget {
  const UiProgress({
    super.key,
    this.variant = .surface,
    this.size = .size2,
    this.highContrast = false,
    this.style = const ProgressStyler.create(),
    required this.value,
    this.semanticsLabel,
    this.semanticsValue,
  });

  const UiProgress.surface({
    super.key,
    this.size = .size2,
    this.highContrast = false,
    this.style = const ProgressStyler.create(),
    required this.value,
    this.semanticsLabel,
    this.semanticsValue,
  }) : variant = UiProgressVariant.surface;

  const UiProgress.soft({
    super.key,
    this.size = .size2,
    this.highContrast = false,
    this.style = const ProgressStyler.create(),
    required this.value,
    this.semanticsLabel,
    this.semanticsValue,
  }) : variant = UiProgressVariant.soft;

  final UiProgressVariant variant;

  final UiProgressSize size;

  final bool highContrast;

  final ProgressStyler style;

  final double value;

  final String? semanticsLabel;

  final String? semanticsValue;

  @override
  Widget build(BuildContext _) {
    return RemixProgress(
      key: key,
      style: uiProgressStyle(
        variant: variant,
        size: size,
        highContrast: highContrast,
        style: style,
      ),
      value: value,
      semanticsLabel: semanticsLabel,
      semanticsValue: semanticsValue,
    );
  }
}
