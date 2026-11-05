/// RemixSwitch Example
///
/// Fortal toggle switch.

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
      child: const SwitchPreview(),
    );
  }
}

class SwitchPreview extends StatefulWidget {
  const SwitchPreview({super.key});

  @override
  State<SwitchPreview> createState() => _SwitchPreviewState();
}

class _SwitchPreviewState extends State<SwitchPreview> {
  bool _selected = false;

  @override
  Widget build(BuildContext context) {
    return FortalSwitch.surface(
      selected: _selected,
      onChanged: (value) {
        setState(() {
          _selected = value;
        });
      },
    );
  }
}
