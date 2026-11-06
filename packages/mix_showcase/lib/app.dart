import 'package:flutter/material.dart' show Icons;
import 'package:flutter/widgets.dart';
import 'package:remix/remix.dart';

import 'cards.dart';
import 'screens.dart';
import 'showcase.dart';
import 'styles.dart';
import 'tokens.dart';

/// The host's frame. In phone mode it shrinks the real app to a device width,
/// so the app's own layout rules do the reflow.
class AppFrame extends StatelessWidget {
  const AppFrame({super.key});

  @override
  Widget build(BuildContext context) {
    final showcase = ShowcaseScope.of(context);
    return LayoutBuilder(
      builder: (context, constraints) {
        final framed = showcase.framed && constraints.maxWidth > 500;
        return ColoredBox(
          color: const Color(0xFF07060C),
          child: Center(
            child: AnimatedContainer(
              duration: showcase.reduceMotion ? Duration.zero : const Duration(milliseconds: 620),
              curve: Curves.easeInOutCubic,
              width: framed ? 390 : constraints.maxWidth,
              height: framed ? (constraints.maxHeight - 48).clamp(0, 760) : constraints.maxHeight,
              clipBehavior: Clip.antiAlias,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(framed ? 36 : 0),
                border: framed ? Border.all(color: const Color(0xFF34303F), width: 6) : null,
              ),
              // Report the frame as the screen, so breakpoints respond to it for
              // real instead of reading the width of the stage around it.
              child: LayoutBuilder(
                builder: (context, frame) => MediaQuery(
                  data: MediaQuery.of(context).copyWith(size: frame.biggest),
                  child: const SubjectView(),
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}

/// One subject at a time, all of them reading the same tokens.
class SubjectView extends StatelessWidget {
  const SubjectView({super.key});

  @override
  Widget build(BuildContext context) {
    final showcase = ShowcaseScope.of(context);
    final view = switch (showcase.subject) {
      Subject.app => const LaunchpadShell(),
      Subject.single when showcase.naked => const NakedQueue(),
      Subject.single => const SingleCard(),
      Subject.deck || Subject.phone => const CardDeck(),
    };
    return Box(
      style: canvasStyle,
      child: AnimatedSwitcher(
        duration: const Duration(milliseconds: 420),
        child: KeyedSubtree(key: ValueKey(view.runtimeType), child: view),
      ),
    );
  }
}

class LaunchpadShell extends StatelessWidget {
  const LaunchpadShell({super.key});

  @override
  Widget build(BuildContext context) {
    final showcase = ShowcaseScope.of(context);
    final body = showcase.naked
        ? const NakedTasks()
        : switch (showcase.screen) {
            Screen.tasks => const TasksScreen(),
            Screen.team => const TeamScreen(),
            Screen.settings => const SettingsScreen(),
          };
    return Box(
      style: canvasStyle,
      child: LayoutBuilder(
        builder: (context, constraints) {
          // #docregion shell-layout
          final compact = constraints.maxWidth < 620;
          return Flex(
            direction: compact ? .vertical : .horizontal,
            verticalDirection: compact ? .up : .down,
            crossAxisAlignment: .stretch,
            children: [
              // The Naked chapter is about the rows, so Tab starts on them.
              ExcludeFocus(
                excluding: showcase.naked,
                child: compact ? const TabBar() : const Sidebar(),
              ),
              Expanded(child: body),
            ],
          );
          // #enddocregion shell-layout
        },
      ),
    );
  }
}

const _destinations = [
  (Screen.tasks, 'Tasks', Icons.check_circle_outline),
  (Screen.team, 'Team', Icons.group_outlined),
  (Screen.settings, 'Settings', Icons.tune),
];

class Sidebar extends StatelessWidget {
  const Sidebar({super.key});

  @override
  Widget build(BuildContext context) {
    final showcase = ShowcaseScope.of(context);
    return SizedBox(
      width: 196,
      child: Box(
        style: sidebarStyle,
        child: Column(
          crossAxisAlignment: .stretch,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(10, 8, 10, 20),
              child: StyledText(showcase.workspace, style: oneLine(text($title))),
            ),
            for (final (screen, label, icon) in _destinations)
              Padding(
                padding: const EdgeInsets.only(bottom: 4),
                child: _NavItem(
                  label: label,
                  icon: icon,
                  active: showcase.screen == screen,
                  onPress: () => showcase.go(screen),
                ),
              ),
            const Spacer(),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 10),
              child: StyledText('Sample data. Stays in this page.', style: text($small, $muted)),
            ),
          ],
        ),
      ),
    );
  }
}

class TabBar extends StatelessWidget {
  const TabBar({super.key});

  @override
  Widget build(BuildContext context) {
    final showcase = ShowcaseScope.of(context);
    return Box(
      style: tabBarStyle,
      child: Row(
        children: [
          for (final (screen, label, icon) in _destinations)
            Expanded(
              child: _NavItem(
                label: label,
                icon: icon,
                active: showcase.screen == screen,
                center: true,
                onPress: () => showcase.go(screen),
              ),
            ),
        ],
      ),
    );
  }
}

class _NavItem extends StatelessWidget {
  const _NavItem({
    required this.label,
    required this.icon,
    required this.active,
    required this.onPress,
    this.center = false,
  });

  final String label;
  final IconData icon;
  final bool active;
  final bool center;
  final VoidCallback onPress;

  @override
  Widget build(BuildContext context) {
    final color = active ? $ink : $muted;
    final icon = StyledIcon(icon: this.icon, style: IconStyler().size(17).color(color()).animate(motion));
    // A phone tab stacks its label under the icon, so no label ever truncates.
    final label = StyledText(this.label, style: oneLine(text(center ? $small : $body, color)));
    return PressableBox(
      onPress: onPress,
      style: navStyle(active: active),
      child: center
          ? Column(mainAxisSize: .min, spacing: 3, children: [icon, label])
          : Row(spacing: 10, children: [icon, Flexible(child: label)]),
    );
  }
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

  /// The Remix chapter's color, shared with the Blocks ring. On a look that is
  /// already green the outlines switch to white, or they would disappear.
  static Color colorFor(BuildContext context) =>
      ShowcaseScope.of(context).activeLook.cut ? const Color(0xFFFFFFFF) : const Color(0xFF22E66E);

  final String label;
  final Widget child;

  /// Repeated widgets name themselves once, so a list stays readable.
  final bool named;
  final bool below;
  final bool right;

  @override
  Widget build(BuildContext context) {
    final on = ShowcaseScope.of(context).xray;
    final color = colorFor(context);
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
        if (named) Positioned(
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
