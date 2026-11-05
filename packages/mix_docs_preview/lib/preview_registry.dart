import 'package:flutter/widgets.dart';

import 'ecosystem/mix_winds.dart' as tw_card_alert;
import 'guides/animations/implicit_curved_scale.dart' as auto_scale;
import 'guides/animations/implicit_spring_translate.dart' as spring_anim;
import 'guides/animations/implicit_state_counter.dart'
    as guide_implicit_counter;
import 'guides/animations/implicit_variant_hover.dart' as guide_implicit_hover;
import 'guides/animations/keyframe_loop.dart' as guide_keyframe_loop;
import 'guides/animations/keyframe_switch.dart' as guide_keyframe_switch;
import 'guides/animations/phase_tap_compress.dart' as guide_phase_tap;
import 'guides/design_token/theme_switch.dart' as theme_switch;
import 'guides/design_token/theme_tokens.dart' as theme_tokens;
import 'guides/directives/text_directives.dart' as text_directives;
import 'guides/dynamic_styling/composing.dart' as composing;
import 'guides/dynamic_styling/context_variant_flag.dart'
    as context_variant_flag;
import 'guides/dynamic_styling/disabled.dart' as disabled;
import 'guides/dynamic_styling/focused.dart' as focused;
import 'guides/dynamic_styling/hovered.dart' as hovered;
import 'guides/dynamic_styling/nesting.dart' as nesting;
import 'guides/styling/styling_basic.dart' as styling_basic;
import 'guides/widget_modifiers/opacity_box.dart' as opacity_box;
import 'guides/styling/preview_1.dart' as guide_styling_1;
import 'guides/dynamic_styling/pressed.dart' as pressed;
import 'guides/dynamic_styling/responsive_size.dart' as responsive_size;
import 'guides/dynamic_styling/selected.dart' as selected;
import 'guides/dynamic_styling/selected_toggle.dart' as selected_toggle;
import 'homepage/animation_showcase.dart' as homepage_animation;
import 'homepage/buttons_showcase.dart' as homepage_buttons;
import 'homepage/hero_classic.dart' as hero_classic;
import 'homepage/hero_gradient.dart' as hero_gradient;
import 'homepage/hero_neon.dart' as hero_neon;
import 'homepage/directives_showcase.dart' as homepage_directives;
import 'homepage/styling_showcase.dart' as homepage_styling;
import 'homepage/variants_showcase.dart' as homepage_variants;
import 'guides/gradients/gradient_linear.dart' as gradient_linear;
import 'guides/gradients/gradient_radial.dart' as gradient_radial;
import 'guides/gradients/gradient_sweep.dart' as gradient_sweep;
import 'overview/comparison/preview_0.dart' as comparison_0;
import 'remix/components/accordion.dart' as remix_accordion;
import 'remix/components/avatar.dart' as remix_avatar;
import 'remix/components/badge.dart' as remix_badge;
import 'remix/components/button.dart' as remix_button;
import 'remix/components/callout.dart' as remix_callout;
import 'remix/components/card.dart' as remix_card;
import 'remix/components/checkbox.dart' as remix_checkbox;
import 'remix/components/dialog.dart' as remix_dialog;
import 'remix/components/divider.dart' as remix_divider;
import 'remix/components/icon_button.dart' as remix_icon_button;
import 'remix/components/menu.dart' as remix_menu;
import 'remix/components/popover.dart' as remix_popover;
import 'remix/components/progress.dart' as remix_progress;
import 'remix/components/radio.dart' as remix_radio;
import 'remix/components/select.dart' as remix_select;
import 'remix/components/slider.dart' as remix_slider;
import 'remix/components/spinner.dart' as remix_spinner;
import 'remix/components/switch.dart' as remix_switch;
import 'remix/components/tabs.dart' as remix_tabs;
import 'remix/components/textfield.dart' as remix_textfield;
import 'remix/components/toggle.dart' as remix_toggle;
import 'remix/components/toggle_group.dart' as remix_toggle_group;
import 'remix/components/tooltip.dart' as remix_tooltip;
import 'overview/introduction/simple_red_box.dart' as simple_red_box;
import 'overview/getting_started/hello_mix.dart' as getting_started_hello_mix;
import 'tutorials/creating_a_widget/design_system_button.dart'
    as design_system_button;
