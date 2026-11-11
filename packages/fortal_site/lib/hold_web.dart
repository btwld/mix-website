import 'dart:js_interop';
import 'dart:js_interop_unsafe';

final _listeners = <void Function(double)>{};
var _installed = false;

/// Exposes `window.shoreSet(seconds)`, so a capture tool can step any held
/// water shader through time without reloading the page.
void Function() exposeShoreClock(void Function(double seconds) set) {
  _listeners.add(set);
  if (!_installed) {
    _installed = true;
    globalContext['shoreSet'] = ((JSNumber t) {
      final seconds = t.toDartDouble;
      for (final listener in List.of(_listeners)) {
        listener(seconds);
      }
    }).toJS;
  }
  return () => _listeners.remove(set);
}
