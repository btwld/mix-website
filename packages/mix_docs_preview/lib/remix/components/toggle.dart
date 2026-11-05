/// RemixToggle Example
///
/// Stateful Fortal formatting toggles.

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
      child: const TogglePreview(),
    );
  }
}

class TogglePreview extends StatefulWidget {
  const TogglePreview({super.key});

  @override
  State<TogglePreview> createState() => _TogglePreviewState();
}

class _TogglePreviewState extends State<TogglePreview> {
  bool _bold = false;
  bool _italic = false;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: .min,
      spacing: 8,
      children: [
        FortalToggle.ghost(
          selected: _bold,
          onChanged: (value) => setState(() => _bold = value),
          icon: Icons.format_bold,
          semanticLabel: 'Bold',
        ),
        FortalToggle.outline(
          selected: _italic,
          onChanged: (value) => setState(() => _italic = value),
          icon: Icons.format_italic,
          semanticLabel: 'Italic',
        ),
      ],
    );
  }
}
