library;

import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:mix/mix.dart';
import 'package:mix_docs_preview/helpers.dart';

void main() {
  runMixApp(const Example());
}

class Example extends StatelessWidget {
  const Example({super.key});

  @override
  Widget build(BuildContext context) {
    // #docregion showcase
    final box = BoxStyler()
        .size(100, 100)
        .borderRadius(.circular(5))
        .keyframeAnimation(
          timeline: [
            KeyframeTrack<double>('scale', [
              .springWithBounce(1.5, 750.ms, bounce: 0.45),
              .linear(1.5, 750.ms),
              .springWithBounce(1.0, 1050.ms, bounce: 0.35),
              .linear(1.0, 450.ms),
              .linear(1.0, 600.ms),
            ], initial: 1.0),
            KeyframeTrack<double>('rotate', [
              .linear(0.0, 600.ms),
              .springWithBounce(180.0, 900.ms, bounce: 0.4),
              .linear(180.0, 900.ms),
              .springWithBounce(0.0, 600.ms, bounce: 0.4),
              .linear(0.0, 600.ms),
            ], initial: 0.0),
            KeyframeTrack<double>('radius', [
              .linear(5.0, 600.ms),
              .springWithBounce(50.0, 900.ms, bounce: 0.3),
              .linear(50.0, 900.ms),
              .springWithBounce(5.0, 600.ms, bounce: 0.3),
              .linear(5.0, 600.ms),
            ], initial: 5.0),
            KeyframeTrack<Color>(
              'color',
              [
                .easeInOut(Colors.deepPurple.shade900, 750.ms),
                .linear(Colors.deepPurple.shade900, 750.ms),
                .easeInOut(Colors.deepPurple.shade300, 1050.ms),
                .linear(Colors.deepPurple.shade300, 450.ms),
                .linear(Colors.deepPurple.shade300, 600.ms),
              ],
              initial: Colors.deepPurple.shade300,
              tweenBuilder: ColorTween.new,
            ),
          ],
          styleBuilder: (values, style) {
            final scale = values.get('scale');
            final rotate = values.get('rotate');
            final radius = values.get('radius');
            return style
                .color(values.get('color'))
                .rotate(rotate * math.pi / 180)
                .scale(scale)
                .borderRadius(.circular(radius));
          },
        );

    return box();
    // #enddocregion showcase
  }
}
