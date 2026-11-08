import 'package:flutter/material.dart';
import 'package:mix/mix.dart';

void main() => runApp(const TokenExample());

// Declare semantic keys, then write styles against their references.
const $surface = ColorToken('color.surface');
const $onSurface = ColorToken('color.onSurface');
const $gap = SpaceToken('space.gap');
const $body = TextStyleToken('text.body');

final card = BoxStyler()
    .color($surface())
    .padding(.all($gap()))
    .borderRadius(.circular(12))
    .border(.color($surface()).width(2))
    .onFocusVisible(.border(.color($onSurface()).width(2)));
final label = TextStyler().style($body.mix()).color($onSurface());

// Two value sets for the same keys, including matching foregrounds.
final quiet = (
  colors: {
    $surface: const Color(0xFFEEF2FF),
    $onSurface: const Color(0xFF312E81),
  },
  gap: 16.0,
  body: const TextStyle(fontSize: 16, fontWeight: FontWeight.w400),
);
final bold = (
  colors: {
    $surface: const Color(0xFF4338CA),
    $onSurface: const Color(0xFFFFFFFF),
  },
  gap: 32.0,
  body: const TextStyle(fontSize: 22, fontWeight: FontWeight.w700),
);

class TokenExample extends StatefulWidget {
  const TokenExample({super.key});

  @override
  State<TokenExample> createState() => _TokenExampleState();
}

class _TokenExampleState extends State<TokenExample> {
  bool useBold = false;

  @override
  Widget build(BuildContext context) {
    final values = useBold ? bold : quiet;
    // Provide values above the app. Only these values change, not the styles.
    return MixScope(
      colors: values.colors,
      spaces: {$gap: values.gap},
      textStyles: {$body: values.body},
      child: MaterialApp(
        home: Scaffold(
          body: Center(
            child: card.pressable(
              onPress: () => setState(() => useBold = !useBold),
              child: StyledText('Switch look', style: label),
            ),
          ),
        ),
      ),
    );
  }
}
