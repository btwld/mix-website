/// RemixTooltip Example
///
/// Fortal tooltip shown on hover over a Fortal button.

library;

import 'package:flutter/material.dart';
import 'package:mix_docs_preview/helpers.dart';
import 'package:remix/remix.dart';

void main() {
  runMixApp(const Example());
}

class Example extends StatelessWidget {
  const Example({super.key});

  @override
  Widget build(BuildContext context) {
    return FortalScope(
      accent: .green,
      brightness: .dark,
      child: const TooltipPreview(),
    );
  }
}

class TooltipPreview extends StatelessWidget {
  const TooltipPreview({super.key});

  @override
  Widget build(BuildContext context) {
    return FortalTooltip(
      tooltipChild: const Text('Fortal tooltip'),
      child: FortalButton.solid(onPressed: () {}, label: 'Hover me'),
    );
  }
}
