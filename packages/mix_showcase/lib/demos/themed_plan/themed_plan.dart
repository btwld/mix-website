import 'package:flutter/widgets.dart';
import 'package:mix/mix.dart';

import 'style.dart';

/// A plan card and button that take every value from tokens.
class ThemedPlan extends StatelessWidget {
  const ThemedPlan({super.key, required this.onUpgrade});

  final VoidCallback onUpgrade;

  @override
  Widget build(BuildContext context) {
    return themedColumn(
      children: [
        themedCard(
          children: [
            themedName('Pro'),
            themedPrice(r'$12 / month'),
            themedNote('Unlimited projects'),
          ],
        ),
        themedButton.pressable(
          onPress: onUpgrade,
          child: themedLabel('Upgrade to Pro'),
        ),
      ],
    );
  }
}
