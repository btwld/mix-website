import 'package:flutter/widgets.dart';
import 'package:mix/mix.dart';

import '../upgrade_button/style.dart' show label;
import 'style.dart';

/// A button that plays the [confirm] phases on each press.
class ConfirmButton extends StatefulWidget {
  const ConfirmButton({super.key});

  @override
  State<ConfirmButton> createState() =>
      _ConfirmButtonState();
}

class _ConfirmButtonState extends State<ConfirmButton> {
  final presses = ValueNotifier(0);
  late final style = confirm(presses);

  @override
  void dispose() {
    presses.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return style.pressable(
      onPress: () => presses.value++,
      child: label('Add to plan'),
    );
  }
}
