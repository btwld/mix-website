/// RemixAvatar Example
///
/// Three avatar styles — initials, icon, and image.
/// Inspired by gov.br — https://www.gov.br/ds/components/avatar

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
      child: const AvatarPreview(),
    );
  }
}

class AvatarPreview extends StatelessWidget {
  const AvatarPreview({super.key});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: .center,
      mainAxisSize: .min,
      spacing: 16,
      children: [
        const FortalAvatar.soft(label: 'LF'),
        const FortalAvatar.solid(icon: Icons.person),
      ],
    );
  }
}
