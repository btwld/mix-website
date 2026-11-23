// Renders the narrow layout's backdrops as pictures, from the same shaders and
// drawing code the wide layout runs live (`lib/backdrops.dart`): the lagoons
// behind the page and the Themes horizon in each accent, and the Beira-Mar
// photo with its sea. A phone then loads one small picture for each, and no
// shader but the shore's.
//
//   flutter test tool/render_stills_test.dart
//
// Writes assets/stills/*.webp (needs `cwebp`). Run it again after changing a
// backdrop's shader, colours or the Themes section's layout.
import 'dart:io';
import 'dart:ui' as ui;

import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:fortal_landing/backdrops.dart';
import 'package:fortal_landing/kit.dart';
import 'package:fortal_landing/slides/themes.dart';
import 'package:fortal_landing/theme.dart';
import 'package:fortal_landing/ui/ui.dart';
import 'package:remix/remix.dart' show ColorToken;

/// Texture pixels per design pixel. The narrow column is designed 480 wide
/// and scaled to the screen, so 2 is 960 pixels across: sharper than the
/// live backdrops, which keep at most 2 per logical pixel of a phone's ~400.
const _scale = 2.0;

/// The lagoons fill the screen behind the narrow page: a phone's shape.
const _screen = Size(narrowWidth, 1040);

const _out = 'assets/stills';

void main() {
  setUpAll(() async {
    final family = FontLoader(geist);
    for (final weight in ['Regular', 'Medium', 'SemiBold', 'Bold']) {
      family.addFont(rootBundle.load('assets/fonts/Geist-$weight.ttf'));
    }
    await family.load();
    await (FontLoader(
      mono,
    )..addFont(rootBundle.load('assets/fonts/RobotoMono.ttf'))).load();
  });

  testWidgets('render the narrow layout stills', (tester) async {
    final dunes = await ui.FragmentProgram.fromAsset('shaders/dunes.frag');
    final horizon = await ui.FragmentProgram.fromAsset('shaders/horizon.frag');
    final city = (await tester.runAsync(CityPhoto.load))!;

    // The Themes section's own shape, laid out at the column's design width.
    tester.view.physicalSize = const Size(narrowWidth, 6000);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.reset);
    await tester.pumpWidget(
      Directionality(
        textDirection: TextDirection.ltr,
        child: UiTheme(
          hasBackground: false,
          child: FortalTheme(
            accent: siteAccent.value,
            child: const SingleChildScrollView(
              child: ThemesSlide(compact: true),
            ),
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();
    final themes = tester.getSize(find.byType(NarrowSection));
    await tester.pumpWidget(const SizedBox.shrink());

    Directory(_out).createSync(recursive: true);
    final written = <String>[];
    Future<void> render(String name, Size size, void Function(Canvas) draw) =>
        tester.runAsync(() async {
          final recorder = ui.PictureRecorder();
          draw(Canvas(recorder)..scale(_scale));
          final picture = recorder.endRecording();
          final image = await picture.toImage(
            (size.width * _scale).round(),
            (size.height * _scale).round(),
          );
          picture.dispose();
          final png = (await image.toByteData(format: ui.ImageByteFormat.png))!;
          image.dispose();
          final source = File('${Directory.systemTemp.path}/still-$name.png')
            ..writeAsBytesSync(png.buffer.asUint8List());
          final webp = '$_out/$name.webp';
          final result = await Process.run('cwebp', [
            '-quiet', '-q', '82', '-m', '6', '-sharp_yuv', //
            source.path, '-o', webp,
          ]);
          expect(result.exitCode, 0, reason: '${result.stderr}');
          source.deleteSync();
          written.add('$webp ${File(webp).lengthSync() ~/ 1024} KB');
        });

    for (final accent in UiAccentColor.values) {
      final light = themeTokens(accent);
      Color at(ColorToken token) => light[token]! as Color;
      await render(
        'dunes-${accent.name}',
        _screen,
        (canvas) => drawDunes(
          canvas,
          _screen,
          dunes.fragmentShader(),
          time: stillTime,
          // The lagoon overlook, as SharedSandBackdrop draws it.
          scene: 2,
          water: at(UiTokens.accent9),
          deepWater: at(UiTokens.accent11),
        ),
      );
      await render(
        'horizon-${accent.name}',
        themes,
        (canvas) => drawHorizon(
          canvas,
          themes,
          horizon.fragmentShader(),
          time: stillTime,
          mode: 0,
          sky: at(UiTokens.accent3),
          haze: at(UiTokens.accent1),
          sea: at(UiTokens.accent8),
          deep: at(UiTokens.accent10),
        ),
      );
    }
    // The whole photo, at its own size: any frame crops it as the shader would.
    final photo = Size(city.photo.width / _scale, city.photo.height / _scale);
    await render(
      'city',
      photo,
      (canvas) => drawCity(
        canvas,
        photo,
        city.program.fragmentShader(),
        time: stillTime,
        photo: city,
      ),
    );
    // ignore: avoid_print
    print('Themes section $themes\n${written.join('\n')}');
  });
}
