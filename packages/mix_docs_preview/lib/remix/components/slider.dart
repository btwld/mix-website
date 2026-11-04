/// RemixSlider Example
///
/// Fortal horizontal slider.

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
      child: const SliderPreview(),
    );
  }
}

class SliderPreview extends StatefulWidget {
  const SliderPreview({super.key});

  @override
  State<SliderPreview> createState() => _SliderPreviewState();
}

class _SliderPreviewState extends State<SliderPreview> {
  double _selectedValue = 0.3;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 300,
      child: FortalSlider.surface(
        value: _selectedValue,
        onChanged: (value) {
          setState(() {
            _selectedValue = value;
          });
        },
      ),
    );
  }
}
