/// RemixPopover Example
///
/// Fortal popover with account details.

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
      child: const PopoverPreview(),
    );
  }
}

class PopoverPreview extends StatelessWidget {
  const PopoverPreview({super.key});

  @override
  Widget build(BuildContext context) {
    return FortalPopover(
      semanticLabel: 'Show account details',
      positioning: const OverlayPositionConfig(
        targetAnchor: .bottomCenter,
        followerAnchor: .topCenter,
        offset: .new(0, 8),
      ),
      popoverChild: const SizedBox(
        width: 220,
        child: Column(
          mainAxisSize: .min,
          crossAxisAlignment: .start,
          children: [
            Text('Signed in as'),
            SizedBox(height: 8),
            Text('person@example.com'),
          ],
        ),
      ),
      child: const Padding(
        padding: .symmetric(horizontal: 16, vertical: 10),
        child: Text('Account'),
      ),
    );
  }
}
