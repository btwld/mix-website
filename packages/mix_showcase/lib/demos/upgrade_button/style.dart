// dart format off
import 'package:mix/mix.dart';

import '../../colors.dart';

final button = BoxStyler()
    .color(purple)
    .padding(.symmetric(horizontal: 24, vertical: 15))
    .borderRadius(.circular(12))
    .onHovered(.color(purpleLight))
    .onPressed(.scale(0.96))
    .onFocusVisible(.shadow(
      .color(white)
      .spreadRadius(2),
    ))
    .animate(.easeOut(160.ms));

final label = TextStyler()
    .fontSize(14)
    .fontWeight(.w600)
    .color(white);
