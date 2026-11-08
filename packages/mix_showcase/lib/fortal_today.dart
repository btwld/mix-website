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
        style: _fortalCardStyle(showcase),
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
              _FortalTask(task: task, last: task == tasks.last),
          ],
        ),
      ),
    );
    // #enddocregion fortal-today
  }
}

// X-ray labels paint beyond the preset card without changing its layout.
CardStyler _fortalCardStyle(Showcase showcase) =>
    CardStyler().clipBehavior(showcase.xray ? .none : .antiAlias);

class _FortalTask extends StatelessWidget {
  const _FortalTask({required this.task, required this.last});

  final Task task;
  final bool last;

  @override
  Widget build(BuildContext context) {
    final showcase = ShowcaseScope.of(context);
    // #docregion fortal-control
    final checkbox = FortalCheckbox(
      selected: task.done,
      semanticLabel: task.title,
      minimumTapTargetSize: Size.zero,
      onChanged: (_) => showcase.toggle(task),
    );
    // #enddocregion fortal-control
    return Row(
      spacing: 6,
      children: [
        Xray('RemixCheckbox', named: last, below: true, child: checkbox),
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
    );
  }
}
