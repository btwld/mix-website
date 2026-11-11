// ignore_for_file: avoid-passing-self-as-argument

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
    final flexStyle = StackBoxStyler(
      constraints: .square(100),
      stackAlignment: .bottomCenter,
    );

    final boxStyle = BoxStyler.color(Colors.deepOrange).size(100, 100);

    return StackBox(
      style: flexStyle,
      children: [
        Box(style: boxStyle),
        Box(style: BoxStyler.color(Colors.grey.shade300).size(100, 50)),
        Box(
          style: BoxStyler.color(
            Colors.black,
          ).size(100, 15).wrap(.align(alignment: .center)),
        ),
        Box(
          style: BoxStyler.color(Colors.grey.shade100)
              .size(100, 100)
              .border(.color(Colors.black).width(20))
              .wrap(.scale(x: 0.50, y: 0.50)),
        ),
      ],
    );
  }
}
