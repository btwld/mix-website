import 'dart:async';

import 'package:flutter/widgets.dart';

import 'tokens.dart';

/// What the stage shows. These are options under review, not final features.
enum Subject { deck, single, phone, app }

enum Screen { tasks, team, settings }

enum SpendRange { thisWeek, lastWeek }

enum TaskFilter { all, active, done }

enum Role { owner, editor, viewer }

class Task {
  Task(this.title, this.tag, this.owner, {this.done = false});

  final String title;
  final String tag;
  final String owner;
  bool done;
}

class Track {
  Track(this.title, this.artist, this.seconds, {this.liked = false});

  final String title;
  final String artist;
  final int seconds;
  bool liked;

  String get length => formatTime(seconds);
}

String formatTime(int seconds) => '${seconds ~/ 60}:${(seconds % 60).toString().padLeft(2, '0')}';

class Person {
  Person(this.name, this.job, {this.invited = false});

  final String name;
  final String job;
  bool invited;

  String get initials => name.split(' ').map((part) => part[0]).take(2).join();
}

class Member {
  Member(this.name, this.email, this.role);

  final String name;
  final String email;
  Role role;

  String get initials => name.split(' ').map((part) => part[0]).take(2).join();
}

List<Task> _seedTasks() => [
  Task('Write the release notes', 'Docs', 'AM', done: true),
  Task('Review onboarding copy', 'Design', 'BC', done: true),
  Task('QA the billing flow', 'Eng', 'DR'),
  Task('Finish the pricing page', 'Design', 'BC'),
  Task('Schedule the launch email', 'Growth', 'EL'),
  Task('Record the product walkthrough', 'Growth', 'AM'),
];

List<Track> _seedTracks() => [
  Track('Glass Hours', 'Marrow & Vale', 228, liked: true),
  Track('Low Orbit', 'Ines Okafor', 196),
  Track('Soft Static', 'The Long Room', 263, liked: true),
  Track('Night Ferry', 'Harbor Lights', 241),
];

List<Person> _seedPeople() => [
  Person('Ana Moreira', 'Product design', invited: true),
  Person('Bruno Costa', 'Engineering'),
  Person('Dara Reyes', 'Research'),
];

List<Task> _seedToday() => [
  Task('Review onboarding', 'Design', 'AM', done: true),
  Task('QA the billing flow', 'Eng', 'DR'),
  Task('Ship pricing page', 'Growth', 'BC'),
];

List<Member> _seedTeam() => [
  Member('Ana Moreira', 'ana@launchpad.test', Role.owner),
  Member('Bruno Costa', 'bruno@launchpad.test', Role.editor),
  Member('Dara Reyes', 'dara@launchpad.test', Role.editor),
  Member('Eli Laurent', 'eli@launchpad.test', Role.viewer),
];

/// All state is local to the page. Nothing here reaches a server.
class Showcase extends ChangeNotifier {
  Showcase({this.onEvent});

  /// Tells the host page about changes made inside the app.
  final void Function(Map<String, Object?> event)? onEvent;

  Look look = midnight;
  Subject subject = Subject.deck;
  Screen screen = Screen.tasks;
  bool xray = false;
  bool naked = false;
  bool phone = false;

  Color? accent;
  double? corner;

  List<Task> tasks = _seedTasks();
  List<Member> team = _seedTeam();
  TaskFilter filter = TaskFilter.all;

  String workspace = 'Launchpad';
  bool weekly = true;
  bool mentions = false;
  bool saved = false;

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

  Timer? _playback;
  Timer? _clock;

  Track get track => tracks[current];

  /// Phone mode swaps the width, so the phone subject grows when it is on.
  bool get framed => phone != (subject == Subject.phone);

  Look get activeLook => naked ? bare : look;

  int get doneCount => tasks.where((task) => task.done).length;

  List<Task> get visibleTasks => switch (filter) {
    TaskFilter.all => tasks,
    TaskFilter.active => tasks.where((task) => !task.done).toList(),
    TaskFilter.done => tasks.where((task) => task.done).toList(),
  };

