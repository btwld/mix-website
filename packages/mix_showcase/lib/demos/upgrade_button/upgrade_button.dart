import 'package:flutter/widgets.dart';
import 'package:mix/mix.dart';

import 'style.dart';

/// The first example: one style, made pressable, around a label.
class UpgradeButton extends StatelessWidget {
  const UpgradeButton({super.key, required this.onPress});

  final VoidCallback onPress;

  @override
  Widget build(BuildContext context) {
    return button.pressable(
      onPress: onPress,
      child: label('Upgrade to Pro'),
    );
  }
}
