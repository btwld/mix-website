library;

import 'package:flutter/material.dart';
import 'package:mix/mix.dart';
import 'package:mix_docs_preview/helpers.dart';

void main() {
  runMixApp(const Example());
}

class Example extends StatelessWidget {
  const Example({super.key});

  @override
  Widget build(BuildContext context) {
    // #docregion showcase
    final buttonStyle = BoxStyler()
        .height(40)
        .padding(.horizontal(14))
        .borderRadius(.circular(10))
        .alignment(.center)
        .animate(.easeInOut(180.ms))
        .scale(1)
        .onPressed(.scale(0.95))
        .textStyle(.fontSize(14).fontWeight(.w600).color(Colors.white));

    final solidButtonStyle = buttonStyle
        .color(Colors.deepPurpleAccent)
        .textStyle(.fontSize(14).fontWeight(.w600).color(Colors.white));

    final outlinedButtonStyle = buttonStyle
        .border(.color(Colors.deepPurpleAccent).width(1.5))
        .textStyle(
          .fontSize(14).fontWeight(.w600).color(Colors.deepPurpleAccent),
        );

    return Center(
      child: Row(
        mainAxisSize: .min,
        children: [
          Pressable(
            onPress: () {},
            child: solidButtonStyle(child: StyledText('Solid')),
          ),
          const SizedBox(width: 12),
          Pressable(
            onPress: () {},
            child: outlinedButtonStyle(child: StyledText('Outlined')),
          ),
        ],
      ),
    );
    // #enddocregion showcase
  }
}
