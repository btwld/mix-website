import 'package:flutter/material.dart';

class _ExampleApp extends StatelessWidget {
  final Widget child;

  const _ExampleApp({required this.child});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      // Match the dark host container (#1a1a2e) so demos that only render a
      // small centered widget (menu, tooltip, select, etc.) don't show a
      // light-grey Scaffold behind them.
      home: Scaffold(
        backgroundColor: const Color(0xFF1A1A2E),
        body: Center(child: child),
      ),
    );
  }
}

void runMixApp(Widget child) {
  runApp(_ExampleApp(child: child));
}