import 'widgets/pressable/pressable_button.dart' as pressable_button;
import 'widgets/box/gradient_box.dart' as gradient_box;
import 'widgets/box/simple_box.dart' as simple_box;
import 'widgets/flexbox/icon_label_chip.dart' as icon_label_chip;
import 'widgets/icon/styled_icon.dart' as styled_icon;
import 'widgets/image/styled_image.dart' as styled_image;
import 'widgets/stack/layered_boxes.dart' as layered_boxes;
import 'widgets/text/styled_text.dart' as styled_text;
import 'widgets/vbox/card_layout.dart' as card_layout;

/// A preview entry with metadata for multi-view embedding, gallery display,
/// and docs code snippets.
class PreviewEntry {
  /// Unique ID used for multi-view embedding (e.g., 'overview/introduction.0').
  final String previewId;

  /// Source file path used for docs snippet rendering.
  final String sourcePath;

  /// Category for grouping in the gallery.
  final String category;

  /// Widget builder function.
  final WidgetBuilder builder;

  /// Optional named region for snippet extraction.
  final String? snippetRegion;

  /// Whether this entry should render as an interactive Flutter preview.
  final bool renderable;

  const PreviewEntry({
    required this.previewId,
    required this.sourcePath,
    required this.category,
    required this.builder,
    this.snippetRegion,
    this.renderable = true,
  });
}

/// Registry for preview widgets used in both multi-view embedding and the gallery.
///
/// Single source of truth for all preview definitions, preventing duplication
/// between multi-view mode and gallery mode.
///
/// Usage from JavaScript (multi-view):
/// ```javascript
/// app.addView({
///   hostElement: container,
///   initialData: { previewId: 'overview/introduction.0' }
/// });
/// ```
class PreviewRegistry {
  /// All available previews with full metadata.
  static const String _widgets = 'Widgets';

