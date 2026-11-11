// dart format off
import 'package:flutter/widgets.dart';
import 'package:mix/mix.dart';
import 'package:naked_ui/naked_ui.dart';

import '../../colors.dart';
import '../plan_card/style.dart' show planNote;
import '../plans.dart';
import '../upgrade_button/style.dart' show label;

// Drawing one: the plans stacked, each a bordered row with a radio dot.
final planRows = FlexBoxStyler()
    .column()
    .mainAxisSize(.min)
    .spacing(8);

Widget planRow(Plan plan, NakedRadioState<String> state) {
  // A ring for keyboard focus only, by the rule onFocusVisible uses.
  final keyboard = state.isFocused && FocusVisibility.isVisible;
  final edge = keyboard ? white : state.isSelected ? purple : slate;
  final ring = state.isSelected ? purple : grey;
  final row = FlexBoxStyler()
      .row()
      .spacing(12)
      .width(260)
      .padding(.symmetric(horizontal: 16, vertical: 13))
      .borderRadius(.circular(12))
      .color(state.isHovered ? graphite : charcoal)
      .border(
        .color(edge)
        .width(1.5),
      )
      .scale(state.isPressed ? 0.98 : 1)
      .animate(.easeOut(120.ms));
  final dot = BoxStyler()
      .size(16, 16)
      .borderRadius(.circular(8))
      .border(
        .color(ring)
        .width(state.isSelected ? 5 : 1.5),
      )
      .animate(.easeOut(120.ms));

  return row(
    children: [
      dot(),
      Expanded(child: label(plan.name)),
      planNote(plan.price),
    ],
  );
}
