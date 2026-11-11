// dart format off
import 'package:mix/mix.dart';

const compact = Breakpoint.maxWidth(520);

// Three columns on a wide screen, one on a compact one.
final planGrid = GridBoxStyler()
    .equalColumns(3)
    .gap(16)
    .onBreakpoint(
      compact,
      .equalColumns(1)
      .gap(8),
    );
