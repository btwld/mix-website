import Link from 'next/link';
import { CodeBlock } from './code-block';
import { SectionHead, WindowBar } from './ui';
import { ArrowRight } from './icons';

const STYLE_SOURCE = `@MixWidget()
final appCardStyle = BoxStyler()
    .color(Colors.deepPurple)
    .paddingAll(16)
    .borderRounded(12);`;

const GENERATED_WIDGET = `class AppCard extends StatelessWidget {
  const AppCard({super.key, this.child});

  final Widget? child;

  @override
  Widget build(BuildContext context) {
    return appCardStyle.call(
      key: this.key,
      child: this.child,
    );
  }
}`;

const WIDGET_USAGE = `const AppCard(
  child: Text(
    'A real Flutter widget',
  ),
);`;

function FileHeader({ filename, label }: { filename: string; label: string }) {
  return <div className="lx-codegen-head"><span>{filename}</span><span>{label}</span></div>;
}

/** The restored code-generation panel: annotate a style, get a widget API. */
export function MixCodegen() {
  return <section className="lx-shell lx-gap" aria-labelledby="mix-codegen">
    <SectionHead
      align="left"
      eyebrow="Code generation"
      id="mix-codegen"
      title="Turn a Styler into a widget API."
      lead={<>Annotate the style you already use. Mix generates a typed <code>StatelessWidget</code> that is ready for layouts, const constructors, and your design system&rsquo;s public API.</>}
    />

    <div className="lx-window lx-reveal">
      <WindowBar label="AppCard code generation" />
      <div className="lx-codegen">
        <article>
          <FileHeader filename="app_card.dart" label="You write" />
          <CodeBlock code={STYLE_SOURCE} className="lx-codegen-code" />
        </article>
        <article>
          <FileHeader filename="app_card.g.dart" label="Generated" />
          <CodeBlock code={GENERATED_WIDGET} className="lx-codegen-code" />
        </article>
        <article>
          <FileHeader filename="usage.dart" label="Use it" />
          <CodeBlock code={WIDGET_USAGE} className="lx-codegen-code" />
        </article>
      </div>
    </div>

    <Link className="lx-inline-link lx-reveal" href="/mix/docs/ecosystem/mix-generator/#mixwidget" style={{ marginTop: '1.25rem' }}>
      See the annotation and generated Dart<ArrowRight />
    </Link>
  </section>;
}
