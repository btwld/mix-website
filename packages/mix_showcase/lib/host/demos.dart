import 'dart:async';

import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';
import 'package:mix/mix.dart' show FocusVisibility;

import '../colors.dart';
import '../demos/action_button/action_button.dart';
import '../demos/bell/bell.dart';
import '../demos/billing_select/billing_select.dart';
import '../demos/checkout/checkout.dart';
import '../demos/confirm_button/confirm_button.dart';
import '../demos/plan_picker/plan_picker.dart';
import '../demos/plan_picker/plan_row.dart';
import '../demos/plan_picker/plan_segment.dart';
import '../demos/plan_card/plan_card.dart';
import '../demos/plan_list/plan_list.dart';
import '../demos/plans.dart';
import '../demos/toggle/style.dart';
import '../demos/toggle/toggle.dart';
import '../demos/themed_plan/themed_plan.dart';
import '../demos/upgrade_button/upgrade_button.dart';
import 'bridge.dart';
import 'host.dart';
import 'probe.dart';

/// Every example the page can mount, by the id it passes as `initialData.demo`.
const demoIds = [
  'button',
  'style',
  'tokens',
  'states',
  'responsive',
  'motion',
  'naked',
  'remix',
];

/// Places one example on the canvas with the control values the page chose.
/// This file is the page's wiring. The examples it shows are in `lib/demos`.
Widget buildDemo(String id, Host host) => switch (id) {
  'button' => StateProbe(
    demo: id,
    child: UpgradeButton(onPress: () {}),
  ),
  'style' => _StyleDemo(host),
  'tokens' => ThemedPlan(onUpgrade: () {}),
  'states' => _StatesDemo(host),
  'responsive' => _ResponsiveDemo(host),
  'motion' => _MotionDemo(host),
  'naked' => _NakedDemo(host),
  'remix' => const FittedBox(
    fit: BoxFit.scaleDown,
    child: SizedBox(width: 320, child: Checkout()),
  ),
  _ => const SizedBox.shrink(),
};

/// The breakpoint example at a width the page chooses. Every view on the page
/// is the same size, so the list is laid out at that width and scaled to fit.
/// `onBreakpoint` reads the screen size from MediaQuery, so that is what this
/// frame sets: the styles respond exactly as they would on a screen that wide.
class _ResponsiveDemo extends StatelessWidget {
  const _ResponsiveDemo(this.host);

  final Host host;

  /// The simulated screen's height. Only its width matters to the
  /// breakpoint; the frame itself takes the list's natural height.
  static const height = 250.0;

  /// The tallest the frame is drawn, so the stacked list still fits
  /// the band of the view the page shows. Taller is drawn smaller.
  static const band = 250.0;

