// dart format off
import 'package:mix/mix.dart';
import 'package:naked_ui/naked_ui.dart';

import '../../colors.dart';

FlexBoxStyler selectTrigger(
  NakedSelectState<String> state,
) {
  final active = state.isOpen || state.isFocused;
  return FlexBoxStyler()
      .row()
      .width(220)
      .padding(.symmetric(horizontal: 16, vertical: 12))
      .borderRadius(.circular(12))
      .color(state.isHovered ? graphite : charcoal)
      .border(
        .color(active ? purple : slate)
        .width(1.5),
      )
      .animate(.easeOut(120.ms));
}

final selectMenu = FlexBoxStyler()
    .column()
    .mainAxisSize(.min)
    .width(220)
    .padding(.all(4))
    .color(charcoal)
    .borderRadius(.circular(12))
    .border(
      .color(slate)
      .width(1.5),
    )
    .shadow(
      .color(shadow)
      .blurRadius(24)
      .offset(x: 0, y: 12),
    );

FlexBoxStyler selectOption(
  NakedSelectOptionState<String> state,
) => FlexBoxStyler()
    .row()
    .padding(.symmetric(horizontal: 12, vertical: 10))
    .borderRadius(.circular(12))
    .color(
      state.isHovered || state.isFocused
          ? graphite
          : charcoal,
    );

final chevron = IconStyler()
    .size(18)
    .color(grey);
final checkMark = IconStyler()
    .size(16)
    .color(purple);
