import 'package:flutter/widgets.dart';

import '../plan_card/plan_card.dart';
import '../plans.dart';
import 'style.dart';

/// Every plan, placed by [planGrid].
class PlanList extends StatelessWidget {
  const PlanList({super.key});

  @override
  Widget build(BuildContext context) {
    return planGrid(
      children: [
        for (final plan in plans)
          PlanCard(
            plan: plan,
            highlight: plan.name == 'Pro',
          ),
      ],
    );
  }
}
