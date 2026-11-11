/// Outside the browser there is no host page: the app runs as a gallery.
bool get embedded => false;

void prepareHost() {}

String? demoFor(int viewId) => null;

void connect(
  void Function(Map<String, Object?> message) onMessage,
) {}

void emit(Map<String, Object?> event) {}