  /// Applies a partial update from the host page.
  void apply(Map<String, Object?> patch) {
    final lookId = patch['look'];
    if (lookId is String) {
      look = looks.firstWhere((item) => item.id == lookId, orElse: () => look);
      accent = null;
      corner = null;
      flat = false;
    }
    final screenId = patch['screen'];
    if (screenId is String) {
      screen = Screen.values.firstWhere((item) => item.name == screenId, orElse: () => screen);
    }
    if (patch['xray'] case final bool value) xray = value;
    if (patch['naked'] case final bool value) naked = value;
    if (patch['phone'] case final bool value) phone = value;
    if (patch['reduceMotion'] case final bool value) reduceMotion = value;
    final subjectId = patch['subject'];
    if (subjectId is String) {
      subject = Subject.values.firstWhere((item) => item.name == subjectId, orElse: () => subject);
    }
    if (patch.containsKey('highlight')) highlight = patch['highlight'] as String?;
    if (patch['play'] == 'complete') _playCompletion();
    if (patch['play'] == 'music') setPlaying(true);
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

  void like(Track item) {
    item.liked = !item.liked;
    notifyListeners();
  }

  void invitePerson(Person person) {
    person.invited = !person.invited;
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

  void go(Screen next) {
    screen = next;
    onEvent?.call({'screen': next.name});
    notifyListeners();
  }

  void toggle(Task task) {
    task.done = !task.done;
    notifyListeners();
  }

  String? addTask(String title) {
    final clean = title.trim();
    if (clean.isEmpty) return 'Name the task first.';
    tasks = [Task(clean, 'New', 'AM'), ...tasks];
    filter = TaskFilter.all;
    notifyListeners();
    return null;
  }

  void setFilter(TaskFilter next) {
    filter = next;
    notifyListeners();
  }

  void setRole(Member member, Role role) {
    member.role = role;
    notifyListeners();
  }

  void removeMember(Member member) {
    team = team.where((item) => item != member).toList();
    notifyListeners();
  }

  String? invite(String email) {
    final clean = email.trim().toLowerCase();
    if (!RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(clean)) {
      return 'Enter a valid email address.';
    }
    if (team.any((member) => member.email == clean)) {
      return '$clean is already on the team.';
    }
    final name = clean.split('@').first;
    team = [...team, Member('${name[0].toUpperCase()}${name.substring(1)} Invited', clean, Role.viewer)];
    notifyListeners();
    return null;
  }

  void setWorkspace(String value) {
    workspace = value;
    saved = false;
    notifyListeners();
  }

  void setWeekly(bool value) {
    weekly = value;
    saved = false;
    notifyListeners();
  }

  void setMentions(bool value) {
    mentions = value;
    saved = false;
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

  void save() {
    saved = true;
    notifyListeners();
  }

  void reset() {
    _playback?.cancel();
    tasks = _seedTasks();
    team = _seedTeam();
    filter = TaskFilter.all;
    workspace = 'Launchpad';
    weekly = true;
    mentions = false;
    saved = false;
    accent = null;
    corner = null;
    flat = false;
    notifyListeners();
  }

  void _playCompletion() {
    _playback?.cancel();
    filter = TaskFilter.all;
    if (tasks.every((task) => task.done)) tasks = _seedTasks();
    var remaining = 3;
    _playback = Timer.periodic(const Duration(milliseconds: 620), (timer) {
      final next = tasks.where((task) => !task.done).firstOrNull;
      if (next == null || remaining == 0) {
        timer.cancel();
        return;
      }
      next.done = true;
      remaining--;
      notifyListeners();
    });
  }

  @override
  void dispose() {
    _playback?.cancel();
    _clock?.cancel();
    position.dispose();
    super.dispose();
  }
}

class ShowcaseScope extends InheritedNotifier<Showcase> {
  const ShowcaseScope({super.key, required Showcase showcase, required super.child})
    : super(notifier: showcase);

  static Showcase of(BuildContext context) =>
      context.dependOnInheritedWidgetOfExactType<ShowcaseScope>()!.notifier!;
}
