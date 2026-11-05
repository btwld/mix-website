/// RemixToggleGroup Example
///
/// Fortal single-select view switcher.

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
      child: const ToggleGroupPreview(),
    );
  }
}

class ToggleGroupPreview extends StatefulWidget {
  const ToggleGroupPreview({super.key});

  @override
  State<ToggleGroupPreview> createState() => _ToggleGroupPreviewState();
}

class _ToggleGroupPreviewState extends State<ToggleGroupPreview> {
  String? _value = 'list';

  @override
  Widget build(BuildContext context) {
    return FortalToggleGroup<String>.surface(
      items: const [
        RemixToggleGroupItem(
          value: 'list',
          label: 'List',
          icon: Icons.view_list,
        ),
        RemixToggleGroupItem(
          value: 'grid',
          label: 'Grid',
          icon: Icons.grid_view,
        ),
        RemixToggleGroupItem(
          value: 'board',
          label: 'Board',
          icon: Icons.view_kanban,
        ),
      ],
      selectedValue: _value,
      onChanged: (value) => setState(() => _value = value),
      semanticLabel: 'View style',
    );
  }
}
