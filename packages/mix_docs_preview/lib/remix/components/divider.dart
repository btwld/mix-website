/// RemixDivider Example
///
/// Horizontal Fortal divider.

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
      child: const DividerPreview(),
    );
  }
}

class DividerPreview extends StatelessWidget {
  const DividerPreview({super.key});

  @override
  Widget build(BuildContext context) {
    return SizedBox(width: 300, child: const FortalDivider());
  }
}
