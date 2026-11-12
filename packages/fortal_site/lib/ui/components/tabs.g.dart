// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'tabs.dart';

// **************************************************************************
// MixWidgetGenerator
// **************************************************************************

/// Ui-themed preset for [RemixTabBar].
class UiTabBar extends StatelessWidget {
  const UiTabBar({
    super.key,
    this.style = const TabBarStyler.create(),
    required this.child,
  });

  final TabBarStyler style;

  final Widget child;

  @override
  Widget build(BuildContext _) {
    return RemixTabBar(
      key: key,
      style: uiTabBarStyle(style: style),
      child: child,
    );
  }
}

/// Ui-themed preset for [RemixTabView].
class UiTabView extends StatelessWidget {
  const UiTabView({
    super.key,
    this.style = const TabViewStyler.create(),
    required this.tabId,
    required this.child,
    this.maintainState = true,
  });

  final TabViewStyler style;

  final String tabId;

  final Widget child;

  final bool maintainState;

  @override
  Widget build(BuildContext _) {
    return RemixTabView(
      key: key,
      style: uiTabViewStyle(style: style),
      tabId: tabId,
      child: child,
      maintainState: maintainState,
    );
  }
}

/// Ui-themed preset for [RemixTab].
class UiTab extends StatelessWidget {
  const UiTab({
    super.key,
    this.size = UiTabsSize.size2,
    this.highContrast = false,
    this.style = const TabStyler.create(),
    required this.tabId,
    this.child,
    this.label,
    this.icon,
    this.enabled = true,
    this.mouseCursor = SystemMouseCursors.click,
    this.enableFeedback = true,
    this.focusNode,
    this.autofocus = false,
    this.onFocusChange,
    this.onHoverChange,
    this.onPressChange,
    this.builder,
    this.semanticLabel,
  });

  final UiTabsSize size;

  final bool highContrast;

  final TabStyler style;

  final String tabId;

  final Widget? child;

  final String? label;

  final IconData? icon;

  final bool enabled;

  final MouseCursor mouseCursor;

  final bool enableFeedback;

  final FocusNode? focusNode;

  final bool autofocus;

  final ValueChanged<bool>? onFocusChange;

  final ValueChanged<bool>? onHoverChange;

  final ValueChanged<bool>? onPressChange;

  final ValueWidgetBuilder<NakedTabState>? builder;

  final String? semanticLabel;

  @override
  Widget build(BuildContext _) {
    return RemixTab(
      key: key,
      style: uiTabStyle(size: size, highContrast: highContrast, style: style),
      tabId: tabId,
      child: child,
      label: label,
      icon: icon,
      enabled: enabled,
      mouseCursor: mouseCursor,
      enableFeedback: enableFeedback,
      focusNode: focusNode,
      autofocus: autofocus,
      onFocusChange: onFocusChange,
      onHoverChange: onHoverChange,
      onPressChange: onPressChange,
      builder: builder,
      semanticLabel: semanticLabel,
    );
  }
}
