import type { Metadata } from 'next';
import Link from 'next/link';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { codeToHtml } from 'shiki';
import { SourceBrowser, type SourceFile } from '@/components/v2/source-browser';
import { showcaseDartFiles, showcasePackage } from '@/lib/showcase-source';
import { DARK_CODE_THEME } from '@/lib/code-theme';
import '../../../v2.css';
import '../../../v2-source.css';

export const metadata: Metadata = {
  title: 'Example source · Mix',
  description: 'Every file behind the live Mix, Naked UI and Remix examples, with the steps to run them.',
  robots: { index: false, follow: false },
};

const descriptions: Record<string, string> = {
  'colors.dart': 'The plain colors the examples share.',
  'theme.dart': 'The tokens, four sets of values for them, and the scope that provides one.',
  'demos/upgrade_button/style.dart': 'A complete button style: three interaction states and an animation.',
  'demos/upgrade_button/upgrade_button.dart': 'The button widget: the style, made pressable, around its label.',
  'demos/plans.dart': 'The plans several examples show.',
  'demos/plan_card/style.dart': 'A base style, a shared fragment, and a style derived from both.',
  'demos/plan_card/plan_card.dart': 'The card widget: picks one of the two styles and calls it.',
  'demos/action_button/style.dart': 'Hover, press, keyboard focus and disabled, each in the style.',
  'demos/action_button/action_button.dart': 'The button widget, with an optional states controller.',
  'demos/plan_list/style.dart': 'A grid that goes from three columns to one at a breakpoint.',
  'demos/plan_list/plan_list.dart': 'The plan cards, placed by the grid style.',
  'demos/toggle/style.dart': 'A switch whose values animate with a chosen config.',
  'demos/toggle/toggle.dart': 'The switch widget.',
  'demos/confirm_button/style.dart': 'A phase animation built on the first button style.',
  'demos/confirm_button/confirm_button.dart': 'The button that plays the phases on each press.',
  'demos/bell/style.dart': 'A keyframe animation with two tracks on one timeline.',
  'demos/bell/bell.dart': 'The bell that rings on each press.',
  'demos/themed_plan/style.dart': 'Styles that take every value from tokens, so they follow the theme.',
  'demos/themed_plan/themed_plan.dart': 'A plan card and button drawn with those styles.',
  'demos/plan_picker/plan_picker.dart': 'A Naked UI radio group of plans: the behavior, with the drawing passed in.',
  'demos/plan_picker/plan_row.dart': 'Drawing one: each plan as a bordered row with a radio dot.',
  'demos/plan_picker/plan_segment.dart': 'Drawing two: the same group as one segmented bar.',
  'demos/billing_select/billing_select.dart': 'A Naked UI select: the behavior, and what goes in each part.',
  'demos/billing_select/style.dart': 'The select’s trigger, menu and options, as Mix styles.',
  'demos/checkout/checkout.dart': 'A form composed from installed Remix components.',
  'demos/checkout/style.dart': 'The form’s layout, as two Mix styles.',
  'starters/mix.dart': 'A complete main.dart for a first Mix app.',
  'starters/naked_ui.dart': 'A complete main.dart for a first Naked UI app.',
  'remix_starter.dart': 'A complete main.dart that uses an installed component.',
  'main.dart': 'The entry point: a gallery when run alone, one view per example on the website.',
  'host/demos.dart': 'Website wiring: places each example and connects it to the page’s controls.',
  'host/views.dart': 'Website wiring: the per-view app shell and the standalone gallery.',
  'host/host.dart': 'Website wiring: the theme and control values shared by every view.',
  'host/probe.dart': 'Website wiring: reports pointer and focus state so the page can mark code lines.',
  'host/bridge.dart': 'Website wiring: selects the web or native bridge.',
  'host/bridge_web.dart': 'Website wiring: messages between the page and the app.',
  'host/bridge_stub.dart': 'Website wiring: the bridge outside a browser.',
  'pubspec.yaml': 'Pinned dependencies, SDK requirements and font assets.',
  'remix.yaml': 'Remix CLI configuration: the default Ui prefix and the pinned registry revision.',
  'web/index.html': 'The Flutter web host document.',
  'web/flutter_bootstrap.js': 'The web loader. The website starts the engine itself.',
  'assets/fonts/OFL.txt': 'License notices for the bundled fonts.',
};

