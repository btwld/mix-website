import 'package:flutter/widgets.dart';
import 'package:naked_ui/naked_ui.dart';

void main() => runApp(const App());

const purple = Color(0xFF6D4AFF);
const white = Color(0xFFFFFFFF);
const grey = Color(0xFF8A8A99);
const clear = Color(0x00000000);

class App extends StatefulWidget {
  const App({super.key});

  @override
  State<App> createState() => _AppState();
}

class _AppState extends State<App> {
  bool checked = false;

  @override
  Widget build(BuildContext context) {
    return WidgetsApp(
      color: purple,
      builder: (context, child) => Center(
        // Tap, Space, focus and semantics are handled. You draw the box.
        child: NakedCheckbox(
          value: checked,
          onChanged: (value) =>
              setState(() => checked = value ?? false),
          builder: (context, state, child) => Row(
            mainAxisSize: MainAxisSize.min,
            spacing: 10,
            children: [
              Container(
                width: 22,
                height: 22,
                decoration: BoxDecoration(
                  color: state.isChecked == true
                      ? purple
                      : clear,
                  borderRadius: BorderRadius.circular(6),
                  border: Border.all(
                    width: 2,
                    color: state.isFocused ? white : grey,
                  ),
                ),
              ),
              const Text('Email me updates'),
            ],
          ),
        ),
      ),
    );
  }
}
