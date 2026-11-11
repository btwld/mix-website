// dart format off
import 'package:flutter/widgets.dart';
import 'package:mix/mix.dart';

import '../upgrade_button/style.dart' show button;

enum Press { rest, squeeze, release }

// Every notification from `trigger` plays the phases once, in order.
BoxStyler confirm(Listenable trigger) {
  return button.phaseAnimation(
    trigger: trigger,
    phases: Press.values,
    styleBuilder: (phase, style) => switch (phase) {
      .rest => style.scale(1),
      .squeeze => style.scale(0.86),
      .release => style.scale(1.1),
    },
    configBuilder: (phase) => switch (phase) {
      .rest => .springWithDampingRatio(520.ms, ratio: 0.4),
      .squeeze => .easeOut(110.ms),
      .release => .easeOut(150.ms),
    },
  );
}
