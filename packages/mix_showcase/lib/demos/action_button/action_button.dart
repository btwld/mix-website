import 'package:flutter/widgets.dart';
import 'package:mix/mix.dart';

import 'style.dart';

/// A button whose style changes with each interaction state.
class ActionButton extends StatelessWidget {
  const ActionButton({
    super.key,
    required this.label,
    this.onPress,
    this.controller,
  });

  final String label;

  /// Leave this out to disable the button.
  final VoidCallback? onPress;

  /// Optional. Lets the owner read the states, or set them.
  final WidgetStatesController? controller;

  @override
  Widget build(BuildContext context) {
    return action.pressable(
      onPress: onPress,
      enabled: onPress != null,
      controller: controller,
      child: actionLabel(label),
    );
  }
}
