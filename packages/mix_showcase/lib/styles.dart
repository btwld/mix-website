import 'package:flutter/material.dart' show Colors, Theme;
import 'package:flutter/widgets.dart';
import 'package:remix/remix.dart';

import 'tokens.dart';

/// The app's shared styles, written against tokens. No style names a color, a
/// shape or a look, which is why changing looks needs no widget changes.
// #docregion motion-config
final motion = AnimationConfig.easeOut(420.ms);
// #enddocregion motion-config

TextStyler text(TextStyleToken style, [ColorToken color = $ink]) =>
    TextStyler().style(style.mix()).color(color()).animate(motion);

TextStyler oneLine(TextStyler style) => style.maxLines(1).overflow(.ellipsis);

final canvasStyle = BoxStyler().color($canvas()).animate(motion);

// #docregion composition
// #docregion card-style
final cardStyle = BoxStyler()
    .color($surface())
    .shape($cardShape.mix())
    .shadow($lift.mix())
    .animate(motion);
// #enddocregion card-style

// #docregion card-padding
final cardPad = cardStyle
    .padding(.all(18))
    .onBreakpoint(.maxWidth(480), .padding(.all(14)));
// #enddocregion card-padding
// #enddocregion composition

// #docregion list-row
final listRow = BoxStyler()
    .padding(.horizontal(6))
    .padding(.vertical(7))
    .shape($solidShape.mix())
    .onHovered(.color($raised()))
    .onPressed(.scale(0.985))
    .animate(.easeOut(140.ms));
// #enddocregion list-row

final quietButton = ButtonStyler()
    .minWidth(84)
    .padding(.horizontal(14))
    .padding(.vertical(8))
    .color($surface())
    .shape($controlShape.mix())
    .label(text($small))
    .onHovered(.color($raised()))
    .onPressed(.scale(0.96))
    .onFocusVisible(.shape($focusShape.mix()))
    .animate(motion);

// #docregion material-bridge
// Context tokens let Mix read the Material theme already used by the app.
final $brand = ContextToken<Color>((c) => Theme.of(c).colorScheme.primary);
final $onBrand = ContextToken<Color>((c) => Theme.of(c).colorScheme.onPrimary);

final primaryButton = ButtonStyler()
    .padding(.horizontal(14))
    .padding(.vertical(8))
    .color($brand())
    .shape($controlShape.mix())
    .label(TextStyler().style($small.mix()).color($onBrand()))
    .spinner(.color($onBrand()).size(16))
    .onHovered(.scale(1.02))
    .onPressed(.scale(0.96))
    .onFocusVisible(.shape($focusShape.mix()));
// #enddocregion material-bridge

final dialogStyle = DialogStyler()
    .width(400)
    .padding(.all(16))
    .color($surface())
    .shape($cardShape.mix())
    .shadow($lift.mix())
    .title(text($title))
    .description(text($small, $muted).wrap(.padding(.vertical(8))))
    .actions(.row().spacing(8).mainAxisAlignment(.end).padding(.top(12)));

final field = TextFieldStyler()
    .padding(.all(10))
    .color($raised())
    .shape($controlShape.mix())
    .text(text($body))
    .label(text($small))
    .hintText(text($body, $muted))
    .helperText(text($small, $muted))
    .cursorColor($ink())
    .onFocused(.shape($focusShape.mix()));

final toastStyle = ToastStyler()
    .maxWidth(360)
    .padding(.all(14))
    .spacing(10)
    .color($surface())
    .shape($cardShape.mix())
    .title(text($body))
    .description(text($small, $muted))
    .closeButton(
      IconButtonStyler()
          .size(28, 28)
          .icon(.color($ink()).size(16))
          .onFocusVisible(.shape($focusShape.mix())),
    );

