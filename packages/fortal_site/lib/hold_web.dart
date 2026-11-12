import 'dart:js_interop';
import 'dart:js_interop_unsafe';
import 'dart:ui' show FramePhase;

import 'package:flutter/scheduler.dart';

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

/// With `?perf` in the address, reports each frame Flutter produces to
/// `window.fortalFrames` as `[build ms, raster ms, finished at ms]`, so a
/// measuring tool can read real frame times, including the renderer's.
void exposeFrameTimings() {
  if (!Uri.base.queryParameters.containsKey('perf')) return;
  final frames = JSArray<JSArray<JSNumber>>();
  globalContext['fortalFrames'] = frames;
  SchedulerBinding.instance.addTimingsCallback((timings) {
    for (final timing in timings) {
      frames.add(
        [
          (timing.buildDuration.inMicroseconds / 1000).toJS,
          (timing.rasterDuration.inMicroseconds / 1000).toJS,
          (timing.timestampInMicroseconds(FramePhase.rasterFinish) / 1000).toJS,
        ].toJS,
      );
    }
  });
}
