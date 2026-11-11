import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mix_showcase/theme.dart';

/// Pumps [child] centered under a [ThemeScope] and an [Overlay].
Future<void> pumpUnder(
  WidgetTester tester,
  Widget child, {
  ThemeValues? theme,
}) {
  return tester.pumpWidget(
    ThemeScope(
      theme: theme ?? midnight,
      child: WidgetsApp(
        color: const Color(0xFF000000),
        builder: (context, _) =>
            Overlay.wrap(child: Center(child: child)),
      ),
    ),
  );
}

/// Taps the center of the first widget matching [finder] with a mouse-free
/// touch pointer and lets animations finish.
Future<void> tapAndSettle(
  WidgetTester tester,
  Finder finder,
) async {
  await tester.tap(finder);
  await tester.pumpAndSettle();
}

/// Gives keyboard focus to the nearest focus node above [finder]'s widget.
///
/// The test shell has no Navigator, so there is no focus scope below the
/// app's shortcuts and Tab has nothing to traverse. Asking for focus directly
/// reaches the same state.
Future<void> focusAround(
  WidgetTester tester,
  Finder finder,
) async {
  Focus.of(tester.element(finder)).requestFocus();
  await tester.pump();
}