export default async function ShowcaseSourcePage() {
  const packages = await showcasePackage();
  const root = path.join(process.cwd(), 'packages/mix_showcase');
  const dartFiles = await showcaseDartFiles();
  const ordered = ['colors.dart', 'demos/upgrade_button/style.dart', 'demos/upgrade_button/upgrade_button.dart', 'demos/plans.dart', 'demos/plan_card/style.dart', 'demos/plan_card/plan_card.dart', 'demos/action_button/style.dart', 'demos/action_button/action_button.dart', 'demos/plan_list/style.dart', 'demos/plan_list/plan_list.dart', 'demos/toggle/style.dart', 'demos/toggle/toggle.dart', 'demos/confirm_button/style.dart', 'demos/confirm_button/confirm_button.dart', 'demos/bell/style.dart', 'demos/bell/bell.dart', 'theme.dart', 'demos/themed_plan/style.dart', 'demos/themed_plan/themed_plan.dart', 'demos/plan_picker/plan_picker.dart', 'demos/plan_picker/plan_row.dart', 'demos/plan_picker/plan_segment.dart', 'demos/billing_select/billing_select.dart', 'demos/billing_select/style.dart', 'demos/checkout/checkout.dart', 'demos/checkout/style.dart', 'starters/mix.dart', 'starters/naked_ui.dart', 'remix_starter.dart', 'main.dart'];
  const names = [...ordered.filter(file => dartFiles.includes(file)), ...dartFiles.filter(file => !ordered.includes(file)).sort()];
  const paths = [...names.map(file => `lib/${file}`), 'remix.yaml', 'pubspec.yaml', 'web/index.html', 'web/flutter_bootstrap.js', 'assets/fonts/OFL.txt'];
  const files: SourceFile[] = await Promise.all(paths.map(async file => {
    const raw = await readFile(path.join(root, file), 'utf8');
    const id = file.startsWith('lib/') ? file.slice(4) : file;
    const lang = file.endsWith('.dart') ? 'dart' : file.endsWith('.yaml') ? 'yaml' : file.endsWith('.js') ? 'javascript' : file.endsWith('.html') ? 'html' : 'text';
    return { id, path: file, description: descriptions[id] ?? (file.startsWith('lib/ui/') ? 'Installed by remix add and left as installed, so remix add --diff shows only registry changes. In your own app this source is yours to edit.' : 'Showcase source file.'), raw, html: await codeToHtml(raw, { lang, theme: DARK_CODE_THEME, transformers: [{ line(node, line) { node.properties.id = `L${line}`; node.properties['data-line'] = line; } }] }) };
  }));

  return <div className="lx project-mix v2-source" id="v2-content">
    <div className="v2-source-shell">
      <Link className="v2-source-back" href="/v2/">← Back to the examples</Link>
      <header className="v2-source-intro">
        <p className="v2-source-eyebrow">Example source</p>
        <h1>The files behind the page.</h1>
        <p>Each live example is a folder in <code>lib/demos</code>: its styles in <code>style.dart</code>, its widget in a file of its own (<code>plan_picker</code> keeps one file per drawing). Plain colors come from <code>lib/colors.dart</code>; only the Tokens example uses the tokens in <code>lib/theme.dart</code>. The files in <code>lib/host</code> only connect them to the website.</p>
      </header>

      <details className="v2-source-readme" id="v2-source-setup" open>
        <summary><span>Run the examples</span><span>Dependencies & setup</span></summary>
        <div className="v2-source-setup">
          <div>
            <p>Requires {packages.requirements}.</p>
            <p>{packages.github.pinned ? 'Run this version of the examples:' : 'Run the linked committed version:'}</p>
            {packages.github.dirty && <p>This preview includes local changes that are not in the checkout below.</p>}
            <pre><code>{`git clone https://github.com/btwld/mix-website.git
cd mix-website
git checkout ${packages.github.reference}
cd packages/mix_showcase
flutter pub get
flutter run -d chrome`}</code></pre>
            <p>On its own, the app opens a gallery of the examples with a theme switch. To start smaller, run a starter:</p>
            <pre><code>flutter run -d chrome -t lib/starters/mix.dart</code></pre>
            <p><a href={packages.github.package}>Browse the package on GitHub</a>. Start with any folder in <code>demos</code>.</p>
            <p>The file list includes the bundled fonts’ license notices.</p>
          </div>
          <aside aria-label="Showcase dependencies">
            <h3>The examples use</h3>
            <dl>
              <div><dt>Mix</dt><dd>{packages.libraries.mix.version}</dd></div>
              <div><dt>Remix</dt><dd>{packages.libraries.remix.version}</dd></div>
              <div><dt>Naked UI</dt><dd>{packages.libraries.naked_ui.version}</dd></div>
            </dl>
            <p>Keep these versions together when running the project.</p>
          </aside>
        </div>
      </details>

      <SourceBrowser files={files} github={packages.github.files} pinned={packages.github.pinned} />
    </div>
  </div>;
}
