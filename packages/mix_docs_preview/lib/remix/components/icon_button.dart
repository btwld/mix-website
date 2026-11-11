/// RemixIconButton Example
///
/// Fortal icon button variants — solid, soft, surface, outline, and ghost.

library;

import 'package:flutter/cupertino.dart';
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
      child: Row(
        mainAxisAlignment: .center,
        mainAxisSize: .min,
        spacing: 16,
        children: [
          FortalIconButton.solid(icon: CupertinoIcons.heart, onPressed: () {}),
          FortalIconButton.soft(icon: CupertinoIcons.heart, onPressed: () {}),
          FortalIconButton.surface(
            icon: CupertinoIcons.heart,
            onPressed: () {},
          ),
          FortalIconButton.outline(
            icon: CupertinoIcons.heart,
            onPressed: () {},
          ),
          FortalIconButton.ghost(icon: CupertinoIcons.heart, onPressed: () {}),
        ],
      ),
    );
  }
}