  static const String _variants = 'Context Variants';
  static const String _gradients = 'Gradients';
  static const String _tokens = 'Design System';
  static const String _animations = 'Animations';
  static const String _ecosystem = 'Ecosystem';
  static const String _homepage = 'Homepage';
  static const String _remixComponents = 'Remix Components';
  static final List<PreviewEntry> _previews = [
    // Documentation embeddings: previewId = doc path (without .mdx) + index
    // overview
    PreviewEntry(
      previewId: 'overview/introduction.0',
      sourcePath:
          'packages/mix_docs_preview/lib/overview/introduction/simple_red_box.dart',
      category: _widgets,
      builder: (_) => const simple_red_box.Example(),
    ),
    PreviewEntry(
      previewId: 'overview/utility-first.0',
      sourcePath:
          'packages/mix_docs_preview/lib/overview/utility_first/preview.dart',
      category: _widgets,
      builder: (_) => const simple_red_box.Example(),
    ),
    PreviewEntry(
      previewId: 'overview/getting-started.0',
      sourcePath:
          'packages/mix_docs_preview/lib/overview/getting_started/hello_mix.dart',
      category: _widgets,
      builder: (_) => const getting_started_hello_mix.Example(),
    ),
    PreviewEntry(
      previewId: 'overview/comparison.0',
      sourcePath:
          'packages/mix_docs_preview/lib/overview/comparison/preview_0.dart',
      category: _variants,
      builder: (_) => const comparison_0.Example(),
    ),
    // guides
    PreviewEntry(
      previewId: 'guides/widget-modifiers.0',
      sourcePath:
          'packages/mix_docs_preview/lib/guides/widget_modifiers/opacity_box.dart',
      category: _widgets,
      builder: (_) => const opacity_box.Example(),
    ),
    PreviewEntry(
      previewId: 'guides/styling.0',
      sourcePath:
          'packages/mix_docs_preview/lib/guides/styling/styling_basic.dart',
      category: _widgets,
      builder: (_) => const styling_basic.Example(),
    ),
    PreviewEntry(
      previewId: 'guides/styling.1',
      sourcePath: 'packages/mix_docs_preview/lib/guides/styling/preview_1.dart',
      category: _widgets,
      builder: (_) => const guide_styling_1.Example(),
    ),
    PreviewEntry(
      previewId: 'guides/dynamic-styling.0',
      sourcePath:
          'packages/mix_docs_preview/lib/guides/dynamic_styling/hovered.dart',
      category: _variants,
      builder: (_) => const hovered.Example(),
    ),
    PreviewEntry(
      previewId: 'guides/dynamic-styling.1',
      sourcePath:
          'packages/mix_docs_preview/lib/guides/dynamic_styling/composing.dart',
      category: _variants,
      builder: (_) => const composing.Example(),
    ),
    PreviewEntry(
      previewId: 'guides/dynamic-styling.2',
      sourcePath:
          'packages/mix_docs_preview/lib/guides/dynamic_styling/nesting.dart',
      category: _variants,
      builder: (_) => const nesting.Example(),
    ),
    PreviewEntry(
      previewId: 'guides/animations.0',
      sourcePath:
          'packages/mix_docs_preview/lib/guides/animations/implicit_state_counter.dart',
      category: _animations,
      builder: (_) =>
          const guide_implicit_counter.ImplicitStateCounterExample(),
    ),
    PreviewEntry(
      previewId: 'guides/animations.1',
      sourcePath:
          'packages/mix_docs_preview/lib/guides/animations/implicit_variant_hover.dart',
      category: _animations,
      builder: (_) => const guide_implicit_hover.ImplicitVariantHoverExample(),
    ),
    PreviewEntry(
      previewId: 'guides/animations.2',
      sourcePath:
          'packages/mix_docs_preview/lib/guides/animations/phase_tap_compress.dart',
      category: _animations,
      builder: (_) => const guide_phase_tap.PhaseTapCompressExample(),
    ),
    PreviewEntry(
      previewId: 'guides/animations.3',
      sourcePath:
          'packages/mix_docs_preview/lib/guides/animations/keyframe_switch.dart',
      category: _animations,
      builder: (_) => const guide_keyframe_switch.KeyframeSwitchExample(),
    ),
    PreviewEntry(
      previewId: 'guides/animations.4',
      sourcePath:
          'packages/mix_docs_preview/lib/guides/animations/keyframe_loop.dart',
      category: _animations,
      builder: (_) => const guide_keyframe_loop.KeyframeLoopExample(),
    ),
    PreviewEntry(
      previewId: 'guides/design-token.0',
      sourcePath:
          'packages/mix_docs_preview/lib/guides/design_token/theme_tokens.dart',
      category: _tokens,
      builder: (_) => const theme_tokens.Example(),
    ),
    PreviewEntry(
      previewId: 'guides/design-token.1',
      sourcePath:
          'packages/mix_docs_preview/lib/guides/design_token/theme_switch.dart',
      category: _tokens,
      builder: (_) => const theme_switch.Example(),
    ),
    PreviewEntry(
      previewId: 'guides/directives.0',
      sourcePath:
          'packages/mix_docs_preview/lib/guides/directives/text_directives.dart',
      category: _widgets,
      builder: (_) => const text_directives.Example(),
    ),
    // homepage
    PreviewEntry(
      previewId: 'homepage/styling',
      sourcePath:
          'packages/mix_docs_preview/lib/homepage/styling_showcase.dart',
      category: _homepage,
      builder: (_) => const homepage_styling.Example(),
      snippetRegion: 'showcase',
    ),
    PreviewEntry(
      previewId: 'homepage/variants',
      sourcePath:
          'packages/mix_docs_preview/lib/homepage/variants_showcase.dart',
      category: _homepage,
      builder: (_) => const homepage_variants.Example(),
      snippetRegion: 'showcase',
    ),
    PreviewEntry(
      previewId: 'homepage/animation',
      sourcePath:
          'packages/mix_docs_preview/lib/homepage/animation_showcase.dart',
      category: _homepage,
      builder: (_) => const homepage_animation.Example(),
      snippetRegion: 'showcase',
    ),
    PreviewEntry(
      previewId: 'homepage/buttons',
      sourcePath:
          'packages/mix_docs_preview/lib/homepage/buttons_showcase.dart',
      category: _homepage,
      builder: (_) => const homepage_buttons.Example(),
      snippetRegion: 'showcase',
    ),
    PreviewEntry(
      previewId: 'homepage/hero-classic',
      sourcePath: 'packages/mix_docs_preview/lib/homepage/hero_classic.dart',
      category: _homepage,
      builder: (_) => const hero_classic.Example(),
      snippetRegion: 'style',
    ),
    PreviewEntry(
      previewId: 'homepage/hero-gradient',
      sourcePath: 'packages/mix_docs_preview/lib/homepage/hero_gradient.dart',
      category: _homepage,
      builder: (_) => const hero_gradient.Example(),
      snippetRegion: 'style',
    ),
    PreviewEntry(
      previewId: 'homepage/hero-neon',
      sourcePath: 'packages/mix_docs_preview/lib/homepage/hero_neon.dart',
      category: _homepage,
      builder: (_) => const hero_neon.Example(),
      snippetRegion: 'style',
    ),
    PreviewEntry(
      previewId: 'homepage/directives',
      sourcePath:
          'packages/mix_docs_preview/lib/homepage/directives_showcase.dart',
      category: _homepage,
      builder: (_) => const homepage_directives.Example(),
      snippetRegion: 'showcase',
    ),
    // widgets
    PreviewEntry(
      previewId: 'widgets/box.0',
      sourcePath: 'packages/mix_docs_preview/lib/widgets/box/simple_box.dart',
      category: _widgets,
      builder: (_) => const simple_box.Example(),
    ),
    PreviewEntry(
      previewId: 'widgets/icon.0',
      sourcePath: 'packages/mix_docs_preview/lib/widgets/icon/styled_icon.dart',
      category: _widgets,
      builder: (_) => const styled_icon.Example(),
    ),
    PreviewEntry(
      previewId: 'widgets/text.0',
      sourcePath: 'packages/mix_docs_preview/lib/widgets/text/styled_text.dart',
      category: _widgets,
      builder: (_) => const styled_text.Example(),
    ),
    PreviewEntry(
      previewId: 'widgets/image.0',
      sourcePath:
          'packages/mix_docs_preview/lib/widgets/image/styled_image.dart',
      category: _widgets,
      builder: (_) => const styled_image.Example(),
    ),
    PreviewEntry(
      previewId: 'widgets/stack.0',
      sourcePath:
          'packages/mix_docs_preview/lib/widgets/stack/layered_boxes.dart',
      category: _widgets,
      builder: (_) => const layered_boxes.Example(),
    ),
    PreviewEntry(
      previewId: 'widgets/flexbox.0',
      sourcePath:
          'packages/mix_docs_preview/lib/widgets/flexbox/icon_label_chip.dart',
      category: _widgets,
      builder: (_) => const icon_label_chip.Example(),
    ),
    PreviewEntry(
      previewId: 'widgets/pressable.0',
      sourcePath:
          'packages/mix_docs_preview/lib/widgets/pressable/pressable_button.dart',
      category: _variants,
      builder: (_) => const pressable_button.Example(),
    ),
    // tutorials
    PreviewEntry(
      previewId: 'tutorials/creating-a-widget.0',
      sourcePath:
          'packages/mix_docs_preview/lib/tutorials/creating_a_widget/design_system_button.dart',
      category: _widgets,
      builder: (_) => const design_system_button.Example(),
    ),
    PreviewEntry(
      previewId: 'tutorials/theming.0',
      sourcePath:
          'packages/mix_docs_preview/lib/tutorials/theming/preview.dart',
      category: _tokens,
      builder: (_) => const theme_tokens.Example(),
    ),
    PreviewEntry(
      previewId: 'tutorials/controlling-widget-state.0',
      sourcePath:
          'packages/mix_docs_preview/lib/tutorials/controlling_widget_state/preview.dart',
      category: _variants,
      builder: (_) => const hovered.Example(),
    ),
    PreviewEntry(
      previewId: 'tutorials/creating-context-variants.0',
      sourcePath:
          'packages/mix_docs_preview/lib/tutorials/creating_context_variants/preview.dart',
      category: _variants,
      builder: (_) => const context_variant_flag.Example(),
    ),
    // remix components
    PreviewEntry(
      previewId: 'components/accordion.0',
      sourcePath:
          'packages/mix_docs_preview/lib/remix/components/accordion.dart',
      category: _remixComponents,
      builder: (_) => const remix_accordion.Example(),
    ),
    PreviewEntry(
      previewId: 'components/avatar.0',
      sourcePath: 'packages/mix_docs_preview/lib/remix/components/avatar.dart',
      category: _remixComponents,
      builder: (_) => const remix_avatar.Example(),
    ),
    PreviewEntry(
      previewId: 'components/badge.0',
      sourcePath: 'packages/mix_docs_preview/lib/remix/components/badge.dart',
      category: _remixComponents,
      builder: (_) => const remix_badge.Example(),
    ),
    PreviewEntry(
      previewId: 'components/button.0',
      sourcePath: 'packages/mix_docs_preview/lib/remix/components/button.dart',
      category: _remixComponents,
      builder: (_) => const remix_button.Example(),
    ),
    PreviewEntry(
      previewId: 'components/callout.0',
      sourcePath: 'packages/mix_docs_preview/lib/remix/components/callout.dart',
      category: _remixComponents,
      builder: (_) => const remix_callout.Example(),
    ),
    PreviewEntry(
      previewId: 'components/card.0',
      sourcePath: 'packages/mix_docs_preview/lib/remix/components/card.dart',
      category: _remixComponents,
      builder: (_) => const remix_card.Example(),
    ),
    PreviewEntry(
      previewId: 'components/checkbox.0',
      sourcePath:
          'packages/mix_docs_preview/lib/remix/components/checkbox.dart',
      category: _remixComponents,
      builder: (_) => const remix_checkbox.Example(),
    ),
    PreviewEntry(
      previewId: 'components/dialog.0',
      sourcePath: 'packages/mix_docs_preview/lib/remix/components/dialog.dart',
      category: _remixComponents,
      builder: (_) => const remix_dialog.Example(),
    ),
    PreviewEntry(
      previewId: 'components/divider.0',
      sourcePath: 'packages/mix_docs_preview/lib/remix/components/divider.dart',
      category: _remixComponents,
      builder: (_) => const remix_divider.Example(),
    ),
    PreviewEntry(
      previewId: 'components/icon_button.0',
      sourcePath:
          'packages/mix_docs_preview/lib/remix/components/icon_button.dart',
      category: _remixComponents,
      builder: (_) => const remix_icon_button.Example(),
    ),
    PreviewEntry(
      previewId: 'components/menu.0',
      sourcePath: 'packages/mix_docs_preview/lib/remix/components/menu.dart',
      category: _remixComponents,
      builder: (_) => const remix_menu.Example(),
    ),
    PreviewEntry(
      previewId: 'components/popover.0',
      sourcePath: 'packages/mix_docs_preview/lib/remix/components/popover.dart',
      category: _remixComponents,
      builder: (_) => const remix_popover.Example(),
    ),
    PreviewEntry(
      previewId: 'components/progress.0',
      sourcePath:
          'packages/mix_docs_preview/lib/remix/components/progress.dart',
      category: _remixComponents,
      builder: (_) => const remix_progress.Example(),
    ),
    PreviewEntry(
      previewId: 'components/radio.0',
      sourcePath: 'packages/mix_docs_preview/lib/remix/components/radio.dart',
      category: _remixComponents,
      builder: (_) => const remix_radio.Example(),
    ),
    PreviewEntry(
      previewId: 'components/select.0',
      sourcePath: 'packages/mix_docs_preview/lib/remix/components/select.dart',
      category: _remixComponents,
      builder: (_) => const remix_select.Example(),
    ),
    PreviewEntry(
      previewId: 'components/slider.0',
      sourcePath: 'packages/mix_docs_preview/lib/remix/components/slider.dart',
      category: _remixComponents,
      builder: (_) => const remix_slider.Example(),
    ),
    PreviewEntry(
      previewId: 'components/spinner.0',
      sourcePath: 'packages/mix_docs_preview/lib/remix/components/spinner.dart',
      category: _remixComponents,
      builder: (_) => const remix_spinner.Example(),
    ),
    PreviewEntry(
      previewId: 'components/switch.0',
      sourcePath: 'packages/mix_docs_preview/lib/remix/components/switch.dart',
      category: _remixComponents,
      builder: (_) => const remix_switch.Example(),
    ),
    PreviewEntry(
      previewId: 'components/tabs.0',
      sourcePath: 'packages/mix_docs_preview/lib/remix/components/tabs.dart',
      category: _remixComponents,
      builder: (_) => const remix_tabs.Example(),
    ),
    PreviewEntry(
      previewId: 'components/textfield.0',
      sourcePath:
          'packages/mix_docs_preview/lib/remix/components/textfield.dart',
      category: _remixComponents,
      builder: (_) => const remix_textfield.Example(),
    ),
    PreviewEntry(
      previewId: 'components/toggle.0',
      sourcePath: 'packages/mix_docs_preview/lib/remix/components/toggle.dart',
      category: _remixComponents,
      builder: (_) => const remix_toggle.Example(),
    ),
    PreviewEntry(
      previewId: 'components/toggle_group.0',
      sourcePath:
          'packages/mix_docs_preview/lib/remix/components/toggle_group.dart',
      category: _remixComponents,
      builder: (_) => const remix_toggle_group.Example(),
    ),
    PreviewEntry(
      previewId: 'components/tooltip.0',
      sourcePath: 'packages/mix_docs_preview/lib/remix/components/tooltip.dart',
      category: _remixComponents,
      builder: (_) => const remix_tooltip.Example(),
    ),
    // ecosystem
    PreviewEntry(
      previewId: 'ecosystem/mix-winds.0',
      sourcePath: 'packages/mix_docs_preview/lib/ecosystem/mix_winds.dart',
      category: _ecosystem,
      builder: (_) => const tw_card_alert.Example(),
      snippetRegion: 'example',
    ),

    // Gallery-only widget examples (not embedded in a specific doc)
    PreviewEntry(
      previewId: 'box-gradient',
      sourcePath: 'packages/mix_docs_preview/lib/widgets/box/gradient_box.dart',
      category: _widgets,
      builder: (_) => const gradient_box.Example(),
    ),
    PreviewEntry(
      previewId: 'vbox-card',
      sourcePath: 'packages/mix_docs_preview/lib/widgets/vbox/card_layout.dart',
      category: _widgets,
      builder: (_) => const card_layout.Example(),
    ),

    // Context Variants (gallery-only)
    PreviewEntry(
      previewId: 'variant-pressed',
      sourcePath:
          'packages/mix_docs_preview/lib/guides/dynamic_styling/pressed.dart',
      category: _variants,
      builder: (_) => const pressed.Example(),
    ),
    PreviewEntry(
      previewId: 'variant-focused',
      sourcePath:
          'packages/mix_docs_preview/lib/guides/dynamic_styling/focused.dart',
      category: _variants,
      builder: (_) => const focused.Example(),
    ),
    PreviewEntry(
      previewId: 'variant-selected',
      sourcePath:
          'packages/mix_docs_preview/lib/guides/dynamic_styling/selected.dart',
      category: _variants,
      builder: (_) => const selected.Example(),
    ),
    PreviewEntry(
      previewId: 'variant-disabled',
      sourcePath:
          'packages/mix_docs_preview/lib/guides/dynamic_styling/disabled.dart',
      category: _variants,
      builder: (_) => const disabled.Example(),
    ),
    PreviewEntry(
      previewId: 'variant-selected-toggle',
      sourcePath:
          'packages/mix_docs_preview/lib/guides/dynamic_styling/selected_toggle.dart',
      category: _variants,
      builder: (_) => const selected_toggle.Example(),
    ),
    PreviewEntry(
      previewId: 'variant-responsive',
      sourcePath:
          'packages/mix_docs_preview/lib/guides/dynamic_styling/responsive_size.dart',
      category: _variants,
      builder: (_) => const responsive_size.Example(),
    ),
    // Gradients
    PreviewEntry(
      previewId: 'gradient-linear',
      sourcePath:
          'packages/mix_docs_preview/lib/guides/gradients/gradient_linear.dart',
      category: _gradients,
      builder: (_) => const gradient_linear.Example(),
    ),
    PreviewEntry(
      previewId: 'gradient-radial',
      sourcePath:
          'packages/mix_docs_preview/lib/guides/gradients/gradient_radial.dart',
      category: _gradients,
      builder: (_) => const gradient_radial.Example(),
    ),
    PreviewEntry(
      previewId: 'gradient-sweep',
      sourcePath:
          'packages/mix_docs_preview/lib/guides/gradients/gradient_sweep.dart',
      category: _gradients,
      builder: (_) => const gradient_sweep.Example(),
    ),

    // Animations (gallery-only)
    PreviewEntry(
      previewId: 'anim-auto-scale',
      sourcePath:
          'packages/mix_docs_preview/lib/guides/animations/implicit_curved_scale.dart',
      category: _animations,
      builder: (_) => const auto_scale.Example(),
    ),
    PreviewEntry(
      previewId: 'anim-spring',
      sourcePath:
          'packages/mix_docs_preview/lib/guides/animations/implicit_spring_translate.dart',
      category: _animations,
      builder: (_) => const spring_anim.Example(),
    ),
  ];

