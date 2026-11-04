/// Landing hero — Gradient Remix button style (linear gradient fill).
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
    return FortalScope(brightness: .dark, child: const _HeroButton());
  }
}

class _HeroButton extends StatelessWidget {
  const _HeroButton();

  @override
  Widget build(BuildContext context) {
    // #docregion style
    final style = ButtonStyler()
        .linearGradient(
          begin: .topLeft,
          end: .bottomRight,
          colors: [
            Colors.greenAccent.shade400,
            Colors.deepPurpleAccent.shade200,
          ],
        )
        .labelColor(Colors.black)
        .paddingX(22)
        .paddingY(11)
        .borderRadius(.circular(12));
    // #enddocregion style

    return RemixButton(label: 'Get started', onPressed: () {}, style: style);
  }
}
