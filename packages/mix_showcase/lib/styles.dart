import 'package:flutter/widgets.dart';
import 'package:remix/remix.dart';

import 'tokens.dart';

/// Every style in the app lives here, written against tokens. No style names a
/// color, a shape or a look, which is why changing looks needs no widget changes.
final motion = AnimationConfig.easeOut(420.ms);

TextStyler text(TextStyleToken style, [ColorToken color = $ink]) =>
    TextStyler().style(style.mix()).color(color()).animate(motion);

TextStyler oneLine(TextStyler style) => style.maxLines(1).overflow(.ellipsis);

ShapeDecorationMix shape(ShapeToken token) => ShapeDecorationMix.create(shape: Prop.token(token));

final canvasStyle = BoxStyler().color($canvas()).animate(motion);

final sidebarStyle = BoxStyler()
    .color($surface())
    .border(BorderMix(right: .color($line()).width($stroke())))
    .padding(.all(14))
    .animate(motion);

final tabBarStyle = BoxStyler()
    .color($surface())
    .border(BorderMix(top: .color($line()).width($stroke())))
    .padding(.all(8))
    .animate(motion);

BoxStyler navStyle({required bool active}) => BoxStyler()
    .padding(.horizontal(12))
    .padding(.vertical(9))
    .decoration(shape($solidShape))
    .color(active ? $raised() : const Color(0x00000000))
    .onHovered(.color($raised()))
    .onFocusVisible(.decoration(shape($focusShape)))
    .animate(motion);

final cardStyle = BoxStyler()
    .color($surface())
    .decoration(ShapeDecorationMix.create(shape: Prop.token($cardShape), shadows: Prop.token($lift)))
    .animate(motion);

final cardPad = cardStyle.padding(.all(18));

// #docregion task-row
final taskRow = BoxStyler()
    .padding(.horizontal(14))
    .padding(.vertical(11))
    .border(BorderMix(bottom: .color($line()).width(1)))
    .onHovered(.color($raised()))
    .onPressed(.scale(0.985))
    .animate(.easeOut(140.ms));
// #enddocregion task-row

// #docregion list-row
final listRow = BoxStyler()
    .padding(.horizontal(6))
    .padding(.vertical(7))
    .decoration(shape($solidShape))
    .onHovered(.color($raised()))
    .onPressed(.scale(0.985))
    .animate(.easeOut(140.ms));
// #enddocregion list-row

// #docregion page-padding
final pageStyle = BoxStyler()
    .padding(.all(32))
    .onBreakpoint(.maxWidth(620), .padding(.all(18)));
// #enddocregion page-padding

// #docregion primary-button
final primaryButton = ButtonStyler()
    .padding(.horizontal(16))
    .padding(.vertical(11))
    .color($accent())
    .decoration(shape($solidShape))
    .label(text($title, $onAccent))
    .onHovered(.scale(1.03))
    .onPressed(.scale(0.96))
    .animate(motion);
// #enddocregion primary-button

final quietButton = ButtonStyler()
    .minWidth(84)
    .padding(.horizontal(14))
    .padding(.vertical(8))
    .color($surface())
    .decoration(shape($controlShape))
    .label(text($small))
    .onHovered(.color($raised()))
    .onPressed(.scale(0.96))
    .animate(motion);

/// A finished action reads as a state, not as another button to press.
final doneButton = ButtonStyler()
    .minWidth(84)
    .padding(.horizontal(10))
    .padding(.vertical(8))
    .color(const Color(0x00000000))
    .decoration(shape($solidShape))
    .spacing(5)
    .label(text($small, $muted))
    .icon(IconStyler().color($muted()).size(14))
    .onHovered(.color($raised()))
    .animate(motion);

/// The alignment is required: without it the box forces the check to fill it,
/// and `iconSize` is silently ignored.
final checkbox = CheckboxStyler()
    .size(18, 18)
    .alignment(.center)
    .decoration(shape($checkShape))
    .fillColor($surface())
    .iconColor($onAccent())
    .iconSize(10)
    .onSelected(CheckboxStyler().fillColor($accent()).decoration(shape($tinyShape)))
    .animate(motion);

final badge = BadgeStyler()
    .padding(.horizontal(8))
    .padding(.vertical(3))
    .color($raised())
    .decoration(shape($solidShape))
    .label(text($small, $muted))
    .animate(motion);

final avatar = AvatarStyler()
    .size(30, 30)
    .color($raised())
    .decoration(shape($solidShape))
    .label(text($small, $muted))
    .animate(motion);

