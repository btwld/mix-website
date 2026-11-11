import 'package:flutter/widgets.dart';
import 'package:mix/mix.dart';

void main() => runApp(const App());

const purple = Color(0xFF6D4AFF);
const white = Color(0xFFFFFFFF);

final button = BoxStyler()
    .color(purple)
    .padding(.symmetric(horizontal: 20, vertical: 12))
    .borderRadius(.circular(10))
    .onHovered(.scale(1.04))
    .onPressed(.scale(0.96))
    .animate(.easeOut(150.ms));

final label = TextStyler()
    .fontSize(14)
    .fontWeight(.w600)
    .color(white);

class App extends StatelessWidget {
  const App({super.key});

  @override
  Widget build(BuildContext context) {
    return WidgetsApp(
      color: purple,
      builder: (context, child) => Center(
        child: button.pressable(
          onPress: () => debugPrint('Pressed'),
          child: label('Hello, Mix'),
        ),
      ),
    );
  }
}
