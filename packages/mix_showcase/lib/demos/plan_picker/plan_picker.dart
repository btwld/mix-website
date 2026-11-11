import 'package:flutter/widgets.dart';
import 'package:mix/mix.dart';
import 'package:naked_ui/naked_ui.dart';

import '../plans.dart';

/// How one option is drawn. Naked UI passes the state; the rest is yours.
typedef PlanBuilder =
    Widget Function(
      Plan plan,
      NakedRadioState<String> state,
    );

/// A radio group of plans. Naked UI supplies the behavior; [builder]
/// draws each option and [layout] places them:
///
/// ```dart
/// PlanPicker(
///   plan: plan,
///   onChanged: choose,
///   layout: planRows,
///   builder: planRow,
/// )
/// ```
class PlanPicker extends StatelessWidget {
  const PlanPicker({
    super.key,
    required this.plan,
    required this.onChanged,
    required this.layout,
    required this.builder,
  });

  final String plan;
  final ValueChanged<String> onChanged;
  final FlexBoxStyler layout;
  final PlanBuilder builder;

  @override
  Widget build(BuildContext context) {
    // Selection, arrow keys, focus and semantics come from the group.
    return NakedRadioGroup<String>(
      groupValue: plan,
      onChanged: (next) => onChanged(next ?? plan),
      semanticLabel: 'Plan',
      child: layout(
        children: [
          for (final plan in plans)
            NakedRadio<String>(
              value: plan.name,
              builder: (context, state, child) =>
                  builder(plan, state),
            ),
        ],
      ),
    );
  }
}
