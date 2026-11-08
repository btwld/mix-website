import 'dart:async';

import 'package:flutter/widgets.dart';

import 'tokens.dart';

enum SpendRange { thisWeek, lastWeek }

class Task {
  Task(this.title, this.tag, {this.done = false});

  final String title;
  final String tag;
  bool done;
}

class Track {
  Track(this.title, this.artist, this.seconds);

  final String title;
  final String artist;
  final int seconds;

  String get length => formatTime(seconds);
}

String formatTime(int seconds) =>
    '${seconds ~/ 60}:${(seconds % 60).toString().padLeft(2, '0')}';

class Person {
  Person(this.name, this.job, {this.invited = false});

  final String name;
  final String job;
  bool invited;

  String get initials => name.split(' ').map((part) => part[0]).take(2).join();
}

List<Track> _seedTracks() => [
  Track('Glass Hours', 'Marrow & Vale', 228),
  Track('Low Orbit', 'Ines Okafor', 196),
  Track('Soft Static', 'The Long Room', 263),
  Track('Night Ferry', 'Harbor Lights', 241),
];

List<Person> _seedPeople() => [
  Person('Ana Moreira', 'Product design', invited: true),
  Person('Bruno Costa', 'Engineering'),
  Person('Dara Reyes', 'Research'),
];

List<Task> _seedToday() => [
  Task('Review onboarding', 'Design', done: true),
  Task('QA the billing flow', 'Eng'),
  Task('Ship pricing page', 'Growth'),
];

/// All state is local to the page. Nothing here reaches a server.
class Showcase extends ChangeNotifier {
  Look look = midnight;
  bool xray = false;
  bool naked = false;
  bool phone = false;

  Color? accent;
  double? corner;

  List<Track> tracks = _seedTracks();
  List<Person> people = _seedPeople();
  List<Task> today = _seedToday();
  int current = 0;
  bool playing = false;
  SpendRange range = SpendRange.thisWeek;
  int? spendDay;

  /// Whether Make it yours has turned the look's shadows off.
  bool flat = false;

  /// The reader's motion preference, passed in by the host page.
  bool reduceMotion = false;

  /// Which block the tour is pointing at, if any.
  String? highlight;

  /// Playback position, kept apart so ticking does not rebuild every card.
  final position = ValueNotifier<double>(0.32);

  Timer? _clock;

  Track get track => tracks[current];

  Look get activeLook => naked ? bare : look;

  /// Applies a partial update from the host page.
  void apply(Map<String, Object?> patch) {
    final lookId = patch['look'];
    if (lookId is String) {
      look = looks.firstWhere((item) => item.id == lookId, orElse: () => look);
      accent = null;
      corner = null;
      flat = false;
    }
    if (patch['xray'] case final bool value) xray = value;
    if (patch['naked'] case final bool value) naked = value;
    if (patch['phone'] case final bool value) phone = value;
    if (patch['reduceMotion'] case final bool value) reduceMotion = value;
    if (patch.containsKey('highlight'))
      highlight = patch['highlight'] as String?;
    notifyListeners();
  }

  void setPlaying(bool value) {
    playing = value;
    _clock?.cancel();
    if (value) {
      _clock = Timer.periodic(const Duration(milliseconds: 500), (_) {
        final next = position.value + 0.5 / track.seconds;
        if (next >= 1) {
          skip(1);
        } else {
          position.value = next;
        }
      });
    }
    notifyListeners();
  }

  void skip(int by) {
    current = (current + by) % tracks.length;
    position.value = 0;
    notifyListeners();
  }

  void seek(double value) => position.value = value;

  void setInvited(Person person, bool value) {
    person.invited = value;
    notifyListeners();
  }

  void setRange(SpendRange next) {
    range = next;
    notifyListeners();
  }

  void setSpendDay(int? day) {
    spendDay = day;
    notifyListeners();
  }

  void setFlat(bool value) {
    flat = value;
    notifyListeners();
  }

  void toggle(Task task) {
    task.done = !task.done;
    notifyListeners();
  }

  void setAccent(Color? value) {
    accent = value;
    notifyListeners();
  }

  void setCorner(double value) {
    corner = value;
    notifyListeners();
  }

  @override
  void dispose() {
    _clock?.cancel();
    position.dispose();
    super.dispose();
  }
}

class ShowcaseScope extends InheritedNotifier<Showcase> {
  const ShowcaseScope({
    super.key,
    required Showcase showcase,
    required super.child,
  }) : super(notifier: showcase);

  static Showcase of(BuildContext context) =>
      context.dependOnInheritedWidgetOfExactType<ShowcaseScope>()!.notifier!;
}
