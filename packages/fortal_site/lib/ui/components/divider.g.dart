// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'divider.dart';

// **************************************************************************
// MixWidgetGenerator
// **************************************************************************

/// Ui-themed preset for [RemixDivider].
class UiDivider extends StatelessWidget {
  const UiDivider({
    super.key,
    this.size = .size1,
    this.orientation = Axis.horizontal,
    this.style = const DividerStyler.create(),
  });

  final UiDividerSize size;

  final Axis orientation;

  final DividerStyler style;

  @override
  Widget build(BuildContext _) {
    return RemixDivider(
      key: key,
      style: uiDividerStyle(size: size, orientation: orientation, style: style),
    );
  }
}
