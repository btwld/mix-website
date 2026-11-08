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
  title: 'Showcase source · Mix',
  description: 'Explore the complete source files behind the live Mix, Remix and Naked UI card showcase.',
  robots: { index: false, follow: false },
};

const descriptions: Record<string, string> = {
  'cards.dart': 'The five cards, their layouts and interactions.',
  'styles.dart': 'Shared Mix styles, variants and animation.',
  'tokens.dart': 'The four looks, design tokens and custom corner shape.',
  'token_example.dart': 'A runnable token starter: declare, provide, use, then switch values.',
  'showcase.dart': 'Shared state and the controls used by the tour.',
  'app.dart': 'The showcase frame, phone view, and component outlines.',
  'main.dart': 'The Flutter entry point and theme scope.',
  'invite.dart': 'The Remix and bare Naked UI invite flows.',
  'fortal_today.dart': 'The Today card composed from installed Fortal recipes.',
  'bridge.dart': 'Selects the web or native host bridge.',
  'bridge_web.dart': 'Connects the Flutter app to the website tour.',
  'bridge_stub.dart': 'The bridge fallback outside the browser.',
  'pubspec.yaml': 'Pinned dependencies, SDK requirements and font assets.',
  'remix.yaml': 'Remix CLI configuration, Fortal preset and pinned registry source.',
  'web/index.html': 'The Flutter web host document.',
  'web/flutter_bootstrap.js': 'The web loader used by the showcase.',
  'assets/fonts/OFL.txt': 'License notices for the bundled fonts.',
};

export default async function ShowcaseSourcePage() {
  const packages = await showcasePackage();
  const root = path.join(process.cwd(), 'packages/mix_showcase');
  const dartFiles = await showcaseDartFiles();
  const ordered = ['cards.dart', 'styles.dart', 'tokens.dart', 'showcase.dart', 'app.dart', 'main.dart'];
  const names = [...ordered.filter(file => dartFiles.includes(file)), ...dartFiles.filter(file => !ordered.includes(file)).sort()];
  const paths = [...names.map(file => `lib/${file}`), 'remix.yaml', 'pubspec.yaml', 'web/index.html', 'web/flutter_bootstrap.js', 'assets/fonts/OFL.txt'];
  const files: SourceFile[] = await Promise.all(paths.map(async file => {
    const raw = await readFile(path.join(root, file), 'utf8');
    const id = file.startsWith('lib/') ? file.slice(4) : file;
    const lang = file.endsWith('.dart') ? 'dart' : file.endsWith('.yaml') ? 'yaml' : file.endsWith('.js') ? 'javascript' : file.endsWith('.html') ? 'html' : 'text';
    return { id, path: file, description: descriptions[id] ?? (file.startsWith('lib/fortal/') ? 'Installed by remix add. This source lives in the app and can be edited here.' : 'Showcase source file.'), raw, html: await codeToHtml(raw, { lang, theme: DARK_CODE_THEME, transformers: [{ line(node, line) { node.properties.id = `L${line}`; node.properties['data-line'] = line; } }] }) };
  }));

  return <div className="lx project-mix v2-source" id="v2-content">
    <div className="v2-source-shell">
      <Link className="v2-source-back" href="/v2/#v2-blocks">← Back to showcase</Link>
      <header className="v2-source-intro">
        <p className="v2-source-eyebrow">Showcase source</p>
        <h1>Behind the cards.</h1>
        <p>Follow the tokens, styles, and components behind the live interface. Run the complete project, or start with the smaller token starter.</p>
      </header>

      <details className="v2-source-readme" id="v2-source-setup" open>
        <summary><span>Use the source together</span><span>Dependencies & setup</span></summary>
        <div className="v2-source-setup">
          <div>
            <p>{packages.requirements}</p>
            <p>{packages.github.pinned ? 'Run this version of the showcase:' : 'Run the linked committed version:'}</p>
            {packages.github.dirty && <p>This preview includes local changes that are not in the checkout below.</p>}
            <pre><code>{`git clone https://github.com/btwld/mix-website.git
cd mix-website
git checkout ${packages.github.reference}
cd packages/mix_showcase
flutter pub get
flutter run -d chrome`}</code></pre>
            <p>For a smaller starting point, run the token starter in the same package:</p>
            <pre><code>flutter run -d chrome -t lib/token_example.dart</code></pre>
            <p><a href={packages.github.package}>Browse the showcase package on GitHub</a>. Start with <code>cards.dart</code>, then follow its shared styles, tokens and state.</p>
            <p>The file selector includes the bundled fonts’ license notices.</p>
          </div>
          <aside aria-label="Showcase dependencies">
            <h3>This example uses</h3>
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
