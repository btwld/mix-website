'use client';

import { useEffect, useState } from 'react';
import { Check, Copy } from './icons';

/** The install line, copyable. Reverts to the copy affordance after two seconds. */
export function CopyCommand({ command }: { command: string }) {
  const [status, setStatus] = useState<'idle' | 'copied' | 'error'>('idle');

  useEffect(() => {
    if (status !== 'copied') return;
    const timer = window.setTimeout(() => setStatus('idle'), 2000);
    return () => window.clearTimeout(timer);
  }, [status]);

  return <>
    <div className="lx-terminal">
      <span className="lx-terminal-prompt" aria-hidden="true">$</span>
      <code className="lx-terminal-cmd" tabIndex={0}>{command}</code>
      <button type="button" onClick={async () => {
        try {
          await navigator.clipboard.writeText(command);
          setStatus('copied');
        } catch { setStatus('error'); }
      }} aria-label={status === 'copied' ? 'Command copied' : `Copy ${command}`}>
        {status === 'copied' ? <Check /> : <Copy />}
      </button>
    </div>
    <p className="lx-copy-status" role="status">
      {status === 'copied' ? 'Copied to clipboard.' : status === 'error' ? 'Select and copy the command above.' : ''}
    </p>
  </>;
}
