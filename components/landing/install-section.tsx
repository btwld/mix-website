import type { ReactNode } from 'react';
import { CopyCommand } from './copy-command';

export function InstallSection({ children }: { children?: ReactNode }) {
  return <section className="lx-shell lx-shell-narrow lx-gap" aria-labelledby="mix-install">
    <div className="lx-install lx-reveal">
      <span className="lx-eyebrow">Get started</span>
      <h2 className="lx-title" id="mix-install">Add Mix to your project.</h2>
      <CopyCommand command="flutter pub add mix" />
      {children && <p className="lx-lead">{children}</p>}
    </div>
  </section>;
}
