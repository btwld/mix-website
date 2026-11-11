import 'package:flutter/widgets.dart';

import '../theme.dart';
import 'bridge.dart';

/// What the page and the examples share: the theme, and each example's
/// control values. Reader-facing example code never sees this class.
class Host extends ChangeNotifier {
  ThemeValues theme = midnight;
  final _values = <String, Map<String, Object?>>{};
  final _assigned = <int, String>{};

  /// The example a view shows. The page keeps a few views and points each at
  /// whichever example is nearest the reader, so this changes over time.
  String demoOf(int viewId) =>
      _assigned[viewId] ?? demoFor(viewId) ?? '';

  /// A message from the page: `{theme}`, `{demo, set: {key: value}}` or
  /// `{assign: {view, demo}}`.
  void apply(Map<String, Object?> message) {
    if (message['assign'] case {
      'view': final num view,
      'demo': final String demo,
    }) {
      _assigned[view.toInt()] = demo;
      // Tell the page once the view has drawn its new example.
      WidgetsBinding.instance.addPostFrameCallback((_) {
        emit({
          'demo': demo,
          'type': 'assigned',
          'value': view.toInt(),
        });
      });
    }
    if (message['theme'] case final String id) {
      theme = themes[id] ?? theme;
    }
    if ((message['demo'], message['set']) case (
      final String demo,
      final Map<Object?, Object?> set,
    )) {
      (_values[demo] ??= {}).addAll(
        set.cast<String, Object?>(),
      );
    }
    notifyListeners();
  }

  /// A change made inside an example, reported back so page controls follow.
  void set(String demo, String key, Object? value) {
    (_values[demo] ??= {})[key] = value;
    notifyListeners();
    emit({'demo': demo, 'type': key, 'value': value});
  }

  /// Remembers a value for an example without telling the page.
  void keep(String demo, String key, Object? value) {
    (_values[demo] ??= {})[key] = value;
    notifyListeners();
  }

  T read<T>(String demo, String key, T fallback) {
    final value = _values[demo]?[key];
    if (value is T) return value;
    // JSON has one number type; a whole number arrives as an int.
    if (fallback is double && value is num)
      return value.toDouble() as T;
    return fallback;
  }

  List<String> list(String demo, String key) =>
      (read<List<Object?>>(
        demo,
        key,
        const [],
      )).whereType<String>().toList();
}
