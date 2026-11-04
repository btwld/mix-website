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
      child: const TextFieldPreview(),
    );
  }
}

class TextFieldPreview extends StatefulWidget {
  const TextFieldPreview({super.key});

  @override
  State<TextFieldPreview> createState() => _TextFieldPreviewState();
}

class _TextFieldPreviewState extends State<TextFieldPreview> {
  final controller = TextEditingController();

  @override
  void dispose() {
    controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 300,
      child: FortalTextField.surface(
        controller: controller,
        hintText: 'Placeholder',
        label: 'Label',
        helperText: 'Required field',
      ),
    );
  }
}
