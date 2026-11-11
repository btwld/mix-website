// dart format off
import 'package:mix/mix.dart';

import '../../colors.dart';
import '../upgrade_button/style.dart' show label;

// Each state names only what changes while it is active.
final action = BoxStyler()
    .padding(.symmetric(horizontal: 22, vertical: 13))
    .color(charcoal)
    .borderRadius(.circular(12))
    .border(
      .color(slate)
      .width(1.5),
    )
    .onHovered(.color(graphite))
    .onPressed(.scale(0.95))
    .onFocusVisible(.border(.color(purple)))
    .onDisabled(.color(night))
    .animate(.easeOut(140.ms));

// Text below a pressable reads the same states.
final actionLabel = label.onDisabled(.color(grey));
