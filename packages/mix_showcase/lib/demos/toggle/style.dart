// dart format off
import 'package:mix/mix.dart';

import '../../colors.dart';

// The values change with `on`. animate() decides how they get there.
BoxStyler track({
  required bool on,
  required AnimationConfig motion,
}) {
  return BoxStyler()
      .size(76, 44)
      .padding(.all(5))
      .borderRadius(.circular(22))
      .color(on ? purple : slate)
      .alignment(on ? .centerRight : .centerLeft)
      .animate(motion);
}

final thumb = BoxStyler()
    .size(34, 34)
    .borderRadius(.circular(17))
    .color(white);

final ease = AnimationConfig.easeOut(260.ms);
final spring = AnimationConfig.spring(520.ms, bounce: 0.35);
final bouncy = AnimationConfig.spring(700.ms, bounce: 0.6);
