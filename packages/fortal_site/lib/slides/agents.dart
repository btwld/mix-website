// The agents slide: one conversation with an agent getting Beira-mar 2.4
// ready, built from Fortal's eight agent surfaces. Each surface wears the
// Fortal recipe installed with it (`lib/ui/recipes`), passed as it comes:
// nothing here restyles them.
//
// There is no model. The agent's state is local data, moved on by timers, so
// every control answers: the permission can be approved or denied, the
// disclosures open and close, and the composer takes a message and gets a
// stand-in reply that streams in and can be stopped.
import 'dart:async';

import 'package:flutter/gestures.dart';
import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';
import 'package:remix/remix.dart';

import '../backdrops.dart';
import '../kit.dart';
import '../theme.dart';
import '../ui/ui.dart';

class AgentsSlide extends StatelessWidget {
  const AgentsSlide({super.key, this.active = true, this.compact = false});

  final bool active;
  final bool compact;

  @override
  Widget build(BuildContext context) => _Desk(active: active, compact: compact);
}

// The recipes, one per surface. They hold unresolved Fortal tokens, so one
// set serves every theme, radius and scaling.
final _message = uiAgentMessageRecipe();
final _answer = uiAgentAnswerRecipe();
final _transcript = uiAgentTranscriptRecipe();
final _plan = uiAgentPlanRecipe();
final _activity = uiAgentActivityRecipe();
final _permission = uiAgentPermissionRecipe();
final _execution = uiAgentExecutionRecipe();
final _composer = uiAgentComposerRecipe();

/// Where the publishing step stands.
enum _Publish { asking, publishing, published, denied }

/// A message from the visitor and the agent's reply. With no model behind
/// the page, every reply is the same short stand-in.
class _Turn {
  _Turn(this.id, this.prompt);

  final int id;
  final String prompt;
  var reply = '';
  var status = UiAnswerStatus.streaming;
}

const _firstAnswer =
    'The tests pass and the notes are written. May I send build 318 to the '
    '1,240 beta testers?';

const _publishedAnswer =
    'Published. Build 318 is on the beta channel and 1,240 testers have the '
    'notes. I tagged v2.4.0 and let Caio and Lia know.';

const _deniedAnswer =
    'Understood, nothing was published. The build and the notes are ready '
    'whenever you are.';

const _standIn =
    'Noted. I will keep that in mind for 2.4, and nothing goes out to '
    'testers without your go-ahead.';

const _publishSteps = [
  'Uploading build 2.4.0 (318) … done',
  'Publishing to the beta channel … done',
  'Emailing 1,240 testers … done',
];

const _testOutput =
    '\$ flutter test\n'
    '00:38 +247: test/release_notes_test.dart\n'
    '00:41 +248: All tests passed!';

/// How long each step of the pretend agent takes.
const _step = Duration(milliseconds: 420);

class _Desk extends StatefulWidget {
  const _Desk({required this.active, required this.compact});

  final bool active;
  final bool compact;

  @override
  State<_Desk> createState() => _DeskState();
}

class _DeskState extends State<_Desk> {
  final _draft = TextEditingController();
  final _scroll = ScrollController();

  /// Whether the conversation follows new output (see [_wheel]).
  var _follow = true;

  /// The pretend agent's timers, one per lane: the release, the first answer,
  /// the test run and the replies to the visitor. A new run in a lane
  /// replaces the one before it; the lanes run side by side.
  final _timers = <String, Timer>{};

  var _publish = _Publish.asking;
  var _publishLog = <String>[];
  var _closing = '';
  var _closingDone = false;

  // Whether the agent has finished the release, once the closing answer has
  // first come in. Retrying that answer does not undo the work.
  var _finished = false;

  // The first answer can be retried; it streams in again.
  var _first = _firstAnswer;
  var _firstStatus = UiAnswerStatus.complete;

  // The test run can be run again from its retry button.
  var _tests = UiExecutionStatus.success;

  final _turns = <_Turn>[];
  var _nextTurn = 0;

  /// How many of the visitor's messages came before the publishing question
  /// was answered, so the transcript keeps its order.
  var _decidedAt = 0;

