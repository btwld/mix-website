import 'dart:convert';
import 'dart:js_interop';
import 'dart:js_interop_unsafe';
import 'dart:ui_web' as ui_web;

import 'package:flutter_web_plugins/url_strategy.dart';

/// The website sets this before it loads the bundle. Its absence means the app
/// was opened on its own, so it shows every example in one gallery.
@JS('__mixShowcaseHost')
external JSObject? get _host;

@JS('__mixShowcase')
external set _api(JSObject value);

extension type _Api._(JSObject _) implements JSObject {
  external factory _Api({JSFunction apply});
}

bool get embedded => _host != null;

/// The page owns the address bar. Without this, Flutter rewrites the URL and
/// cancels the page's own hash links.
void prepareHost() => setUrlStrategy(null);

/// Each view is added by the page with `initialData: { demo: 'tokens' }`.
String? demoFor(int viewId) {
  final data = ui_web.views.getInitialData(viewId);
  if (data == null || !data.isA<JSObject>()) return null;
  final demo = (data as JSObject).getProperty<JSAny?>(
    'demo'.toJS,
  );
  return demo != null && demo.isA<JSString>()
      ? (demo as JSString).toDart
      : null;
}

/// Page to app: `__mixShowcase.apply(json)`.
void connect(
  void Function(Map<String, Object?> message) onMessage,
) {
  void apply(JSString json) {
    onMessage(
      (jsonDecode(json.toDart) as Map)
          .cast<String, Object?>(),
    );
  }

  _api = _Api(apply: apply.toJS);
  _call('onReady', null);
}

/// App to page: `__mixShowcaseHost.onEvent(json)`.
void emit(Map<String, Object?> event) =>
    _call('onEvent', jsonEncode(event).toJS);

void _call(String name, JSAny? argument) {
  final callback = _host?.getProperty<JSAny?>(name.toJS);
  if (callback != null && callback.isA<JSFunction>()) {
    (callback as JSFunction).callAsFunction(
      _host,
      argument,
    );
  }
}
