import 'dart:async';

import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';
import 'package:mix/mix.dart' show FocusVisibility;

import 'bridge.dart';

/// Reports pointer and keyboard-focus state of [child] to the page, so the
/// page can point at the line of code that is active. The example inside
/// stays free of any reporting code.
class StateProbe extends StatefulWidget {
  const StateProbe({
    super.key,
    required this.demo,
    required this.child,
  });

  final String demo;
  final Widget child;

  @override
  State<StateProbe> createState() => _StateProbeState();
}

class _StateProbeState extends State<StateProbe> {
  bool hovered = false;
  bool pressed = false;
  bool focused = false;

  void _set(VoidCallback change) {
    change();
    _tell();
  }

  void _tell() {
    // The same rule Mix applies to onFocusVisible: a pointer press hides
    // the indicator until the next key press.
    final keyboard = FocusVisibility.isVisible;
    emit({
      'demo': widget.demo,
      'type': 'states',
      'value': [
        if (hovered) 'hovered',
        if (pressed) 'pressed',
        if (focused && keyboard) 'focused',
      ],
    });
  }

  void _mode(FocusHighlightMode _) => _tell();

  bool _key(KeyEvent event) {
    scheduleMicrotask(() {
      if (mounted) _tell();
    });
    return false;
  }

  @override
  void initState() {
    super.initState();
    FocusManager.instance.addHighlightModeListener(_mode);
    HardwareKeyboard.instance.addHandler(_key);
  }

  @override
  void dispose() {
    HardwareKeyboard.instance.removeHandler(_key);
    FocusManager.instance.removeHighlightModeListener(
      _mode,
    );
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MouseRegion(
      opaque: false,
      onEnter: (_) => _set(() => hovered = true),
      onExit: (_) => _set(() => hovered = false),
      child: Listener(
        behavior: HitTestBehavior.translucent,
        onPointerDown: (_) => _set(() => pressed = true),
        onPointerUp: (_) => _set(() => pressed = false),
        onPointerCancel: (_) => _set(() => pressed = false),
        child: Focus(
          canRequestFocus: false,
          skipTraversal: true,
          onFocusChange: (value) =>
              _set(() => focused = value),
          child: widget.child,
        ),
      ),
    );
  }
}
