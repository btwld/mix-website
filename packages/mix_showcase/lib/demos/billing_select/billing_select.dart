import 'package:flutter/material.dart' show Icons;
import 'package:flutter/widgets.dart';
import 'package:naked_ui/naked_ui.dart';

import '../upgrade_button/style.dart' show label;
import 'style.dart';

const cycles = ['Monthly', 'Yearly'];

/// A select for the billing cycle. Naked UI supplies the behavior; the
/// parts are drawn with the styles in style.dart.
class BillingSelect extends StatelessWidget {
  const BillingSelect({
    super.key,
    required this.cycle,
    required this.onChanged,
  });

  final String cycle;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    // Opening, placement, arrow keys, Escape and outside taps are handled.
    return NakedSelect<String>(
      value: cycle,
      onChanged: (next) => onChanged(next ?? cycle),
      semanticLabel: 'Billing cycle',
      positioning: const OverlayPositionConfig(
        sideOffset: 6,
      ),
      builder: (context, state, child) =>
          selectTrigger(state)(
            children: [
              Expanded(child: label(cycle)),
              chevron(
                icon: state.isOpen
                    ? Icons.expand_less
                    : Icons.expand_more,
              ),
            ],
          ),
      overlayBuilder: (context, info) => selectMenu(
        children: [
          for (final option in cycles)
            NakedSelectOption<String>(
              value: option,
              builder: (context, state, child) =>
                  selectOption(state)(
                    children: [
                      Expanded(child: label(option)),
                      if (state.isSelected)
                        checkMark(icon: Icons.check),
                    ],
                  ),
            ),
        ],
      ),
    );
  }
}
