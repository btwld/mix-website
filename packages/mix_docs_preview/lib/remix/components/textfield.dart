/// RemixTextField Example
///
/// Fortal text field with label and helper text.

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
      child: SizedBox(
        width: 300,
        child: FortalTextField.surface(
          hintText: 'Placeholder',
          label: 'Label',
          helperText: 'Required field',
        ),
      ),
    );
  }
}
