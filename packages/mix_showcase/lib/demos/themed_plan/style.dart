// dart format off
import 'package:mix/mix.dart';

import '../../theme.dart';

final themedColumn = FlexBoxStyler()
    .column()
    .mainAxisSize(.min)
    .spacing(20)
    .padding(.all(24))
    .color($canvas());

final themedCard = FlexBoxStyler()
    .column()
    .crossAxisAlignment(.start)
    .mainAxisSize(.min)
    .spacing(6)
    .width(220)
    .padding(.all($gap()))
    .color($surface())
    .borderRadius(.all($radius()))
    .border(
      .color($outline())
      .width(1.5),
    )
    .animate(.easeOut(220.ms));

final themedButton = BoxStyler()
    .padding(.symmetric(horizontal: 22, vertical: 13))
    .color($primary())
    .borderRadius(.all($radius()))
    .onHovered(.color($primaryHover()))
    .animate(.easeOut(220.ms));

final themedName = TextStyler()
    .style($label.mix())
    .color($muted());
final themedPrice = TextStyler()
    .style($title.mix())
    .color($ink());
final themedNote = TextStyler()
    .style($body.mix())
    .color($muted());
final themedLabel = TextStyler()
    .style($label.mix())
    .color($onPrimary());
