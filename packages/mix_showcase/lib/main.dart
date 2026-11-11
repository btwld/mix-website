import 'package:flutter/widgets.dart';

import 'host/bridge.dart';
import 'host/host.dart';
import 'host/views.dart';

/// The examples themselves are in `lib/demos`, using `lib/colors.dart`.
/// Everything under `lib/host` only puts them on the website.
void main() {
  prepareHost();
  final host = Host();
  if (embedded) {
    runWidget(EmbeddedViews(host: host));
    connect(host.apply);
  } else {
    runApp(Gallery(host: host));
  }
}
