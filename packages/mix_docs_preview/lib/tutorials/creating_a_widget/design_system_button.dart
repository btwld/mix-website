/// Design system button gallery
///
/// Simplified button variants: Filled, Outlined, Elevated, Link, and Disabled.
/// Matches the creating-a-widget tutorial style.
library;

import 'package:flutter/material.dart';
import 'package:mix/mix.dart';

import 'package:mix_docs_preview/helpers.dart';

void main() {
  runMixApp(const Example());
}

class Example extends StatelessWidget {
  const Example({super.key});

  Widget _buildButton({
    required String label,
    required BoxStyler boxStyle,
    required TextStyler textStyle,
  }) {
    return Pressable(
      onPress: () {},
      child: Box(
        style: boxStyle.onPressed(.scale(0.96)),
        child: StyledText(label, style: textStyle),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: .min,
      children: [
        _buildButton(
          label: 'Filled',
          boxStyle: .color(
            Colors.blueAccent,
          ).padding(.horizontal(24).vertical(12)).borderRadius(.circular(8)),
          textStyle: .color(Colors.white).fontSize(16).fontWeight(.w500),
        ),
        const SizedBox(height: 12),
        _buildButton(
          label: 'Outlined',
          boxStyle: .color(Colors.transparent)
              .border(.color(Colors.blueAccent).width(1.5))
              .padding(.horizontal(24).vertical(12))
              .borderRadius(.circular(8)),
          textStyle: .color(Colors.blueAccent).fontSize(16).fontWeight(.w500),
        ),
        const SizedBox(height: 12),
        _buildButton(
          label: 'Elevated',
          boxStyle: .color(Colors.blueAccent)
              .padding(.horizontal(24).vertical(12))
              .borderRadius(.circular(8))
              .shadow(
                .color(
                  Colors.blueAccent.shade700.withValues(alpha: 0.5),
                ).offset(x: 0, y: 4).blurRadius(8),
              ),
          textStyle: .color(Colors.white).fontSize(16).fontWeight(.w500),
        ),
        const SizedBox(height: 12),
        _buildButton(
          label: 'Link',
          boxStyle: .color(
            Colors.transparent,
          ).padding(.horizontal(24).vertical(12)).borderRadius(.circular(8)),
          textStyle: .color(
            Colors.blueAccent,
          ).fontSize(16).fontWeight(.w500).decoration(.underline),
        ),
        const SizedBox(height: 12),
        Pressable(
          enabled: false,
          child: Box(
            style: BoxStyler()
                .color(Colors.blueGrey.shade100)
                .padding(.horizontal(24).vertical(12))
                .borderRadius(.circular(8)),
            child: StyledText(
              'Disabled',
              style: TextStyler()
                  .color(Colors.blueGrey.shade700)
                  .fontSize(16)
                  .fontWeight(.w500),
            ),
          ),
        ),
      ],
    );
  }
}
