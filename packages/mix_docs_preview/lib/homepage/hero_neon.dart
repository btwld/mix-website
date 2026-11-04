/// Landing hero — Neon Remix button style (cyberpunk glow).
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
        .color(Colors.black)
        .labelColor(Colors.cyanAccent.shade400)
        .paddingX(24)
        .paddingY(11)
        .borderRadius(.circular(2))
        .border(.color(Colors.cyanAccent.shade400).width(1))
        .shadow(.color(Colors.purpleAccent.shade400).blurRadius(22));
    // #enddocregion style

    return RemixButton(label: 'GET STARTED', onPressed: () {}, style: style);
  }
}
