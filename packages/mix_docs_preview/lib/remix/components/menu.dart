/// RemixMenu Example
///
/// Fortal dropdown menu with menu items and a divider.

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
      child: const MenuPreview(),
    );
  }
}

class MenuPreview extends StatefulWidget {
  const MenuPreview({super.key});

  @override
  State<MenuPreview> createState() => _MenuPreviewState();
}

class _MenuPreviewState extends State<MenuPreview> {
  final controller = MenuController();

  @override
  Widget build(BuildContext context) {
    return FortalMenu<String>.soft(
      trigger: const RemixMenuTrigger(label: 'Open Menu'),
      items: [
        RemixMenuItem(
          value: 'History',
          leadingIcon: Icons.history,
          label: 'History',
        ),
        RemixMenuItem(
          value: 'Settings',
          leadingIcon: Icons.settings,
          label: 'Settings',
        ),
        const RemixMenuDivider(),
        RemixMenuItem(
          value: 'Logout',
          leadingIcon: Icons.logout,
          label: 'Logout',
        ),
      ],
      onSelected: (_) {},
      controller: controller,
    );
  }
}
