import 'dart:convert';
import 'dart:js_interop';

import 'package:flutter_web_plugins/url_strategy.dart';

extension type _Api._(JSObject _) implements JSObject {
  external factory _Api({JSFunction apply});
}

@JS('__mixShowcase')
external set _api(JSObject value);

@JS('__mixShowcaseReady')
external JSFunction? get _ready;

@JS('__mixShowcaseEvent')
external JSFunction? get _event;

/// The page owns the address bar. Without this, Flutter rewrites the URL and
/// cancels the page's own hash links.
void prepareHost() => setUrlStrategy(null);

/// Exposes one function to the host page; the page drives the tour with it.
void connectBridge(void Function(Map<String, Object?> patch) onPatch) {
  void apply(JSString json) {
    onPatch((jsonDecode(json.toDart) as Map).cast<String, Object?>());
  }

  _api = _Api(apply: apply.toJS);
  _ready?.callAsFunction();
}

void sendEvent(Map<String, Object?> event) {
  _event?.callAsFunction(null, jsonEncode(event).toJS);
}
