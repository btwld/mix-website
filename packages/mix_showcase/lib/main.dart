import 'package:flutter/material.dart';
import 'package:naked_ui/naked_ui.dart';
import 'package:remix/remix.dart';

import 'app.dart';
import 'bridge.dart';
import 'showcase.dart';
import 'styles.dart';
import 'tokens.dart';

void main() {
  prepareHost();
  final showcase = Showcase();
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
        builder: (context, child) {
          final look = showcase.activeLook;
          final tint = showcase.naked
              ? look.accent
              : showcase.accent ?? look.accent;
          final brightness = ThemeData.estimateBrightnessForColor(look.canvas);
          return lookScope(
            look,
            accent: showcase.naked ? null : showcase.accent,
            corner: showcase.naked ? null : showcase.corner,
            flat: showcase.flat,
            child: MaterialApp(
              debugShowCheckedModeBanner: false,
              title: 'Mix — Flutter UI, your way',
              color: const Color(0xFF0D0B14),
              theme: ThemeData(
                colorScheme: ColorScheme.fromSeed(
                  seedColor: tint,
                  brightness: brightness,
                ).copyWith(primary: tint, onPrimary: look.onAccent),
              ),
              themeAnimationDuration: showcase.reduceMotion
                  ? Duration.zero
                  : kThemeAnimationDuration,
              builder: (context, child) => MediaQuery(
                data: MediaQuery.of(context).copyWith(
                  disableAnimations:
                      showcase.reduceMotion ||
                      MediaQuery.disableAnimationsOf(context),
                ),
                child: DefaultTextStyle(
                  style: const TextStyle(decoration: TextDecoration.none),
                  child: Overlay.wrap(
                    child: RemixToastScope(
                      style: toastStyle,
                      inset: const EdgeInsets.all(16),
                      child: NakedToastScope<String>(
                        inset: const EdgeInsets.all(16),
                        toastBuilder: (context, toast, animation) => Text(
                          toast.data,
                          style: const TextStyle(
                            fontFamily: 'GeistMono',
                            fontSize: 13,
                            color: Color(0xFFFFFFFF),
                            backgroundColor: Color(0xFF121217),
                          ),
                        ),
                        child: child!,
                      ),
                    ),
                  ),
                ),
              ),
              home: const AppFrame(),
            ),
          );
        },
      ),
    );
  }
}
