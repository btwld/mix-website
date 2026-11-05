import 'package:flutter/material.dart';
import 'package:mix_winds/mix_winds.dart';

// #docregion example
class Example extends StatelessWidget {
  const Example({super.key});

  @override
  Widget build(BuildContext context) {
    return TwScope(
      child: div('bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6', [
        div('bg-white/10 border border-white/20 rounded-3xl p-6 shadow-2xl', [
          div('flex items-start gap-4', [
            div(
              'w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center border-2 border-purple-400',
              [span('text-white font-semibold text-lg', 'SM')],
            ),
            div('flex-1 min-w-0', [
              div('flex items-center gap-2 mb-1', [
                h3(
                  'text-white font-semibold text-lg truncate',
                  'Sarah Mitchell',
                ),
                span(
                  'px-2 py-0.5 bg-purple-500/30 text-purple-200 text-xs rounded-full font-medium',
                  'Admin',
                ),
              ]),
              p(
                'text-slate-300 text-sm mb-4',
                'Your profile changes are ready to publish. Review and confirm to update your public information.',
              ),
              div('bg-white/5 rounded-xl p-3 mb-4 border border-white/10', [
                div('flex items-center gap-2 text-amber-300 text-sm', [
                  span('', '\u26A0'),
                  span('', 'This action cannot be undone'),
                ]),
              ]),
              div('flex gap-3', [
                button(
                  'flex flex-1 items-center justify-center rounded-xl border border-white/10 bg-white/10 px-4 py-2.5 font-medium text-white hover:border-white/20 hover:bg-white/20',
                  [span('', 'Cancel')],
                  onPressed: () {},
                ),
                button(
                  'flex flex-1 items-center justify-center rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2.5 font-medium text-white shadow-lg hover:from-purple-400 hover:to-pink-400',
                  [span('', 'Save Changes')],
                  onPressed: () {},
                ),
              ]),
            ]),
          ]),
        ]),
      ]),
    );
  }
}

// #enddocregion example