  /// The answers whose copy button was used, by name, to say so.
  final _copied = <String>{};

  bool get _streaming =>
      _turns.any((turn) => turn.status == UiAnswerStatus.streaming);

  @override
  void dispose() {
    for (final timer in _timers.values) {
      timer.cancel();
    }
    _draft.dispose();
    _scroll.dispose();
    super.dispose();
  }

  /// Runs `steps` in `lane` one after another, `_step` apart.
  void _run(String lane, List<VoidCallback> steps) {
    _timers[lane]?.cancel();
    var i = 0;
    _timers[lane] = Timer.periodic(_step, (timer) {
      if (!mounted || i >= steps.length) {
        timer.cancel();
        return;
      }
      setState(steps[i++]);
    });
  }

  /// Streams `text` in a few words at a time through `write`, then calls
  /// `done`.
  List<VoidCallback> _streamSteps(
    String text,
    void Function(String) write,
    VoidCallback done,
  ) {
    final words = text.split(' ');
    const chunk = 4;
    return [
      for (var end = chunk; end < words.length + chunk; end += chunk)
        () => write(words.take(end).join(' ')),
      done,
    ];
  }

  /// Lets the transcript follow new output again, when the visitor acts.
  void _resume() => _follow = true;

  /// Works around the transcript's live edge, which the wheel cannot leave:
  /// the live edge reads the position before a wheel scroll moves it, so it
  /// keeps following and jumps back to the end on the next layout. So
  /// following stops when the wheel turns up and starts again once the wheel
  /// brings the conversation back to its end.
  void _wheel(PointerSignalEvent event) {
    if (event is! PointerScrollEvent) return;
    if (event.scrollDelta.dy < 0) {
      if (_follow) setState(() => _follow = false);
      return;
    }
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted || _follow || !_scroll.hasClients) return;
      final position = _scroll.position;
      if (position.maxScrollExtent - position.pixels <= Gap.x12) {
        setState(_resume);
      }
    });
  }

  void _approve() {
    setState(() {
      _resume();
      _publish = _Publish.publishing;
      _publishLog = [];
      _decidedAt = _turns.length;
    });
    _run('release', [
      for (final line in _publishSteps)
        () => _publishLog = [..._publishLog, line],
      () => _publish = _Publish.published,
      ..._streamSteps(
        _publishedAnswer,
        (text) => _closing = text,
        () => _closingDone = _finished = true,
      ),
    ]);
  }

  void _deny() {
    setState(() {
      _resume();
      _publish = _Publish.denied;
      _decidedAt = _turns.length;
    });
    _run(
      'release',
      _streamSteps(
        _deniedAnswer,
        (text) => _closing = text,
        () => _closingDone = true,
      ),
    );
  }

  void _retryFirst() {
    setState(() {
      _resume();
      _firstStatus = UiAnswerStatus.streaming;
      _copied.remove('first');
    });
    _run(
      'first',
      _streamSteps(
        _firstAnswer,
        (text) => _first = text,
        () => _firstStatus = UiAnswerStatus.complete,
      ),
    );
  }

  void _retryClosing() {
    final text = _publish == .denied ? _deniedAnswer : _publishedAnswer;
    setState(() {
      _resume();
      _closingDone = false;
      _copied.remove('closing');
    });
    _run(
      'release',
      _streamSteps(text, (text) => _closing = text, () => _closingDone = true),
    );
  }

  void _retryTests() {
    setState(() {
      _resume();
      _tests = UiExecutionStatus.running;
    });
    _run('tests', [() {}, () {}, () => _tests = UiExecutionStatus.success]);
  }

  void _send(String prompt) {
    final turn = _Turn(_nextTurn++, prompt);
    setState(() {
      _resume();
      _turns.add(turn);
    });
    _streamReply(turn);
  }

  void _streamReply(_Turn turn) {
    _run('reply', [
      () {},
      ..._streamSteps(
        _standIn,
        (text) => turn.reply = text,
        () => turn.status = UiAnswerStatus.complete,
      ),
    ]);
  }

  void _retryTurn(_Turn turn) {
    setState(() {
      _resume();
      turn.status = UiAnswerStatus.streaming;
      _copied.remove('turn ${turn.id}');
    });
    _streamReply(turn);
  }

  void _stop() {
    _timers.remove('reply')?.cancel();
    setState(() {
      for (final turn in _turns) {
        if (turn.status == UiAnswerStatus.streaming) {
          turn.status = UiAnswerStatus.complete;
        }
      }
    });
  }

  void _copy(String name, String text) {
    Clipboard.setData(ClipboardData(text: text));
    setState(() => _copied.add(name));
  }

  // ── The pieces ─────────────────────────────────────────────────────────────

  Widget _say(String text) => UiText(text, size: .size2);

  Widget _bea(String name, String text) => UiMessage(
    key: ValueKey(name),
    role: .user,
    showAvatar: true,
    avatar: const UiAvatar(label: 'B', variant: .solid, size: .size1),
    semanticLabel: 'Bea Lima',
    style: _message.style,
    surfaceStyle: _message.surfaceStyle,
    child: _say(text),
  );

  Widget _reply(
    String name,
    String text,
    UiAnswerStatus status, {
    required VoidCallback? onRetry,
    bool showActions = true,
  }) => UiAnswer(
    key: ValueKey(name),
    streamId: name,
    status: status,
    showActions: showActions,
    style: _answer.style,
    surfaceStyle: _answer.surfaceStyle,
    sourcesStyle: _answer.sourcesStyle,
    copyStyle: _answer.copyStyle,
    retryStyle: _answer.retryStyle,
    onCopy: () => _copy(name, text),
    onRetry: onRetry,
    feedback: _copied.contains(name) ? const Muted('Copied') : null,
    child: _say(text),
  );

  UiPermissionStatus get _permissionStatus => switch (_publish) {
    .asking => .pending,
    .publishing => .running,
    .published => .complete,
    .denied => .denied,
  };

  Widget _askToPublish() => UiPermission(
    requestId: 'publish 2.4',
    tool: 'release.publish',
    title: 'Publish 2.4 to the beta channel?',
    status: _permissionStatus,
    statusLabelBuilder: (status) => switch (status) {
      .pending => 'Waiting for your approval',
      .denied => 'Denied',
      _ => 'Approved',
    },
    parameters: const [
      RemixDataListItem(label: 'Channel', value: 'Beta'),
      RemixDataListItem(label: 'Build', value: '2.4.0 (318)'),
      RemixDataListItem(label: 'Testers', value: '1,240'),
      RemixDataListItem(label: 'Notes', value: 'notes/2.4.md'),
    ],
    allowOnceLabel: 'Approve',
    denyLabel: 'Deny',
    onAllowOnce: _approve,
    onDeny: _deny,
    style: _permission.style,
    surfaceStyle: _permission.surfaceStyle,
    detailsStyle: _permission.detailsStyle,
    parametersStyle: _permission.parametersStyle,
    allowOnceStyle: _permission.allowOnceStyle,
    alwaysAllowStyle: _permission.alwaysAllowStyle,
    denyStyle: _permission.denyStyle,
  );

  Widget _toolRun(
    String title, {
    required String tool,
    required UiExecutionStatus status,
    required String output,
    String? meta,
    VoidCallback? onRetry,
    bool defaultExpanded = true,
  }) => UiExecution(
    key: ValueKey(title),
    tool: tool,
    title: title,
    status: status,
    meta: meta,
    defaultExpanded: defaultExpanded,
    style: _execution.style,
    surfaceStyle: _execution.surfaceStyle,
    disclosureStyle: _execution.disclosureStyle,
    copyStyle: _execution.copyStyle,
    retryStyle: _execution.retryStyle,
    onCopy: () => Clipboard.setData(ClipboardData(text: output)),
    onRetry: onRetry,
    child: _Output(output),
  );

  Widget _testRun() => _toolRun(
    'Run the test suite',
    tool: 'flutter test',
    status: _tests,
    meta: _tests == .running ? null : '41 s',
    output: _testOutput,
    onRetry: _retryTests,
    defaultExpanded: false,
  );

  Widget _publishRun() => _toolRun(
    'Publish to beta',
    tool: 'release.publish',
    status: _publish == .publishing ? .running : .success,
    meta: _publish == .publishing ? null : '3 s',
    output: _publishLog.join('\n'),
  );

  List<Widget> _conversation() => [
    _bea(
      'request',
      'Get 2.4 ready for Friday: run the tests, write the notes and send it '
          'to the beta testers.',
    ),
    _testRun(),
    // The agent's turn is not over while it waits for an answer, so its
    // reply offers copy and retry only once the question is settled.
    _reply(
      'first',
      _first,
      _firstStatus,
      onRetry: _retryFirst,
      showActions: _publish != .asking,
    ),
    _askToPublish(),
    ..._visitor(_publish == .asking ? _turns : _turns.take(_decidedAt)),
    if (_publish != .asking && _publish != .denied) _publishRun(),
    if (_closing.isNotEmpty)
      _reply(
        'closing',
        _closing,
        _closingDone ? .complete : .streaming,
        onRetry: _retryClosing,
      ),
    if (_publish != .asking) ..._visitor(_turns.skip(_decidedAt)),
  ];

  /// The visitor's messages, each with the agent's stand-in reply.
  List<Widget> _visitor(Iterable<_Turn> turns) => [
    for (final turn in turns) ...[
      _bea('prompt ${turn.id}', turn.prompt),
      if (turn.reply.isNotEmpty || turn.status == .complete)
        _reply(
          'turn ${turn.id}',
          turn.reply,
          turn.status,
          // Replies share one timer lane, so an older reply cannot be
          // retried while another streams; retrying would orphan it.
          onRetry: _streaming ? null : () => _retryTurn(turn),
        ),
    ],
  ];

  Widget _transcriptOf(List<Widget> children) => Listener(
    onPointerSignal: _wheel,
    child: UiTranscript(
      controller: _scroll,
      followOutput: _follow,
      busy: _publish == .publishing || _streaming,
      style: _transcript.style,
      children: children,
    ),
  );

  Widget _composerBox() => UiComposer(
    controller: _draft,
    running: _streaming,
    onSubmit: _send,
    onStop: _stop,
    hintText: 'Reply to the agent',
    semanticLabel: 'Message the agent',
    leading: const UiBadge(label: 'Beira-mar 2.4'),
    style: _composer.style,
    surfaceStyle: _composer.surfaceStyle,
    fieldStyle: _composer.fieldStyle,
    submitStyle: _composer.submitStyle,
    stopStyle: _composer.stopStyle,
  );

  List<UiPlanItem> get _planItems => [
    const UiPlanItem(
      id: 'merge',
      title: 'Merge the 2.4 changes',
      status: .completed,
      detail: '12 PRs',
    ),
    const UiPlanItem(
      id: 'tests',
      title: 'Run the test suite',
      status: .completed,
      detail: '248 passed',
    ),
    const UiPlanItem(
      id: 'ios',
      title: 'Raise the minimum iOS',
      status: .cancelled,
      detail: 'Moved to 2.5',
    ),
    const UiPlanItem(
      id: 'notes',
      title: 'Write the release notes',
      status: .completed,
      detail: '12 changes',
    ),
    UiPlanItem(
      id: 'publish',
      title: 'Publish to beta',
      status: switch (_publish) {
        .asking || .publishing => .inProgress,
        .published => .completed,
        .denied => .cancelled,
      },
      detail: _publish == .asking ? 'Needs approval' : null,
    ),
    UiPlanItem(
      id: 'tag',
      title: 'Tag v2.4.0, tell the team',
      status: switch (_publish) {
        .published when _finished => .completed,
        .denied => .cancelled,
        _ => .pending,
      },
    ),
  ];

  // The plan and the activity stay open when the work is done: the side card
  // is theirs alone, and would otherwise be left empty.
  Widget _planBox() => UiPlan(
    items: _planItems,
    collapseOnComplete: false,
    style: _plan.style,
    disclosureStyle: _plan.disclosureStyle,
  );

  List<UiActivityItem> get _activityItems => [
    const UiActivityItem(
      id: 'read',
      title: 'Read milestone 2.4',
      detail: '25 tasks, 12 pull requests',
      status: .complete,
    ),
    const UiActivityItem(
      id: 'test',
      title: 'Ran flutter test',
      status: .complete,
    ),
    const UiActivityItem(
      id: 'notes',
      title: 'Wrote notes/2.4.md',
      detail: '4 new, 5 improved, 3 fixed',
      status: .complete,
    ),
    UiActivityItem(
      id: 'ask',
      title: 'Asked Bea to approve publishing',
      status: _publish == .asking ? .active : .complete,
    ),
    if (_publish == .publishing || _publish == .published)
      UiActivityItem(
        id: 'publish',
        title: 'Published build 318 to beta',
        status: _publish == .published ? .complete : .active,
      ),
    if (_publish == .published && _finished) ...[
      const UiActivityItem(
        id: 'tag',
        title: 'Tagged v2.4.0',
        status: .complete,
      ),
      const UiActivityItem(
        id: 'tell',
        title: 'Messaged Caio and Lia',
        status: .complete,
      ),
    ],
  ];

  bool get _working =>
      _publish == .asking ||
      _publish == .publishing ||
      (_publish == .published && !_finished);

  Widget _activityBox() => UiActivity(
    items: _activityItems,
    status: _working ? .working : .complete,
    collapseOnComplete: false,
    style: _activity.style,
    disclosureStyle: _activity.disclosureStyle,
  );

  @override
  Widget build(BuildContext context) {
    final heading = SlideHeading(
      label: 'Agents',
      title: 'Agents that show their work.',
      detail: 'An agent gets Beira-mar 2.4 ready: it plans, runs the tests and asks first.',
      onDark: true,
      compact: widget.compact,
    );
    final backdrop = SandBackdrop(scene: 2, active: widget.active);
    // Fortal's small card, so the conversation fits the canvas at 110%.
    // On a wide screen both cards take the height they are given: the
    // conversation fills with its transcript, and the activity sits at the
    // foot, level with the composer.
    Widget chat({required bool fill}) => UiCard(
      child: Column(
        crossAxisAlignment: .stretch,
        mainAxisSize: fill ? .max : .min,
        children: [
          if (fill)
            Expanded(child: _transcriptOf(_conversation()))
          else
            _transcriptOf(_conversation()),
          const SizedBox(height: Gap.x2),
          _composerBox(),
        ],
      ),
    );
    Widget side({required bool fill}) => UiCard(
      child: Column(
        crossAxisAlignment: .stretch,
        mainAxisSize: fill ? .max : .min,
        children: [
          _planBox(),
          const SizedBox(height: Gap.x3),
          if (fill) const Spacer(),
          _activityBox(),
        ],
      ),
    );
    if (widget.compact) {
      return NarrowSection(
        backdrop: backdrop,
        children: [heading, chat(fill: false), side(fill: false)],
      );
    }
    return SlideFrame(
      backdrop: backdrop,
      child: Stack(
        children: [
          Positioned(left: gutter, top: headingTop, width: 900, child: heading),
          // Two cards on the grid, tops aligned and both ending 48 above the
          // foot (12 at Fortal's 110% scale, as on the components slides):
          // the conversation over two walls, the plan and activity over the
          // third.
          Positioned(
            left: gutter,
            right: gutter,
            top: headingTop + 114 + Gap.x12,
            bottom: UiTheme.of(context).scaling == UiScaling.percent110
                ? Gap.x3
                : Gap.x12,
            child: Row(
              crossAxisAlignment: .stretch,
              spacing: Gap.x6,
              children: [
                SizedBox(
                  width: 2 * wallWidth + Gap.x6,
                  child: chat(fill: true),
                ),
                Expanded(child: side(fill: true)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// A tool's output, in the site's code face at Fortal's smallest text size.
class _Output extends StatelessWidget {
  const _Output(this.text);

  final String text;

  @override
  Widget build(BuildContext context) => Text(
    text,
    style: MixScope.tokenOf(
      UiTokens.text1,
      context,
    ).copyWith(fontFamily: mono, color: tokenColor(context, UiTokens.gray12)),
  );
}
