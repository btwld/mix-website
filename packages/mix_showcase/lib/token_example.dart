// #docregion token-example
import 'package:flutter/material.dart';
import 'package:mix/mix.dart';

void main() => runApp(const TokenExample());

// 1. Declare semantic tokens, then write styles against their references.
const $panelColor = ColorToken('example.panel');
const $panelPadding = SpaceToken('example.padding');
const $panelText = TextStyleToken('example.text');

final panelStyle = BoxStyler()
    .color($panelColor())
    .padding(.all($panelPadding()));
final panelTextStyle = TextStyler().style($panelText.mix()).color(Colors.white);

class TokenExample extends StatefulWidget {
  const TokenExample({super.key});

  @override
  State<TokenExample> createState() => _TokenExampleState();
}

class _TokenExampleState extends State<TokenExample> {
  bool roomy = false;

  @override
  Widget build(BuildContext context) => MaterialApp(
    home: Scaffold(
      body: Center(
        child: Column(
          mainAxisSize: .min,
          children: [
            // 2. Provide concrete values above every token-consuming widget.
            // Updating this scope changes values, not the styles or panel.
            MixScope(
              colors: {$panelColor: roomy ? Colors.teal : Colors.indigo},
              spaces: {$panelPadding: roomy ? 32 : 16},
              textStyles: {
                $panelText: TextStyle(
                  fontSize: roomy ? 22 : 16,
                  fontWeight: roomy ? .w700 : .w400,
                ),
              },
              child: const TokenPanel(),
            ),
            const SizedBox(height: 24),
            FilledButton(
              onPressed: () => setState(() => roomy = !roomy),
              child: const Text('Switch look'),
            ),
          ],
        ),
      ),
    ),
  );
}

// 3. Consume the same styles. Mix resolves tokens from the nearest MixScope.
// This const widget stays mounted when the button updates the scope values.
class TokenPanel extends StatelessWidget {
  const TokenPanel({super.key});

  @override
  Widget build(BuildContext context) => Box(
    style: panelStyle,
    child: StyledText('Same widget. New values.', style: panelTextStyle),
  );
}
// #enddocregion token-example
