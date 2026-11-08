import 'package:flutter/widgets.dart';
import 'package:remix/remix.dart';

import 'app.dart';
import 'fortal/ui.dart';
import 'showcase.dart';

/// The shared task list, composed from application-owned Fortal recipes.
class FortalToday extends StatelessWidget {
  const FortalToday({super.key});

  @override
  Widget build(BuildContext context) {
    final showcase = ShowcaseScope.of(context);
    final tasks = showcase.today;
    final done = tasks.where((task) => task.done).length;
    // #docregion fortal-today
    return FortalTheme(
      mode: showcase.presetDark ? .dark : .light,
      hasBackground: false,
      // Only Fortal tokens belong in this scope; it shadows the look's tokens.
      child: FortalCard(
        // X-ray annotations paint beyond the preset card's surface.
        style: CardStyler().clipBehavior(showcase.xray ? .none : .antiAlias),
        child: Column(
          mainAxisSize: .min,
          crossAxisAlignment: .stretch,
          spacing: 2,
          children: [
            Row(
              mainAxisAlignment: .spaceBetween,
              children: [
                StyledText(
                  'Today',
                  style: TextStyler()
                      .style(FortalTokens.text2.mix())
                      .fontWeight(.w600),
                ),
                StyledText(
                  '$done of ${tasks.length} done',
                  style: TextStyler().style(FortalTokens.text1.mix()),
                ),
              ],
            ),
            for (final task in tasks)
              Row(
                spacing: 6,
                children: [
                  Xray(
                    'RemixCheckbox',
                    named: task == tasks.last,
                    below: true,
                    child: FortalCheckbox(
                      selected: task.done,
                      semanticLabel: task.title,
                      minimumTapTargetSize: Size.zero,
                      onChanged: (_) => showcase.toggle(task),
                    ),
                  ),
                  Expanded(
                    child: StyledText(
                      task.title,
                      style: TextStyler()
                          .style(FortalTokens.text2.mix())
                          .maxLines(1)
                          .overflow(.ellipsis)
                          .decoration(task.done ? .lineThrough : .none),
                    ),
                  ),
                  FortalBadge(label: task.tag),
                ],
              ),
          ],
        ),
      ),
    );
    // #enddocregion fortal-today
  }
}
