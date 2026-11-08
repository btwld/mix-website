import 'package:flutter/material.dart' show Icons;
import 'package:flutter/widgets.dart';
import 'package:naked_ui/naked_ui.dart';
import 'package:remix/remix.dart';

import 'showcase.dart';
import 'styles.dart';
import 'tokens.dart';

/// The trigger keeps its focus node through the dialog and invited-state rebuild.
class InviteButton extends StatefulWidget {
  const InviteButton({super.key, required this.person});

  final Person person;

  @override
  State<InviteButton> createState() => _InviteButtonState();
}

class _InviteButtonState extends State<InviteButton> {
  final _focus = FocusNode(debugLabel: 'Invite');
  bool _opening = false;

  Future<void> _press() async {
    if (_opening) return;
    final showcase = ShowcaseScope.of(context);
    _focus.requestFocus();
    if (widget.person.invited) {
      showcase.setInvited(widget.person, false);
      return;
    }
    _opening = true;
    try {
      await openInvite(context, widget.person);
    } finally {
      _opening = false;
      if (mounted && ModalRoute.of(context)?.isCurrent == true) {
        _focus.requestFocus();
      }
    }
  }

  @override
  void dispose() {
    _focus.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final person = widget.person;
    final label = person.invited ? 'Invited' : 'Invite';
    final semanticLabel = person.invited
        ? 'Undo invite to ${person.name}'
        : 'Invite ${person.name}';
    if (ShowcaseScope.of(context).naked) {
      return NakedButton(
        focusNode: _focus,
        semanticLabel: semanticLabel,
        onPressed: _press,
        builder: (context, state, child) => Text(
          '[ $label ]',
          style: TextStyle(
            fontFamily: 'GeistMono',
            fontSize: 13,
            color: const Color(0xFFFFFFFF),
            decoration: state.isFocused
                ? TextDecoration.underline
                : TextDecoration.none,
          ),
        ),
      );
    }
    return RemixButton(
      focusNode: _focus,
      label: label,
      semanticLabel: semanticLabel,
      leadingIcon: person.invited ? Icons.check : null,
      onPressed: _press,
      style: person.invited ? doneButton : quietButton,
    );
  }
}

Future<void> openInvite(BuildContext context, Person person) async {
  final showcase = ShowcaseScope.of(context);
  final origin = ModalRoute.of(context);
  final naked = showcase.naked;
  // The app's toast scopes outlive Team when the reader changes chapters.
  final nakedToasts = NakedToastScope.of<String>(context);
  final remixToasts = RemixToastScope.maybeOf(context);
  final duration = showcase.reduceMotion
      ? Duration.zero
      : const Duration(milliseconds: 400);
  final confirmed = naked
      ? await showNakedDialog<bool>(
          context: context,
          barrierColor: const Color(0xAA000000),
          barrierLabel: 'Close invite',
          transitionDuration: duration,
          builder: (context) => _InviteDialog(person: person, naked: true),
        )
      : await showRemixDialog<bool>(
          context: context,
          barrierLabel: 'Close invite',
          transitionDuration: duration,
          // Remix beta.17 captures the opening token map. Override it with
          // the current look while this dialog stays mounted across chapters.
          builder: (context) => ListenableBuilder(
            listenable: showcase,
            builder: (context, child) => lookScope(
              showcase.activeLook,
              accent: showcase.naked ? null : showcase.accent,
              corner: showcase.naked ? null : showcase.corner,
              flat: showcase.flat,
              child: child!,
            ),
            child: _InviteDialog(person: person, naked: false),
          ),
        );
  if (origin?.isCurrent != true || confirmed != true) return;
  final toastScopeMounted = naked
      ? nakedToasts.isAttached
      : remixToasts?.isAttached == true;
  if (!toastScopeMounted) return;
  showcase.setInvited(person, true);
  final message = 'Invited ${person.name}';
  if (naked) {
    nakedToasts.show(NakedToastRequest(data: message, semanticLabel: message));
  } else {
    // #docregion toast-feedback
    remixToasts!.showToast(
      RemixToastData(
        title: message,
        description: 'Demo only. Nothing was sent.',
      ),
    );
    // #enddocregion toast-feedback
  }
}

class _InviteDialog extends StatefulWidget {
  const _InviteDialog({required this.person, required this.naked});

  final Person person;
  final bool naked;

