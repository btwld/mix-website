import 'package:flutter/widgets.dart';
import 'package:mix/mix.dart';

import 'style.dart';

/// A switch whose track and thumb animate with [motion].
class Toggle extends StatelessWidget {
  const Toggle({
    super.key,
    required this.on,
    required this.onChanged,
    required this.motion,
    required this.label,
  });

  final bool on;
  final ValueChanged<bool> onChanged;
  final AnimationConfig motion;

  /// What the switch controls, for screen readers.
  final String label;

  @override
  Widget build(BuildContext context) {
    // .pressable() is announced as a button; this adds the on/off state.
    return Semantics(
      toggled: on,
      child: track(on: on, motion: motion).pressable(
        onPress: () => onChanged(!on),
        semanticsLabel: label,
        child: thumb(),
      ),
    );
  }
}
