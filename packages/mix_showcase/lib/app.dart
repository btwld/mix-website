import 'package:flutter/widgets.dart';
import 'package:remix/remix.dart';

import 'cards.dart';
import 'showcase.dart';
import 'styles.dart';

/// The host's frame. In phone mode it shrinks the real app to a device width,
/// so the app's own layout rules do the reflow.
class AppFrame extends StatelessWidget {
  const AppFrame({super.key});

  @override
  Widget build(BuildContext context) {
    final showcase = ShowcaseScope.of(context);
    return LayoutBuilder(
      builder: (context, constraints) {
        final framed = showcase.phone && constraints.maxWidth > 500;
        return ColoredBox(
          color: const Color(0xFF07060C),
          child: Center(
            child: AnimatedContainer(
              duration: showcase.reduceMotion
                  ? Duration.zero
                  : const Duration(milliseconds: 620),
              curve: Curves.easeInOutCubic,
              width: framed ? 390 : constraints.maxWidth,
              height: framed
                  ? (constraints.maxHeight - 48).clamp(0, 760)
                  : constraints.maxHeight,
              clipBehavior: Clip.antiAlias,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(framed ? 36 : 0),
                border: framed
                    ? Border.all(color: const Color(0xFF34303F), width: 6)
                    : null,
              ),
              // Report the frame as the screen, so breakpoints respond to it for
              // real instead of reading the width of the stage around it.
              child: LayoutBuilder(
                builder: (context, frame) => MediaQuery(
                  data: MediaQuery.of(context).copyWith(size: frame.biggest),
                  child: const ShowcaseView(),
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}

/// One composition throughout the tour, reading the same live tokens.
class ShowcaseView extends StatelessWidget {
  const ShowcaseView({super.key});

  @override
  Widget build(BuildContext context) =>
      Box(style: canvasStyle, child: const CardDeck());
}

/// Outlines a Remix widget and names it while the X-ray chapter is active.
class Xray extends StatelessWidget {
  const Xray(
    this.label, {
    super.key,
    required this.child,
    this.named = true,
    this.below = false,
    this.right = false,
  });

  final String label;
  final Widget child;

  /// Repeated widgets name themselves once, so a list stays readable.
  final bool named;
  final bool below;
  final bool right;

  @override
  Widget build(BuildContext context) {
    final showcase = ShowcaseScope.of(context);
    final on = showcase.xray;
    // Cyber is already green, so its outlines switch to white or they would vanish.
    final color = showcase.activeLook.cut
        ? const Color(0xFFFFFFFF)
        : const Color(0xFF22E66E);
    return Stack(
      clipBehavior: .none,
      children: [
        child,
        Positioned.fill(
          child: IgnorePointer(
            child: AnimatedOpacity(
              opacity: on ? 1 : 0,
              duration: const Duration(milliseconds: 260),
              child: DecoratedBox(
                decoration: BoxDecoration(
                  border: Border.all(color: color, width: 1.5),
                  color: color.withValues(alpha: 0.08),
                ),
              ),
            ),
          ),
        ),
        if (named)
          Positioned(
            left: right ? null : -1,
            // Clear of a card's cut corner when it sits low on the right.
            right: right ? (below ? 18 : -1) : null,
            top: below ? null : -20,
            bottom: below ? -20 : null,
            child: IgnorePointer(
              child: AnimatedOpacity(
                opacity: on ? 1 : 0,
                duration: const Duration(milliseconds: 260),
                child: ColoredBox(
                  color: color,
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 5),
                    child: Text(
                      label,
                      maxLines: 1,
                      style: const TextStyle(
                        fontFamily: 'GeistMono',
                        fontSize: 11,
                        fontWeight: FontWeight.w500,
                        height: 1.4,
                        color: Color(0xFF04120B),
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
      ],
    );
  }
}
