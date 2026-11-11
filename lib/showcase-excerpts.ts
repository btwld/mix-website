/**
 * Every piece of Dart the page shows, cut from the source the live examples
 * are compiled from. A missing region or mark fails the build, so the page
 * cannot show code that no longer exists.
 *
 * - `region`: a `#docregion` in the file. Without one, the whole file is shown.
 * - `from`: for installed files that carry no markers: the declaration that
 *   starts on the line containing this text.
 * - `through`: ends a region early, after the line containing this text. With
 *   `from`, it is what ends the cut, for a declaration that has no closing `}`.
 * - `marks`: lines a control or live state can point at. A mark covers the call
 *   that starts with the text, to its closing bracket, wherever it occurs.
 * - `blocks`: like marks, but each covers the whole statement or declaration.
 * - `lines`: like marks, but each covers only the line the text is on.
 */
type Marks = Record<string, string | string[]>;
type Spec = { file: string; region?: string; from?: string; through?: string; marks?: Marks; blocks?: Marks; lines?: Marks };

const theme = (id: string): Spec => ({ file: 'theme.dart', region: `theme-${id}` });

export const EXCERPTS = {
  'button-style': {
    file: 'demos/upgrade_button/style.dart',
    marks: {
      hovered: '.onHovered(', pressed: '.onPressed(', focused: '.onFocusVisible(',
    },
  },
  'button-widget': { file: 'demos/upgrade_button/upgrade_button.dart' },
  'style-styles': {
    file: 'demos/plan_card/style.dart',
    blocks: { card: 'final card = FlexBoxStyler()', featured: ['final lifted = FlexBoxStyler()', 'final featured = card'] },
  },
  'style-widget': {
    file: 'demos/plan_card/plan_card.dart',
    marks: { card: 'final style = highlight', featured: 'final style = highlight' },
  },
  'tokens-declare': { file: 'theme.dart', region: 'tokens' },
  'theme-midnight': theme('midnight'),
  'theme-paper': theme('paper'),
  'theme-pop': theme('pop'),
  'theme-terminal': theme('terminal'),
  'tokens-scope': { file: 'theme.dart', region: 'scope' },
  'tokens-use': {
    file: 'demos/themed_plan/style.dart',
    marks: { token: ['.padding(.all($gap()))', '.color($surface())', '.borderRadius(.all($radius()))', '.color($primary())', '.onHovered(.color($primaryHover()))', '.style($title.mix())'] },
  },
  'states-style': {
    file: 'demos/action_button/style.dart',
    marks: {
      hovered: '.onHovered(', pressed: '.onPressed(', focused: '.onFocusVisible(', disabled: '.onDisabled(',
    },
  },
  'states-widget': {
    file: 'demos/action_button/action_button.dart',
    marks: { disabled: 'enabled: onPress != null', controller: 'controller: controller,' },
  },
  'responsive-style': { file: 'demos/plan_list/style.dart', marks: { compact: '.onBreakpoint(' } },
  'responsive-widget': { file: 'demos/plan_list/plan_list.dart' },
  'motion-implicit-style': {
    file: 'demos/toggle/style.dart',
    marks: { ease: 'final ease =', spring: 'final spring =', bouncy: 'final bouncy =', animate: '.animate(motion)' },
  },
  'motion-implicit-widget': { file: 'demos/toggle/toggle.dart' },
  'motion-phases-style': { file: 'demos/confirm_button/style.dart', marks: { phases: '.phaseAnimation(' } },
  'motion-phases-widget': { file: 'demos/confirm_button/confirm_button.dart', lines: { phases: 'onPress: () => presses.value++,' } },
  'motion-keyframes-style': { file: 'demos/bell/style.dart', marks: { keyframes: '.keyframeAnimation(' } },
  'motion-keyframes-widget': { file: 'demos/bell/bell.dart', lines: { keyframes: 'onPress: () => rings.value++,' } },
  'naked-radio': {
    file: 'demos/plan_picker/plan_picker.dart',
    lines: { behavior: ['return NakedRadioGroup<String>(', 'NakedRadio<String>('], yours: ['builder: (context, state, child) =>', 'builder(plan, state),'] },
  },
  'naked-rows': { file: 'demos/plan_picker/plan_row.dart', marks: { state: 'state.is' } },
  'naked-segments': { file: 'demos/plan_picker/plan_segment.dart', marks: { state: 'state.when(' } },
  'naked-select': { file: 'demos/billing_select/billing_select.dart', marks: { state: 'state.is' }, lines: { behavior: ['return NakedSelect<String>(', 'NakedSelectOption<String>(', 'builder: (context, state, child) =>', 'overlayBuilder: (context, info) =>'] } },
  'naked-select-styles': { file: 'demos/billing_select/style.dart', marks: { state: 'state.is' } },
  'remix-form': { file: 'demos/checkout/checkout.dart', lines: { components: ["import '../../ui/ui.dart';", 'UiCard(', 'UiBadge.secondary(', 'UiSlider(', 'UiSwitch(', 'UiCheckbox(', 'UiButton(', 'UiButton.ghost('] } },
  'remix-form-style': { file: 'demos/checkout/style.dart' },
  'remix-recipe': { file: 'ui/components/card.dart', from: '@MixWidget(target: RemixCard.new)', through: '.merge(style);' },
  'start-mix': { file: 'starters/mix.dart' },
  'start-naked': { file: 'starters/naked_ui.dart' },
  'start-remix': { file: 'remix_starter.dart' },
} satisfies Record<string, Spec>;

export type ExcerptKey = keyof typeof EXCERPTS;
