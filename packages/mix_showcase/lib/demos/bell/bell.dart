import 'package:flutter/material.dart' show Icons;
import 'package:flutter/widgets.dart';
import 'package:mix/mix.dart';

import 'style.dart';

/// A bell that rings on each press.
class Bell extends StatefulWidget {
  const Bell({super.key});

  @override
  State<Bell> createState() => _BellState();
}

class _BellState extends State<Bell> {
  final rings = ValueNotifier(0);
  late final style = bell(rings);

  @override
  void dispose() {
    rings.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return style.pressable(
      onPress: () => rings.value++,
      semanticsLabel: 'Ring',
      child: bellIcon(
        icon: Icons.notifications_none_rounded,
      ),
    );
  }
}
