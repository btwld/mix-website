import 'package:flutter/widgets.dart';

import '../../ui/ui.dart';
import 'style.dart';

/// A checkout form composed from installed Remix components.
class Checkout extends StatefulWidget {
  const Checkout({super.key});

  @override
  State<Checkout> createState() => _CheckoutState();
}

class _CheckoutState extends State<Checkout> {
  int seats = 3;
  bool yearly = true;
  bool support = false;
  bool starting = false;

  int get monthly =>
      seats * (yearly ? 10 : 12) + (support ? 4 : 0);

  // Nothing is submitted: the button shows its loading state for a moment.
  Future<void> start() async {
    setState(() => starting = true);
    await Future<void>.delayed(
      const Duration(milliseconds: 1400),
    );
    if (mounted) setState(() => starting = false);
  }

  void reset() => setState(() {
    seats = 3;
    yearly = true;
    support = false;
  });

  @override
  Widget build(BuildContext context) {
    return UiCard(
      child: form(
        children: [
          header(
            children: [
              const Text('Seats'),
              UiBadge.secondary(label: '$seats'),
            ],
          ),
          UiSlider(
            value: seats.toDouble(),
            min: 1,
            max: 10,
            snapDivisions: 9,
            semanticLabel: 'Seats',
            onChanged: (value) =>
                setState(() => seats = value.round()),
          ),
          UiSwitch(
            label: 'Bill yearly',
            selected: yearly,
            onChanged: (value) =>
                setState(() => yearly = value),
          ),
          UiCheckbox(
            label: 'Priority support',
            selected: support,
            onChanged: (value) =>
                setState(() => support = value ?? false),
          ),
          UiButton(
            label: 'Start for \$$monthly a month',
            loading: starting,
            onPressed: start,
          ),
          UiButton.ghost(label: 'Reset', onPressed: reset),
        ],
      ),
    );
  }
}
