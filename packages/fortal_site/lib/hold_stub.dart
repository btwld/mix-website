/// Off the web there is no page script to set the time.
void Function() exposeShoreClock(void Function(double seconds) set) => () {};

/// Off the web there is no page script to read frame times.
void exposeFrameTimings() {}
