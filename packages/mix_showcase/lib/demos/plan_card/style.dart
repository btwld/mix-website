// dart format off
import 'package:mix/mix.dart';

import '../../colors.dart';

// A style is a value. This one is the box and its column.
final card = FlexBoxStyler()
    .column()
    .crossAxisAlignment(.start)
    .mainAxisSize(.min)
    .spacing(6)
    .padding(.all(16))
    .color(charcoal)
    .borderRadius(.circular(12))
    .border(
      .color(slate)
      .width(1.5),
    )
    .animate(.easeOut(220.ms));

// A fragment holds a few properties that several styles can share.
final lifted = FlexBoxStyler()
    .translate(0, -6)
    .shadow(
      .color(shadow)
      .blurRadius(28)
      .offset(x: 0, y: 14),
    );

// Derive a style by chaining onto another. Only what differs is restated.
final featured = card
    .merge(lifted)
    .border(.color(purple));

final planName = TextStyler()
    .fontSize(14)
    .fontWeight(.w600)
    .color(grey);
final planPrice = TextStyler()
    .fontSize(26)
    .fontWeight(.w700)
    .color(white);
final planNote = TextStyler()
    .fontSize(14)
    .color(grey);
