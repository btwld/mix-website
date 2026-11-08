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
  'showcase.dart': 'Shared state and the controls used by the tour.',
  'app.dart': 'The showcase frame and layout.',
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
        <p>Explore the complete files that power the live showcase. These cards share the styles, tokens, and state shown here — they aren’t standalone snippets.</p>
      </header>

      <details className="v2-source-readme">
        <summary><span>Use the source together</span><span>Dependencies & setup</span></summary>
        <div className="v2-source-setup">
          <div>
            <p>{packages.requirements}</p>
            <p>Clone the repository, open the showcase package, then run it in Chrome:</p>
            <pre><code>{`git clone https://github.com/btwld/mix-website.git
cd mix-website/packages/mix_showcase
flutter run -d chrome`}</code></pre>
            <p><a href={packages.github.package}>Browse the showcase package on GitHub</a>. Start with <code>cards.dart</code>, then follow its shared styles, tokens and state.</p>
            <p>Font license notices are included in the file selector below. Remix brings Mix and Naked UI with it.</p>
          </div>
          <aside aria-label="Showcase dependencies">
            <h3>This example uses</h3>
            <dl>
              <div><dt>Mix</dt><dd>{packages.libraries.mix.version}</dd></div>
              <div><dt>Remix</dt><dd>{packages.libraries.remix.version}</dd></div>
              <div><dt>Naked UI</dt><dd>{packages.libraries.naked_ui.version}</dd></div>
            </dl>
            <p>Versions are read from this example’s package manifest. Keep them together when exploring the source.</p>
          </aside>
        </div>
      </details>

      <SourceBrowser files={files} github={packages.github.files} pinned={packages.github.pinned} />
    </div>
  </div>;
}
