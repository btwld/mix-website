/// RemixAccordion Example
///
/// Collapsible FAQ list built from [RemixAccordion] items inside a group.
/// Inspired by alignui — https://www.alignui.com/docs/v1.2/ui/accordion

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
      child: const AccordionPreview(),
    );
  }
}

class AccordionPreview extends StatefulWidget {
  const AccordionPreview({super.key});

  @override
  State<AccordionPreview> createState() => _AccordionPreviewState();
}

class _AccordionPreviewState extends State<AccordionPreview> {
  final controller = RemixAccordionController<String>(min: 0, max: 1);

  @override
  void dispose() {
    controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 400,
      child: FlexBox(
        style: FlexBoxStyler()
            .direction(.vertical)
            .spacing(24)
            .mainAxisSize(.min),
        children: [
          RemixAccordionGroup(
            controller: controller,
            child: ColumnBox(
              style: FlexBoxStyler.spacing(16),
              children: [
                FortalAccordion.surface(
                  value: 'accordion1',
                  title: 'How do I update my account information?',
                  child: const Text(
                    'Insert the accordion description here. It would look better as two lines of text.',
                  ),
                ),
                FortalAccordion.soft(
                  value: 'accordion2',
                  title: 'What payment methods are accepted?',
                  child: const Text(
                    'Major credit and debit cards like Visa, MasterCard, and American Express, as well as digital payment options like PayPal and Apple Pay.',
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
