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
    final styleA = BoxStyler()
        .color(Colors.red)
        .height(100)
        .width(100)
        .borderRadius(.circular(10))
        .onHovered(.color(Colors.blue).width(200));

    final styleB = styleA.onHovered(.color(Colors.green));

    return Row(
      mainAxisAlignment: .center,
      children: [
        Column(
          mainAxisSize: .min,
          children: [
            Box(style: styleA),
            SizedBox(height: 8),
            Text('styleA', style: TextStyle(fontSize: 12)),
          ],
        ),
        SizedBox(width: 16),
        Column(
          mainAxisSize: .min,
          children: [
            Box(style: styleB),
            SizedBox(height: 8),
            Text('styleB', style: TextStyle(fontSize: 12)),
          ],
        ),
      ],
    );
  }
}
