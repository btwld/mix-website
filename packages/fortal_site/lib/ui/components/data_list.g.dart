// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'data_list.dart';

// **************************************************************************
// MixWidgetGenerator
// **************************************************************************

/// Ui recipe for [RemixDataList].
class UiDataList extends StatelessWidget {
  const UiDataList({
    super.key,
    this.size = .size2,
    this.highContrast = false,
    this.style = const DataListStyler.create(),
    required this.items,
    this.orientation = Axis.horizontal,
    this.semanticLabel,
    this.excludeSemantics = false,
  });

  final UiDataListSize size;

  final bool highContrast;

  final DataListStyler style;

  final List<RemixDataListItem> items;

  final Axis orientation;

  final String? semanticLabel;

  final bool excludeSemantics;

  @override
  Widget build(BuildContext _) {
    return RemixDataList(
      key: key,
      style: uiDataListStyle(
        size: size,
        highContrast: highContrast,
        style: style,
      ),
      items: items,
      orientation: orientation,
      semanticLabel: semanticLabel,
      excludeSemantics: excludeSemantics,
    );
  }
}
