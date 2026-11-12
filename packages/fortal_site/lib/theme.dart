// The site's Fortal theme.
//
// Fortal resolves a theme to one map of Mix tokens; handing that map to
// MixScope styles every real component in the subtree. The whole site follows
// one accent, which the Themes slide changes.
import 'package:flutter/widgets.dart';
import 'package:remix/remix.dart';

import 'ui/theme/theme_data.dart';
import 'ui/ui.dart';

const geist = 'Geist';
const mono = 'RobotoMono';

/// The accent the whole site wears.
final siteAccent = ValueNotifier(UiAccentColor.mar);

/// The corner radius and the scale the whole site wears.
final siteRadius = ValueNotifier(UiRadius.medium);
final siteScaling = ValueNotifier(UiScaling.percent100);

/// Everything a visitor can change about the theme.
final siteTheme = Listenable.merge([siteAccent, siteRadius, siteScaling]);

/// Fortal's seven themes, by the names it gives them.
const accentNames = {
  UiAccentColor.orla: 'Orla',
  UiAccentColor.mar: 'Mar',
  UiAccentColor.ceu: 'Céu',
  UiAccentColor.serra: 'Serra',
  UiAccentColor.sol: 'Sol',
  UiAccentColor.duna: 'Duna',
  UiAccentColor.caju: 'Caju',
};

typedef Tokens = Map<MixToken<Object?>, Object>;

/// A theme's resolved tokens, with every text style set in Geist.
Tokens themeTokens(
  UiAccentColor accent, {
  bool dark = false,
  UiRadius? radius,
  UiScaling? scaling,
}) => {
  for (final MapEntry(:key, :value) in buildUiScopeTokens(
    dark
        ? UiThemeData.dark(
            accent: accent,
            radius: radius ?? siteRadius.value,
            scaling: scaling ?? siteScaling.value,
            hasBackground: false,
          )
        : UiThemeData.light(
            accent: accent,
            radius: radius ?? siteRadius.value,
            scaling: scaling ?? siteScaling.value,
            hasBackground: false,
          ),
  ).entries)
    key: value is TextStyle ? value.copyWith(fontFamily: geist) : value,
};

class FortalTheme extends StatelessWidget {
  const FortalTheme({
    super.key,
    required this.accent,
    this.dark = false,
    this.radius,
    required this.child,
  });

  final UiAccentColor accent;
  final bool dark;
  final UiRadius? radius;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final tokens = themeTokens(accent, dark: dark, radius: radius);
    final ink = tokens[UiTokens.gray12]! as Color;
    return MixScope(
      tokens: tokens,
      child: DefaultTextStyle.merge(
        style: TextStyle(fontFamily: geist, color: ink),
        child: IconTheme.merge(
          data: IconThemeData(color: ink),
          child: child,
        ),
      ),
    );
  }
}

/// A token's colour in the theme around `context`.
Color tokenColor(BuildContext context, ColorToken token) =>
    MixScope.tokenOf(token, context);
