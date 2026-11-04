library;

import 'package:flutter/material.dart';
import 'package:mix/mix.dart';

import 'package:mix_docs_preview/helpers.dart';

void main() {
  runMixApp(const Example());
}

class Example extends StatelessWidget {
  const Example({super.key});

  @override
  Widget build(BuildContext context) {
    // #docregion showcase
    final title = TextStyler()
        .fontSize(20)
        .fontWeight(.w700)
        .color(Colors.white)
        .uppercase();

    return title('hello world');
    // #enddocregion showcase
  }
}