final progress = ProgressStyler()
    .height(8)
    .decoration(shape($tinyShape))
    .trackColor($raised())
    .indicatorColor($accent())
    .animate(motion);

final field = TextFieldStyler()
    .padding(.horizontal(12))
    .padding(.vertical(11))
    .color($surface())
    .decoration(shape($controlShape))
    .text(text($body))
    .hintText(text($body, $muted))
    .label(text($small, $muted))
    .helperText(text($small, $muted))
    .cursorColor($accent())
    .onFocused(.decoration(shape($focusShape)))
    .animate(motion);

final segments = SegmentedControlStyler()
    .padding(.all(3))
    .spacing(2)
    .color($raised())
    .decoration(shape($solidShape))
    .item(
      SegmentedControlItemStyler()
          .padding(.horizontal(12))
          .padding(.vertical(5))
          .decoration(shape($solidShape))
          .label(text($small, $muted))
          .onSelected(SegmentedControlItemStyler().color($surface()).label(text($small))),
    )
    .animate(motion);

final switchStyle = SwitchStyler()
    .size(40, 24)
    .padding(.all(3))
    .decoration(shape($solidShape))
    .trackColor($raised())
    .thumbColor($muted())
    .thumb(BoxStyler().size(18, 18).decoration(shape($solidShape)))
    .onSelected(SwitchStyler().trackColor($accent()).thumbColor($onAccent()))
    .animate(motion);

final slider = SliderStyler()
    .trackColor($raised())
    .rangeColor($accent())
    .thumbColor($accent())
    .thumb(BoxStyler().decoration(shape($solidShape)))
    .thumbSize(const Size(16, 16))
    .trackThickness(4)
    .rangeThickness(4)
    .animate(motion);

/// Neutral controls, so the accent stays on what the card is about.
final quietSlider = slider.rangeColor($muted()).thumbColor($ink());

final quietSwitch = switchStyle.onSelected(SwitchStyler().trackColor($ink()).thumbColor($canvas()));

final selectStyle = SelectStyler()
    .trigger(
      SelectTriggerStyler()
          .padding(.horizontal(10))
          .padding(.vertical(6))
          .color($surface())
          .decoration(shape($controlShape))
          .spacing(6)
          .label(text($small))
          .placeholder(text($small, $muted))
          .indicator(IconStyler().color($muted()).size(14)),
    )
    .content(
      SelectContentStyler()
          .padding(.all(4))
          .color($surface())
          .decoration(shape($controlShape)),
    )
    .item(
      SelectMenuItemStyler()
          .padding(.horizontal(10))
          .padding(.vertical(7))
          .decoration(shape($solidShape))
          .label(text($small))
          .onHovered(SelectMenuItemStyler().color($raised())),
    );

final transportButton = IconButtonStyler()
    .size(38, 38)
    .color(const Color(0x00000000))
    .decoration(shape($solidShape))
    .icon(IconStyler().color($ink()).size(20))
    .onHovered(.color($raised()))
    .onPressed(.scale(0.92))
    .animate(motion);

final playButton = IconButtonStyler()
    .size(46, 46)
    .color($accent())
    .decoration(shape($solidShape))
    .icon(IconStyler().color($onAccent()).size(24))
    .onHovered(.scale(1.05))
    .onPressed(.scale(0.94))
    .animate(motion);

final likeStyle = CheckboxStyler()
    .size(22, 22)
    .alignment(.center)
    .color(const Color(0x00000000))
    .iconColor($muted())
    .iconSize(18)
    .onSelected(CheckboxStyler().iconColor($accent()))
    .animate(motion);

/// Resting bars use a tint of the accent, so the chart still reads as a chart.
BoxStyler barStyle(BuildContext context, {required double height, required bool active}) => BoxStyler()
    .height(height)
    .decoration(shape($tinyShape))
    .color(active ? $accent() : $accent.resolve(context).withValues(alpha: 0.25))
    .animate(.spring(320.ms));

// #docregion equalizer
BoxStyler equalizerBar(double peak, Duration beat) =>
    BoxStyler()
    .width(3)
    .color($accent())
    .keyframeAnimation(
      timeline: [
        KeyframeTrack<double>('height', [
          .easeInOut(peak, beat),
          .easeInOut(5, beat),
        ], initial: 5),
      ],
      styleBuilder: (values, style) =>
          style.height(values.get('height')),
    );
// #enddocregion equalizer
