// The Fortal site: a showcase to browse, slide by slide. See `site.dart` for
// the slides and how to move between them.
import 'dart:ui' as ui;

import 'package:flutter/widgets.dart';

import 'backdrops.dart';
import 'hold.dart';
import 'kit.dart' show isNarrow;
import 'site.dart';
import 'theme.dart';
import 'ui/ui.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  exposeFrameTimings();
  final shore = ui.FragmentProgram.fromAsset('shaders/shore.frag');
  // The wide layout draws its dunes and horizon on its first frame. A page
  // that opens narrow (a phone) shows pictures of them instead and loads
  // only the shore's shader; it loads the others if it later turns wide.
  final view = ui.PlatformDispatcher.instance.views.first;
  final screen = view.physicalSize / view.devicePixelRatio;
  if (screen.isEmpty || !isNarrow(screen)) await BackdropPrograms.load();
  runApp(FortalSite(program: await shore));
}

class FortalSite extends StatelessWidget {
  const FortalSite({super.key, required this.program});

  final ui.FragmentProgram program;

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
          child: ValueListenableBuilder(
            valueListenable: BackdropPrograms.loaded,
            builder: (context, programs, child) => BackdropShaders(
              horizon: programs?.horizon,
              dunes: programs?.dunes,
              child: child!,
            ),
            child: child,
          ),
        ),
      ),
      home: Site(program: program),
    ),
  );
}
