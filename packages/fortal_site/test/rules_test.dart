// The plan's layout rules, checked in the site's own source (everything in
// `lib` outside `lib/ui`, which is Fortal's).
//
// Spacing: every gap the site sets must be on the scale 4, 8, 12, 16, 24, 32,
// 48, 64, 96 (or 0). A gap is
//   - the value of a `spacing:` or `runSpacing:` argument,
//   - the `width:` or `height:` of a `SizedBox` that has no child (a spacer),
//   - any argument of an `EdgeInsets` or `EdgeInsetsDirectional` constructor.
// A value passes if it is a number on the scale, a `Gap` step, or a sum or
// product of `Gap` steps and the grid's own measures (`gutter`, `columnWidth`,
// `wallWidth`), which are positions on the grid rather than gaps. Anything
// else (another variable, a call) fails, so nothing slips through unread. A
// value may be let off with a comment `// off-scale: <reason>` on its line or
// the line above; each one is listed when the test runs.
//
// Not covered: the positions of `Positioned` widgets (canvas coordinates),
// the sizes of boxes with a child, spacing that Fortal's components draw
// themselves, `Wrap`/`Row` alignment such as `spaceBetween`, and anything
// computed at run time. The layout test checks where cards end up.
//
// Copy: slide titles are one line of at most 34 characters and detail lines
// one line of at most 80; card titles are at most 24 characters and card
// detail lines at most 44. Characters are counted, not measured; whether a
// line fits its width is the layout test's and the eye's job.
import 'dart:io';

import 'package:analyzer/dart/analysis/utilities.dart';
import 'package:analyzer/dart/ast/ast.dart';
import 'package:analyzer/dart/ast/visitor.dart';
import 'package:analyzer/source/line_info.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:fortal_landing/kit.dart';

const _scale = {0, 4, 8, 12, 16, 24, 32, 48, 64, 96};
const _grid = {'gutter', 'columnWidth', 'wallWidth'};

/// The site's own Dart files: `lib` without Fortal's `lib/ui`.
List<File> _siteFiles() =>
    Directory('lib')
        .listSync(recursive: true)
        .whereType<File>()
        .where((f) => f.path.endsWith('.dart'))
        .where((f) => !f.path.startsWith('lib/ui/'))
        .toList()
      ..sort((a, b) => a.path.compareTo(b.path));

typedef _Finding = ({String where, String what});

class _SpacingCheck extends RecursiveAstVisitor<void> {
  _SpacingCheck(this.path, this.source, this.lines);

  final String path;
  final String source;
  final LineInfo lines;
  final failures = <_Finding>[];
  final excused = <_Finding>[];
  var checked = 0;

  String _at(AstNode node) =>
      '$path:${lines.getLocation(node.offset).lineNumber}';

  bool _excusedAt(AstNode node) {
    final line = lines.getLocation(node.offset).lineNumber;
    for (final n in [line, line - 1]) {
      if (n < 1) continue;
      final start = lines.getOffsetOfLine(n - 1);
      final end = n < lines.lineCount
          ? lines.getOffsetOfLine(n)
          : source.length;
      if (source.substring(start, end).contains('// off-scale:')) return true;
    }
    return false;
  }

  bool _allowed(Expression value) => switch (value) {
    IntegerLiteral(:final value?) => _scale.contains(value),
    DoubleLiteral(:final value) => _scale.contains(value),
    PrefixedIdentifier(:final prefix) => prefix.name == 'Gap',
    SimpleIdentifier(:final name) => _grid.contains(name),
    ParenthesizedExpression(:final expression) => _allowed(expression),
    BinaryExpression(:final leftOperand, :final rightOperand, :final operator)
        when operator.lexeme == '+' || operator.lexeme == '-' =>
      _allowed(leftOperand) && _allowed(rightOperand),
    // A product of a grid measure by a count, such as `2 * wallWidth`.
    BinaryExpression(:final leftOperand, :final rightOperand, :final operator)
        when operator.lexeme == '*' =>
      (leftOperand is IntegerLiteral && _allowed(rightOperand)) ||
          (rightOperand is IntegerLiteral && _allowed(leftOperand)),
    _ => false,
  };

  void _check(Expression value, String role) {
    checked++;
    if (_allowed(value)) return;
    final finding = (where: _at(value), what: '$role: ${value.toSource()}');
    (_excusedAt(value) ? excused : failures).add(finding);
  }

  void _checkCall(String? type, String? name, ArgumentList arguments) {
    if (type == 'SizedBox' && name == null) {
      final named = arguments.arguments.whereType<NamedArgument>();
      if (named.any((a) => a.name.lexeme == 'child')) return;
      for (final a in named) {
        if (a.name.lexeme case 'width' || 'height') {
          _check(a.argumentExpression, 'SizedBox ${a.name.lexeme}');
        }
      }
    }
    if (type == 'EdgeInsets' || type == 'EdgeInsetsDirectional') {
      for (final a in arguments.arguments) {
        _check(a.argumentExpression, '$type.${name ?? ''}');
      }
    }
  }

  @override
  void visitInstanceCreationExpression(InstanceCreationExpression node) {
    _checkCall(
      node.constructorName.type.name.lexeme,
      node.constructorName.name?.name,
      node.argumentList,
    );
    super.visitInstanceCreationExpression(node);
  }

  @override
  void visitMethodInvocation(MethodInvocation node) {
    // Without `const`, `SizedBox(...)` and `EdgeInsets.all(...)` parse as
    // calls: the first with no target, the second with the type as target.
    final target = node.target;
    if (target == null) {
      _checkCall(node.methodName.name, null, node.argumentList);
    } else if (target is SimpleIdentifier) {
      _checkCall(target.name, node.methodName.name, node.argumentList);
    }
    super.visitMethodInvocation(node);
  }

