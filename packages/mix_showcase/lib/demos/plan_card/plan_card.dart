import 'package:flutter/widgets.dart';

import '../plans.dart';
import 'style.dart';

/// A plan, drawn with [card], or with [featured] when [highlight] is on.
class PlanCard extends StatelessWidget {
  const PlanCard({
    super.key,
    required this.plan,
    this.highlight = false,
  });

  final Plan plan;
  final bool highlight;

  @override
  Widget build(BuildContext context) {
    final style = highlight ? featured : card;

    return style(
      children: [
        planName(plan.name),
        planPrice(plan.price),
        planNote(plan.note),
      ],
    );
  }
}
