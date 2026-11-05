/// RemixTabs Example
///
/// Fortal-styled two-tab panel.

library;

import 'package:flutter/material.dart';
import 'package:mix_docs_preview/helpers.dart';
import 'package:remix/remix.dart';

void main() {
  runMixApp(const Example());
}

class Example extends StatelessWidget {
  const Example({super.key});

  @override
  Widget build(BuildContext context) {
    return FortalScope(
      accent: .green,
      brightness: .dark,
      child: const TabsPreview(),
    );
  }
}

class TabsPreview extends StatefulWidget {
  const TabsPreview({super.key});

  @override
  State<TabsPreview> createState() => _TabsPreviewState();
}

class _TabsPreviewState extends State<TabsPreview> {
  String _tab = 'tab1';

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 320,
      height: 200,
      child: RemixTabs(
        selectedTabId: _tab,
        onChanged: (id) => setState(() => _tab = id),
        child: Column(
          mainAxisSize: .max,
          crossAxisAlignment: .stretch,
          children: [
            const FortalTabBar(
              child: Row(
                mainAxisSize: .max,
                children: [
                  FortalTab(tabId: 'tab1', label: 'Tab 1'),
                  FortalTab(tabId: 'tab2', label: 'Tab 2'),
                ],
              ),
            ),
            const Expanded(
              child: FortalTabView(
                tabId: 'tab1',
                child: Padding(
                  padding: .all(16),
                  child: Align(
                    alignment: .topLeft,
                    child: Text('Content for Tab 1'),
                  ),
                ),
              ),
            ),
            const Expanded(
              child: FortalTabView(
                tabId: 'tab2',
                child: Padding(
                  padding: .all(16),
                  child: Align(
                    alignment: .topLeft,
                    child: Text('Content for Tab 2'),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
