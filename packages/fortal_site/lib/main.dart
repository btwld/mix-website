// The Fortal site: a showcase to browse, slide by slide. See `site.dart` for
// the slides and how to move between them.
import 'dart:ui' as ui;

import 'package:flutter/widgets.dart';

import 'backdrops.dart';
import 'hold.dart';
import 'site.dart';
import 'theme.dart';
import 'ui/ui.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  exposeFrameTimings();
  final (program, horizonProgram, dunesProgram) = await (
    ui.FragmentProgram.fromAsset('shaders/shore.frag'),
    ui.FragmentProgram.fromAsset('shaders/horizon.frag'),
    ui.FragmentProgram.fromAsset('shaders/dunes.frag'),
  ).wait;
  runApp(
    FortalSite(
      program: program,
      horizonProgram: horizonProgram,
      dunesProgram: dunesProgram,
    ),
  );
}

class FortalSite extends StatelessWidget {
  const FortalSite({
    super.key,
    required this.program,
    required this.horizonProgram,
    required this.dunesProgram,
  });

  final ui.FragmentProgram program;
  final ui.FragmentProgram horizonProgram;
  final ui.FragmentProgram dunesProgram;

  @override
  Widget build(BuildContext context) => ListenableBuilder(
    listenable: siteTheme,
    builder: (context, _) => WidgetsApp(
      title: 'Fortal',
      color: const Color(0xFF0D3D38),
      debugShowCheckedModeBanner: false,
      textStyle: const TextStyle(fontFamily: geist),
      pageRouteBuilder: <T>(settings, builder) => PageRouteBuilder<T>(
        settings: settings,
        pageBuilder: (context, animation, secondaryAnimation) =>
            builder(context),
      ),
      builder: (context, child) => UiTheme(
        mode: UiThemeMode.light,
        accent: siteAccent.value,
        radius: siteRadius.value,
        scaling: siteScaling.value,
        hasBackground: false,
        child: FortalTheme(
          accent: siteAccent.value,
          child: BackdropShaders(
            horizon: horizonProgram,
            dunes: dunesProgram,
            child: child!,
          ),
        ),
      ),
      home: Site(program: program, horizonProgram: horizonProgram),
    ),
  );
}
