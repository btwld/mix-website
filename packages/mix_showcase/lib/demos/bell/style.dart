// dart format off
import 'package:flutter/widgets.dart';
import 'package:mix/mix.dart';

import '../../colors.dart';

// Tracks run in parallel. Each one moves a single value along its own timeline.
BoxStyler bell(Listenable trigger) {
  return BoxStyler()
      .size(64, 64)
      .alignment(.center)
      .color(charcoal)
      .border(
        .color(slate)
        .width(1.5),
      )
      .borderRadius(.circular(32))
      .keyframeAnimation(
        trigger: trigger,
        timeline: [
          KeyframeTrack<double>('angle', [
            .easeOut(0.35, 90.ms),
            .easeInOut(-0.3, 140.ms),
            .easeInOut(0.2, 130.ms),
            .easeInOut(-0.1, 120.ms),
            .easeOut(0, 110.ms),
          ], initial: 0),
          KeyframeTrack<double>('scale', [
            .easeOut(1.18, 160.ms),
            .elasticOut(1, 430.ms),
          ], initial: 1),
        ],
        styleBuilder: (values, style) => style
            .rotate(values.get('angle'))
            .scale(values.get('scale')),
      );
}

final bellIcon = IconStyler()
    .size(28)
    .color(white);
