/// RemixCallout Example
///
/// Fortal callout in the surface variant.

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
      child: const CalloutPreview(),
    );
  }
}

class CalloutPreview extends StatelessWidget {
  const CalloutPreview({super.key});

  @override
  Widget build(BuildContext context) {
    return const FortalCallout.surface(
      text: 'Callout important information for the user.',
      icon: Icons.info_outline,
    );
  }
}
