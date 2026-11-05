'use client';

import { useEffect, useState } from 'react';
import { Check, Copy } from './icons';

/** The install line, copyable. Reverts to the copy affordance after two seconds. */
export function CopyCommand({ command }: { command: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  return <div className="lx-terminal">
    <span className="lx-terminal-prompt" aria-hidden="true">$</span>
    <code className="lx-terminal-cmd">{command}</code>
    <button type="button" onClick={async () => {
      try {
        await navigator.clipboard.writeText(command);
        setCopied(true);
      } catch { /* Clipboard denied: the command stays selectable. */ }
    }} aria-label={copied ? 'Command copied' : `Copy ${command}`}>
      {copied ? <Check /> : <Copy />}
    </button>
  </div>;
}
