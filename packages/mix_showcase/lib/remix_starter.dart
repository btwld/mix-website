import 'package:flutter/widgets.dart';

import 'ui/ui.dart';

void main() => runApp(const App());

const black = Color(0xFF000000);

class App extends StatelessWidget {
  const App({super.key});

  @override
  Widget build(BuildContext context) {
    return WidgetsApp(
      color: black,
      // The theme goes here once. Every Ui widget below reads its values.
      builder: (context, child) => UiTheme(
        child: Center(
          child: UiButton(
            label: 'Save',
            onPressed: () => debugPrint('Saved'),
          ),
        ),
      ),
    );
  }
}
