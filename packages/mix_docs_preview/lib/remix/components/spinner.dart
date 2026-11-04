/// RemixSpinner Example
///
/// Fortal spinners in three sizes.

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
      child: const SpinnerPreview(),
    );
  }
}

class SpinnerPreview extends StatelessWidget {
  const SpinnerPreview({super.key});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: .center,
      mainAxisSize: .min,
      spacing: 16,
      children: const [
        FortalSpinner(size: .size1),
        FortalSpinner(size: .size2),
        FortalSpinner(size: .size3),
      ],
    );
  }
}
