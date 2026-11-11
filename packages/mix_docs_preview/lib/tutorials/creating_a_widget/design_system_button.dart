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
    final buttonStyle = BoxStyler()
        .padding(.symmetric(horizontal: 24, vertical: 12))
        .borderRadius(.circular(8));
    final labelStyle = TextStyler()
        .fontSize(16)
        .fontWeight(.w500)
        .color(Colors.white);

    return Column(
      mainAxisSize: .min,
      children: [
        _buildButton(
          label: 'Filled',
          boxStyle: buttonStyle.color(Colors.blueAccent),
          textStyle: labelStyle,
        ),
        const SizedBox(height: 12),
        _buildButton(
          label: 'Outlined',
          boxStyle: buttonStyle.border(.color(Colors.blueAccent).width(1.5)),
          textStyle: labelStyle.color(Colors.blueAccent),
        ),
        const SizedBox(height: 12),
        _buildButton(
          label: 'Elevated',
          boxStyle: buttonStyle
              .color(Colors.blueAccent)
              .shadow(
                .color(
                  Colors.blueAccent.shade700.withValues(alpha: 0.5),
                ).offset(x: 0, y: 4).blurRadius(8),
              ),
          textStyle: labelStyle,
        ),
        const SizedBox(height: 12),
        _buildButton(
          label: 'Link',
          boxStyle: buttonStyle,
          textStyle: labelStyle.color(Colors.blueAccent).decoration(.underline),
        ),
        const SizedBox(height: 12),
        Pressable(
          enabled: false,
          child: Box(
            style: buttonStyle.color(Colors.blueGrey.shade100),
            child: StyledText(
              'Disabled',
              style: labelStyle.color(Colors.blueGrey.shade700),
            ),
          ),
        ),
      ],
    );
  }
}
