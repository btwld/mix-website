/// RemixCheckbox Example
///
/// Stateful Fortal checkbox.

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
      child: const CheckboxPreview(),
    );
  }
}

class CheckboxPreview extends StatefulWidget {
  const CheckboxPreview({super.key});

  @override
  State<CheckboxPreview> createState() => _CheckboxPreviewState();
}

class _CheckboxPreviewState extends State<CheckboxPreview> {
  bool _isChecked = true;

  @override
  Widget build(BuildContext context) {
    return FortalCheckbox.surface(
      selected: _isChecked,
      onChanged: (value) {
        setState(() {
          _isChecked = value ?? false;
        });
      },
    );
  }
}
