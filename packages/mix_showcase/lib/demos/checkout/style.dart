// dart format off
import 'package:remix/remix.dart';

// The form's layout, as two Mix styles. The fields and buttons it places are
// installed components.
final form = FlexBoxStyler()
    .column()
    .crossAxisAlignment(.stretch)
    .mainAxisSize(.min)
    .spacing(16);
final header = FlexBoxStyler()
    .row()
    .mainAxisAlignment(.spaceBetween);
