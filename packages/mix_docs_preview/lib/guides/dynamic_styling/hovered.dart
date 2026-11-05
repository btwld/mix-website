import 'package:flutter/material.dart';
import 'package:mix/mix.dart';

import 'package:mix_docs_preview/helpers.dart';

void main() {
  runMixApp(Example());
}

class Example extends StatelessWidget {
  const Example({super.key});

  @override
  Widget build(BuildContext context) {
    final box = BoxStyler()
        .color(Colors.red)
        .height(100)
        .width(100)
        .borderRadius(.circular(10))
        .onHovered(.color(Colors.blue));

    return box();
  }
}
