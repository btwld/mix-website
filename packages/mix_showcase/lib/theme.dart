import 'package:flutter/widgets.dart';
import 'package:mix/mix.dart';

// #docregion tokens
// A token is a name with a type. It has no value of its own.
const $canvas = ColorToken('canvas');
const $surface = ColorToken('surface');
const $outline = ColorToken('outline');
const $ink = ColorToken('ink');
const $muted = ColorToken('muted');
const $primary = ColorToken('primary');
const $primaryHover = ColorToken('primary.hover');
const $onPrimary = ColorToken('on-primary');

const $radius = RadiusToken('radius');
const $gap = SpaceToken('gap');

const $title = TextStyleToken('title');
const $body = TextStyleToken('body');
const $label = TextStyleToken('label');
// #enddocregion tokens

/// One value for every token. Styles never read this class: they only name
/// tokens, and the nearest [MixScope] supplies the values.
class ThemeValues {
  const ThemeValues({
    required this.colors,
    required this.radius,
    required this.gap,
    required this.font,
    this.titleFont,
    this.titleWeight = FontWeight.w700,
  });

  final Map<ColorToken, Color> colors;
  final double radius;
  final double gap;
  final String font;
  final String? titleFont;
  final FontWeight titleWeight;

  Map<TextStyleToken, TextStyle> get textStyles => {
    $title: TextStyle(
      fontFamily: titleFont ?? font,
      fontSize: 26,
      fontWeight: titleWeight,
      height: 1.15,
    ),
    $body: TextStyle(
      fontFamily: font,
      fontSize: 14,
      height: 1.45,
    ),
    $label: TextStyle(
      fontFamily: font,
      fontSize: 14,
      fontWeight: FontWeight.w600,
      height: 1.2,
    ),
  };
}

// #docregion theme-midnight
final midnight = ThemeValues(
  colors: {
    $canvas: Color(0xFF0D0B14),
    $surface: Color(0xFF17141F),
    $outline: Color(0xFF322B45),
    $ink: Color(0xFFF4F2FA),
    $muted: Color(0xFF9A93AE),
    $primary: Color(0xFF8B5CF6),
    $primaryHover: Color(0xFF9D75FA),
    $onPrimary: Color(0xFFFFFFFF),
  },
  radius: 12,
  gap: 16,
  font: 'Geist',
);
// #enddocregion theme-midnight

// #docregion theme-paper
final paper = ThemeValues(
  colors: {
    $canvas: Color(0xFFF3EDE1),
    $surface: Color(0xFFFBF8F1),
    $outline: Color(0xFFD6CCB8),
    $ink: Color(0xFF1F1B14),
    $muted: Color(0xFF766C5A),
    $primary: Color(0xFFB03A23),
    $primaryHover: Color(0xFF96301C),
    $onPrimary: Color(0xFFFFFAF2),
  },
  radius: 3,
  gap: 20,
  font: 'LibreFranklin',
  titleFont: 'AbrilFatface',
  titleWeight: FontWeight.w400,
);
// #enddocregion theme-paper

// #docregion theme-pop
final pop = ThemeValues(
  colors: {
    $canvas: Color(0xFFFFD83D),
    $surface: Color(0xFFFFFFFF),
    $outline: Color(0xFF111111),
    $ink: Color(0xFF111111),
    $muted: Color(0xFF4A4A4A),
    $primary: Color(0xFF2540FF),
    $primaryHover: Color(0xFF1228C9),
    $onPrimary: Color(0xFFFFFFFF),
  },
  radius: 24,
  gap: 14,
  font: 'Montserrat',
);
// #enddocregion theme-pop

// #docregion theme-terminal
final terminal = ThemeValues(
  colors: {
    $canvas: Color(0xFF04120B),
    $surface: Color(0xFF071B11),
    $outline: Color(0xFF14502F),
    $ink: Color(0xFFBDF8D3),
    $muted: Color(0xFF4FA070),
    $primary: Color(0xFF2BFF88),
    $primaryHover: Color(0xFF7DFFB6),
    $onPrimary: Color(0xFF04120B),
  },
  radius: 0,
  gap: 16,
  font: 'GeistMono',
  titleWeight: FontWeight.w500,
);
// #enddocregion theme-terminal

/// The themes the page offers, by the id it sends.
final themes = {
  'midnight': midnight,
  'paper': paper,
  'pop': pop,
  'terminal': terminal,
};

/// Provides one theme's values to every style below it.
class ThemeScope extends StatelessWidget {
  const ThemeScope({
    super.key,
    required this.theme,
    required this.child,
  });

  final ThemeValues theme;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    // #docregion scope
    return MixScope(
      colors: theme.colors,
      radii: {$radius: Radius.circular(theme.radius)},
      spaces: {$gap: theme.gap},
      textStyles: theme.textStyles,
      child: child,
    );
    // #enddocregion scope
  }
}