  /// Index for fast preview ID lookup.
  static final Map<String, PreviewEntry> _byPreviewId = _buildPreviewIdIndex(
    _previews,
  );

  const PreviewRegistry._();

  /// Gets a preview entry by ID.
  static PreviewEntry? getByPreviewId(String previewId) =>
      _byPreviewId[previewId];

  static Map<String, PreviewEntry> _buildPreviewIdIndex(
    List<PreviewEntry> previews,
  ) {
    final previewIdIndex = <String, PreviewEntry>{};

    for (final preview in previews) {
      if (previewIdIndex.containsKey(preview.previewId)) {
        final existing = previewIdIndex[preview.previewId]!;
        throw StateError(
          'Duplicate previewId "${preview.previewId}" for '
          '"${existing.sourcePath}" and "${preview.sourcePath}".',
        );
      }

      previewIdIndex[preview.previewId] = preview;
    }

    return previewIdIndex;
  }

  /// All registered previews.
  static List<PreviewEntry> get all => _previews;

  /// Returns all available preview IDs.
  static List<String> get availablePreviewIds => _byPreviewId.keys.toList();

  /// Returns manifest entries for website/docs consumption.
  static List<Map<String, Object?>> get manifestEntries {
    return _previews
        .map((preview) {
          return <String, Object?>{
            'previewId': preview.previewId,
            'sourcePath': preview.sourcePath,
            'snippetRegion': preview.snippetRegion,
            'category': preview.category,
            'renderable': preview.renderable,
          };
        })
        .toList(growable: false);
  }