  @override
  Widget build(BuildContext context) {
    final width = host
        .read('responsive', 'width', 840.0)
        .clamp(280.0, 1200.0);

    return ConstrainedBox(
      constraints: const BoxConstraints(maxHeight: band),
      child: FittedBox(
        fit: BoxFit.scaleDown,
        child: DecoratedBox(
          position: DecorationPosition.foreground,
          decoration: BoxDecoration(
            border: Border.all(color: slate),
            borderRadius: BorderRadius.circular(10),
          ),
          child: SizedBox(
            width: width,
            child: MediaQuery(
              data: MediaQuery.of(
                context,
              ).copyWith(size: Size(width, height)),
              child: const Padding(
                padding: EdgeInsets.all(20),
                child: PlanList(),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _StyleDemo extends StatelessWidget {
  const _StyleDemo(this.host);

  final Host host;

  @override
  Widget build(BuildContext context) {
    final featured = host.read('style', 'featured', 'Pro');
    Widget card(Plan plan) => MouseRegion(
      cursor: SystemMouseCursors.click,
      child: GestureDetector(
        onTap: () =>
            host.set('style', 'featured', plan.name),
        child: SizedBox(
          width: 200,
          child: PlanCard(
            plan: plan,
            highlight: featured == plan.name,
          ),
        ),
      ),
    );

    return FittedBox(
      fit: BoxFit.scaleDown,
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          mainAxisSize: .min,
          spacing: 16,
          children: [card(plans[0]), card(plans[1])],
        ),
      ),
    );
  }
}

class _StatesDemo extends StatefulWidget {
  const _StatesDemo(this.host);

  final Host host;

  @override
  State<_StatesDemo> createState() => _StatesDemoState();
}

class _StatesDemoState extends State<_StatesDemo> {
  static _StatesDemoState? focusOwner;
  final controller = WidgetStatesController();
  late final FocusHighlightStrategy
  previousHighlightStrategy;
  var held = <String>{};

  static const names = {
    WidgetState.hovered: 'hovered',
    WidgetState.pressed: 'pressed',
    WidgetState.focused: 'focused',
  };

  @override
  void initState() {
    super.initState();
    previousHighlightStrategy =
        focusOwner?.previousHighlightStrategy ??
        FocusManager.instance.highlightStrategy;
    controller.addListener(_tell);
    widget.host.addListener(_hold);
    FocusManager.instance.addHighlightModeListener(_mode);
    HardwareKeyboard.instance.addHandler(_key);
    _hold();
  }

  @override
  void dispose() {
    FocusManager.instance.removeHighlightModeListener(
      _mode,
    );
    if (focusOwner == this) {
      // Focus listeners can rebuild widgets, so wait until unmounting ends.
      // A replacement holding focus takes ownership before this runs.
      scheduleMicrotask(() {
        if (focusOwner != this) return;
        focusOwner = null;
        FocusManager.instance.highlightStrategy =
            previousHighlightStrategy;
      });
    }
    HardwareKeyboard.instance.removeHandler(_key);
    widget.host.removeListener(_hold);
    controller.dispose();
    super.dispose();
  }

  void _mode(FocusHighlightMode _) => _tell();

  bool _key(KeyEvent event) {
    scheduleMicrotask(() {
      if (mounted) _tell();
    });
    return false;
  }

  /// The page can hold a state on, for readers without a pointer or keyboard.
  void _hold() {
    final next = widget.host.list('states', 'hold').toSet();
    if (next.length == held.length &&
        next.containsAll(held))
      return;
    for (final MapEntry(key: state, value: name)
        in names.entries) {
      if (next.contains(name) != held.contains(name)) {
        controller.update(state, next.contains(name));
      }
    }
    // A focus ring is only drawn for keyboard focus, so holding it means
    // asking Flutter to treat focus as keyboard focus for the moment.
    if (next.contains('focused') !=
        held.contains('focused')) {
      if (next.contains('focused')) {
        focusOwner = this;
        FocusManager.instance.highlightStrategy =
            FocusHighlightStrategy.alwaysTraditional;
      } else if (focusOwner == this) {
        focusOwner = null;
        FocusManager.instance.highlightStrategy =
            previousHighlightStrategy;
      }
    }
    held = next;
    // Report after the highlight change: whether focus counts as keyboard
    // focus depends on it.
    _tell();
  }

  void _tell() {
    final states = controller.value;
    // The same rule Mix applies to onFocusVisible.
    final keyboard = FocusVisibility.isVisible;
    emit({
      'demo': 'states',
      'type': 'states',
      'value': [
        if (states.contains(WidgetState.hovered)) 'hovered',
        if (states.contains(WidgetState.pressed)) 'pressed',
        if (states.contains(WidgetState.focused) &&
            keyboard)
          'focused',
        if (states.contains(WidgetState.disabled))
          'disabled',
      ],
    });
  }

  @override
  Widget build(BuildContext context) {
    final enabled = widget.host.read(
      'states',
      'enabled',
      true,
    );

    return ActionButton(
      label: 'Save changes',
      onPress: enabled ? () {} : null,
      controller: controller,
    );
  }
}

class _MotionDemo extends StatefulWidget {
  const _MotionDemo(this.host);

  final Host host;

  @override
  State<_MotionDemo> createState() => _MotionDemoState();
}

class _MotionDemoState extends State<_MotionDemo> {
  var on = false;

  @override
  Widget build(BuildContext context) {
    final host = widget.host;
    return switch (host.read(
      'motion',
      'mode',
      'implicit',
    )) {
      'phases' => const ConfirmButton(),
      'keyframes' => const Bell(),
      _ => Toggle(
        label: 'Yearly billing',
        on: on,
        onChanged: (value) => setState(() => on = value),
        motion: switch (host.read(
          'motion',
          'curve',
          'spring',
        )) {
          'ease' => ease,
          'bouncy' => bouncy,
          _ => spring,
        },
      ),
    };
  }
}

class _NakedDemo extends StatelessWidget {
  const _NakedDemo(this.host);

  final Host host;

  @override
  Widget build(BuildContext context) {
    if (host.read('naked', 'widget', 'radio') == 'select') {
      return BillingSelect(
        cycle: host.read('naked', 'cycle', 'Monthly'),
        onChanged: (value) =>
            host.set('naked', 'cycle', value),
      );
    }
    final plan = host.read('naked', 'plan', 'Pro');
    void choose(String value) =>
        host.set('naked', 'plan', value);

    // One behavior, two drawings, sharing one selection.
    return Column(
      mainAxisSize: MainAxisSize.min,
      spacing: 24,
      children: [
        PlanPicker(
          plan: plan,
          onChanged: choose,
          layout: planRows,
          builder: planRow,
        ),
        PlanPicker(
          plan: plan,
          onChanged: choose,
          layout: planBar,
          builder: planSegment,
        ),
      ],
    );
  }
}