  @override
  void visitNamedArgument(NamedArgument node) {
    if (node.name.lexeme case 'spacing' || 'runSpacing') {
      _check(node.argumentExpression, node.name.lexeme);
    }
    super.visitNamedArgument(node);
  }
}

/// Every piece of copy the plan limits, with where it is.
class _CopyCheck extends RecursiveAstVisitor<void> {
  _CopyCheck(this.path, this.lines);

  final String path;
  final LineInfo lines;
  final slideTitles = <(String, String)>[];
  final slideDetails = <(String, String)>[];
  final cardTitles = <(String, String)>[];
  final cardDetails = <(String, String)>[];
  final unreadable = <String>[];

  String _at(AstNode node) =>
      '$path:${lines.getLocation(node.offset).lineNumber}';

  void _read(Expression value, List<(String, String)> into) {
    final text = value is StringLiteral ? value.stringValue : null;
    if (text == null) {
      // A conditional title is read on both sides.
      if (value is ConditionalExpression) {
        _read(value.thenExpression, into);
        _read(value.elseExpression, into);
        return;
      }
      // A parameter passed on, such as `title: title`, is checked where
      // its text is written.
      if (value is SimpleIdentifier) return;
      unreadable.add('${_at(value)}: ${value.toSource()}');
      return;
    }
    into.add((text, _at(value)));
  }

  void _visitCall(String name, ArgumentList arguments) {
    final named = {
      for (final a in arguments.arguments.whereType<NamedArgument>())
        a.name.lexeme: a.argumentExpression,
    };
    // The components slides pass their heading through `_Gallery`.
    if (name case 'SlideHeading' || '_Gallery') {
      if (named['title'] case final title?) _read(title, slideTitles);
      if (named['detail'] case final detail?) _read(detail, slideDetails);
    }
    // The showcase cards: the shared card, the components slides' moments
    // and the charts slide's cards, all named by `title:`.
    if (name case 'ShowCard' || '_Moment' || '_chartCard') {
      if (named['title'] case final title?) _read(title, cardTitles);
      if (named['detail'] case final detail?) _read(detail, cardDetails);
    }
    // The opening slide's cards take their title first.
    if (name == '_card' && path.endsWith('bento.dart')) {
      _read(arguments.arguments.first.argumentExpression, cardTitles);
      if (named['detail'] case final detail?) _read(detail, cardDetails);
    }
  }

  @override
  void visitInstanceCreationExpression(InstanceCreationExpression node) {
    _visitCall(node.constructorName.type.name.lexeme, node.argumentList);
    super.visitInstanceCreationExpression(node);
  }

  @override
  void visitMethodInvocation(MethodInvocation node) {
    if (node.target == null) {
      _visitCall(node.methodName.name, node.argumentList);
    }
    super.visitMethodInvocation(node);
  }
}

void main() {
  test('the Gap steps are the plan\'s spacing scale', () {
    expect({
      Gap.x1,
      Gap.x2,
      Gap.x3,
      Gap.x4,
      Gap.x6,
      Gap.x8,
      Gap.x12,
      Gap.x16,
      Gap.x24,
    }, _scale.difference({0}).map((v) => v.toDouble()).toSet());
  });

  test('every spacing value in the site\'s source is on the scale', () {
    final failures = <_Finding>[];
    final excused = <_Finding>[];
    var checked = 0;
    for (final file in _siteFiles()) {
      final source = file.readAsStringSync();
      final unit = parseString(content: source, path: file.path).unit;
      final check = _SpacingCheck(file.path, source, unit.lineInfo);
      unit.accept(check);
      failures.addAll(check.failures);
      excused.addAll(check.excused);
      checked += check.checked;
    }
    for (final e in excused) {
      // ignore: avoid_print
      print('let off: ${e.where}  ${e.what}');
    }
    expect(checked, greaterThan(50), reason: 'the check found few values');
    expect(
      failures.map((f) => '${f.where}  ${f.what}').toList(),
      isEmpty,
      reason: 'spacing off the scale 4 8 12 16 24 32 48 64 96',
    );
  });

  test('titles and detail lines stay within the plan\'s lengths', () {
    final copy = <_CopyCheck>[];
    for (final file in _siteFiles()) {
      final source = file.readAsStringSync();
      final unit = parseString(content: source, path: file.path).unit;
      final check = _CopyCheck(file.path, unit.lineInfo);
      unit.accept(check);
      copy.add(check);
    }
    List<(String, String)> all(
      List<(String, String)> Function(_CopyCheck) of,
    ) => [for (final c in copy) ...of(c)];
    List<String> over(List<(String, String)> texts, int limit) => [
      for (final (text, where) in texts)
        if (text.contains('\n') || text.length > limit)
          '$where  "$text" (${text.length})',
    ];

    final slideTitles = all((c) => c.slideTitles);
    final slideDetails = all((c) => c.slideDetails);
    final cardTitles = all((c) => c.cardTitles);
    final cardDetails = all((c) => c.cardDetails);

    // Enough was found that the limits mean something: seven slides (the
    // first has no heading) and every card.
    expect(slideTitles.length, greaterThanOrEqualTo(6));
    expect(cardTitles.length, greaterThanOrEqualTo(8 + 12 + 3));
    expect(all((c) => c.unreadable.map((u) => (u, '')).toList()), isEmpty);

    expect(
      over(slideTitles, 34),
      isEmpty,
      reason: 'slide titles: one line, 34',
    );
    expect(
      over(slideDetails, 80),
      isEmpty,
      reason: 'detail lines: one line, 80',
    );
    expect(over(cardTitles, 24), isEmpty, reason: 'card titles: 24');
    expect(over(cardDetails, 44), isEmpty, reason: 'card detail lines: 44');
  });
}
