import 'package:flutter/material.dart';

import 'app.dart';
import 'bridge.dart';
import 'showcase.dart';
import 'tokens.dart';

void main() {
  prepareHost();
  final showcase = Showcase(onEvent: sendEvent);
  runApp(ShowcaseApp(showcase: showcase));
  connectBridge(showcase.apply);
}

class ShowcaseApp extends StatelessWidget {
  const ShowcaseApp({super.key, required this.showcase});

  final Showcase showcase;

  @override
  Widget build(BuildContext context) {
    return ShowcaseScope(
      showcase: showcase,
      child: ListenableBuilder(
        listenable: showcase,
        builder: (context, child) => lookScope(
          showcase.activeLook,
          accent: showcase.naked ? null : showcase.accent,
          corner: showcase.naked ? null : showcase.corner,
          flat: showcase.flat,
          child: child!,
        ),
        child: MaterialApp(
          debugShowCheckedModeBanner: false,
          title: 'Launchpad',
          color: const Color(0xFF0D0B14),
          // Overlays such as the role menu sit under this too.
          builder: (context, child) => DefaultTextStyle(
            style: const TextStyle(decoration: TextDecoration.none),
            child: child!,
          ),
          home: const AppFrame(),
        ),
      ),
    );
  }
}