  @override
  State<_InviteDialog> createState() => _InviteDialogState();
}

class _InviteDialogState extends State<_InviteDialog> {
  final _email = TextEditingController();
  bool _invalid = false;
  bool _sending = false;

  Future<void> _send() async {
    if (_sending) return;
    if (!_email.text.trim().contains('@')) {
      setState(() => _invalid = true);
      return;
    }
    setState(() {
      _invalid = false;
      _sending = true;
    });
    await Future<void>.delayed(const Duration(milliseconds: 600));
    if (!mounted) return;
    if (ModalRoute.of(context)?.isCurrent != true) {
      setState(() => _sending = false);
      return;
    }
    Navigator.of(context).pop(true);
  }

  void _cancel() {
    if (!_sending && ModalRoute.of(context)?.isCurrent == true) {
      Navigator.of(context).maybePop();
    }
  }

  @override
  void dispose() {
    _email.dispose();
    super.dispose();
  }

  // #docregion invite-dialog
  Widget _remix() => RemixDialog(
    title: 'Invite ${widget.person.name}',
    description: 'Local demo. Nothing is sent.',
    scrollable: true,
    style: dialogStyle,
    child: RemixTextField(
      controller: _email,
      label: 'Email',
      hintText: 'name@example.com',
      semanticLabel: 'Email',
      autofocus: true,
      keyboardType: .emailAddress,
      textInputAction: .send,
      readOnly: _sending,
      onSubmitted: (_) => _send(),
      error: _invalid,
      helperText: _invalid ? 'Enter an email with an @.' : null,
      style: field,
    ),
    actions: [
      RemixButton(
        label: 'Cancel',
        enabled: !_sending,
        onPressed: _cancel,
        style: quietButton.minWidth(0),
      ),
      RemixButton(
        label: 'Send invite',
        loading: _sending,
        onPressed: _send,
        style: primaryButton,
      ),
    ],
  );
  // #enddocregion invite-dialog

  // #docregion naked-invite
  Widget _naked() => NakedDialog(
    semanticLabel: 'Invite ${widget.person.name}',
    child: Container(
      width: 400,
      padding: const EdgeInsets.all(16),
      color: const Color(0xFF121217),
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: .stretch,
          mainAxisSize: .min,
          spacing: 10,
          children: [
            Text('Invite ${widget.person.name}'),
            const Text('Local demo. Nothing is sent.'),
            NakedTextField(
              controller: _email,
              semanticLabel: 'Email',
              autofocus: true,
              keyboardType: .emailAddress,
              textInputAction: .send,
              readOnly: _sending,
              error: _invalid,
              semanticErrorText: _invalid ? 'Enter an email with an @.' : null,
              onSubmitted: (_) => _send(),
              style: const TextStyle(color: Color(0xFFFFFFFF), fontSize: 14),
              builder: (context, state, editableText) => Column(
                crossAxisAlignment: .stretch,
                children: [
                  Text(state.isFocused ? 'Email _' : 'Email'),
                  editableText,
                  if (_invalid) const Text('Enter an email with an @.'),
                ],
              ),
            ),
            Wrap(
              spacing: 16,
              runSpacing: 8,
              children: [
                NakedButton(
                  enabled: !_sending,
                  onPressed: _cancel,
                  builder: (context, state, child) =>
                      _bareLabel('Cancel', state),
                ),
                NakedButton(
                  enabled: !_sending,
                  onPressed: _send,
                  builder: (context, state, child) =>
                      _bareLabel(_sending ? 'Sending…' : 'Send invite', state),
                ),
              ],
            ),
          ],
        ),
      ),
    ),
  );
  // #enddocregion naked-invite

  Widget _bareLabel(String label, NakedState state) => Text(
    '[ $label ]',
    style: TextStyle(
      decoration: state.isFocused
          ? TextDecoration.underline
          : TextDecoration.none,
    ),
  );

  @override
  Widget build(BuildContext context) => PopScope(
    canPop: !_sending,
    child: Center(
      child: Padding(
        padding: MediaQuery.viewInsetsOf(context) + const EdgeInsets.all(16),
        child: widget.naked
            ? DefaultTextStyle(
                style: const TextStyle(
                  fontFamily: 'GeistMono',
                  fontSize: 13,
                  color: Color(0xFFFFFFFF),
                ),
                child: _naked(),
              )
            : _remix(),
      ),
    ),
  );
}