/// A finished action reads as a state, not as another button to press.
final doneButton = ButtonStyler()
    .minWidth(84)
    .padding(.horizontal(10))
    .padding(.vertical(8))
    .color(Colors.transparent)
    .shape($solidShape.mix())
    .spacing(5)
    .label(text($small, $muted))
    .icon(.color($muted()).size(14))
    .onHovered(.color($raised()))
    .onFocusVisible(.shape($focusShape.mix()))
    .animate(motion);

// #docregion checkbox-style
/// The alignment is required: without it the box forces the check to fill it,
/// and `iconSize` is silently ignored.
final checkbox = CheckboxStyler()
    .size(18, 18)
    .alignment(.center)
    .shape($checkShape.mix())
    .fillColor($surface())
    .iconColor($onAccent())
    .iconSize(10)
    .onSelected(.color($accent()).shape($tinyShape.mix()))
    .onFocusVisible(.shape($checkFocusShape.mix()))
    .animate(motion);
// #enddocregion checkbox-style

final badge = BadgeStyler()
    .padding(.horizontal(8))
    .padding(.vertical(3))
    .color($raised())
    .shape($solidShape.mix())
    .label(text($small, $muted))
    .animate(motion);

final avatar = AvatarStyler()
    .size(30, 30)
    .color($raised())
    .shape($solidShape.mix())
    .label(text($small, $muted))
    .animate(motion);

final segments = SegmentedControlStyler()
    .padding(.all(3))
    .spacing(2)
    .color($raised())
    .shape($solidShape.mix())
    .item(
      .padding(.horizontal(12))
          .padding(.vertical(5))
          .shape($solidShape.mix())
          .label(text($small, $muted))
          .onSelected(.color($surface()).label(text($small))),
    )
    .animate(motion);

final switchStyle = SwitchStyler()
    .size(40, 24)
    .padding(.all(3))
    .shape($solidShape.mix())
    .trackColor($raised())
    .thumbColor($muted())
    .thumb(.size(18, 18).shape($solidShape.mix()))
    .onSelected(.color($accent()).thumbColor($onAccent()))
    .animate(motion);

final slider = SliderStyler()
    .trackColor($raised())
    .rangeColor($accent())
    .thumbColor($accent())
    .thumb(.shape($solidShape.mix()))
    .thumbSize(const Size(16, 16))
    .trackThickness(4)
    .rangeThickness(4)
    .animate(motion);

/// Neutral controls, so the accent stays on what the card is about.
final quietSlider = slider.rangeColor($muted()).thumbColor($ink());

final quietSwitch = switchStyle.onSelected(
  .color($ink()).thumbColor($canvas()),
);

final transportButton = IconButtonStyler()
    .size(38, 38)
    .color(Colors.transparent)
    .shape($solidShape.mix())
    .icon(.color($ink()).size(20))
    .onHovered(.color($raised()))
    .onPressed(.scale(0.92))
    .onFocusVisible(.shape($focusShape.mix()))
    .animate(motion);

final playButton = IconButtonStyler()
    .size(46, 46)
    .color($accent())
    .shape($solidShape.mix())
    .icon(.color($onAccent()).size(24))
    .onHovered(.scale(1.05))
    .onPressed(.scale(0.94))
    .onFocusVisible(.shape($focusShape.mix()))
    .animate(motion);

/// Resting bars use a tint of the accent, so the chart still reads as a chart.
// #docregion bar-style
BoxStyler barStyle({required double height, required bool active}) =>
    BoxStyler()
        .height(height)
        .shape($tinyShape.mix())
        .color(active ? $accent() : $accent().withValues(alpha: 0.25))
        .animate(.spring(320.ms));
// #enddocregion bar-style

// #docregion equalizer
BoxStyler equalizerBar(double peak, Duration beat) => BoxStyler()
    .width(3)
    .color($accent())
    .keyframeAnimation(
      timeline: [
        KeyframeTrack<double>('height', [
          .easeInOut(peak, beat),
          .easeInOut(5, beat),
        ], initial: 5),
      ],
      styleBuilder: (values, style) => style.height(values.get('height')),
    );
// #enddocregion equalizer