  /// Builds a widget for the given preview ID.
  ///
  /// Returns an error widget if the preview ID is not found or if the preview
  /// widget throws during construction.
  static Widget build(String? previewId, BuildContext context) {
    if (previewId == null || previewId.isEmpty) {
      return const _UnknownPreview(previewId: 'null');
    }

    final entry = _byPreviewId[previewId];
    if (entry == null) {
      return _UnknownPreview(previewId: previewId);
    }

    try {
      return entry.builder(context);
    } catch (e, stackTrace) {
      debugPrint('Preview "$previewId" construction error: $e');

      return _ErrorPreview(
        previewId: previewId,
        error: e,
        stackTrace: stackTrace,
      );
    }
  }
}

/// Widget displayed when an unknown preview ID is requested.
class _UnknownPreview extends StatelessWidget {
  final String previewId;

  const _UnknownPreview({required this.previewId});

  @override
  Widget build(BuildContext context) {
    final sanitizedId = previewId.length > 100
        ? '${previewId.substring(0, 100)}...'
        : previewId;

    return Center(
      child: Padding(
        padding: const .all(16),
        child: Text(
          'Unknown previewId: $sanitizedId\n\n'
          'Available previewIds:\n'
          '${PreviewRegistry.availablePreviewIds.join('\n')}',
          style: const TextStyle(color: Color(0xFFEF4444), fontSize: 14),
          textAlign: .center,
        ),
      ),
    );
  }
}

/// Widget displayed when a preview throws an error.
class _ErrorPreview extends StatelessWidget {
  final String previewId;

  final Object error;
  final StackTrace? stackTrace;
  const _ErrorPreview({
    required this.previewId,
    required this.error,
    this.stackTrace,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const .all(16),
        child: Column(
          mainAxisSize: .min,
          spacing: 8,
          children: [
            const Text(
              '⚠️ Preview Error',
              style: TextStyle(
                color: Color(0xFFEF4444),
                fontSize: 16,
                fontWeight: .bold,
              ),
            ),
            Text(
              'Preview: $previewId',
              style: const TextStyle(color: Color(0xFF9CA3AF), fontSize: 12),
            ),
            Text(
              error.toString(),
              style: const TextStyle(color: Color(0xFFEF4444), fontSize: 12),
              textAlign: .center,
              overflow: .ellipsis,
              maxLines: 5,
            ),
          ],
        ),
      ),
    );
  }
}
