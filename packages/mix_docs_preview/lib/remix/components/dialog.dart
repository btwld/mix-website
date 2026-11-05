/// RemixDialog Example
///
/// Fortal dialog opened from a Fortal button.

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
      child: const DialogPreview(),
    );
  }
}

class DialogPreview extends StatelessWidget {
  const DialogPreview({super.key});

  @override
  Widget build(BuildContext context) {
    return FortalButton.solid(
      label: 'Open dialog',
      onPressed: () {
        showRemixDialog<void>(
          context: context,
          builder: (dialogContext) => Center(
            child: FortalDialog(
              title: 'Save changes?',
              description: 'Your updates are ready to be saved.',
              actions: [
                FortalButton.ghost(
                  label: 'Cancel',
                  onPressed: () => Navigator.pop(dialogContext),
                ),
                FortalButton.solid(
                  label: 'Save',
                  onPressed: () => Navigator.pop(dialogContext),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
