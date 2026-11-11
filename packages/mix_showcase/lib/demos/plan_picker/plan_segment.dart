// dart format off
import 'package:flutter/widgets.dart';
import 'package:mix/mix.dart';
import 'package:naked_ui/naked_ui.dart';

import '../../colors.dart';
import '../plans.dart';
import '../upgrade_button/style.dart' show label;

// Drawing two: the same group as one segmented bar.
final planBar = FlexBoxStyler()
    .row()
    .mainAxisSize(.min)
    .padding(.all(4))
    .color(charcoal)
    .borderRadius(.circular(12))
    .border(
      .color(slate)
      .width(1.5),
    );

Widget planSegment(
  Plan plan,
  NakedRadioState<String> state,
) {
  // A ring for keyboard focus only, by the rule onFocusVisible uses.
  final keyboard = state.isFocused && FocusVisibility.isVisible;
  final segment = BoxStyler()
      .padding(.symmetric(horizontal: 20, vertical: 12))
      .borderRadius(.circular(12))
      .border(
        .color(keyboard ? white : clear)
        .width(2),
      )
      .color(
        state.when(
          selected: purple,
          hovered: graphite,
          orElse: charcoal,
        ),
      )
      .animate(.easeOut(140.ms));

  return segment(child: label(plan.name));
}
