import type { ComponentProps } from 'react';

// Inline so the landings add no icon dependency. The original used lucide-react
// in the legacy corporate app; these are the same shapes at the same stroke.
function Icon({ children, ...props }: ComponentProps<'svg'>) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" {...props}>{children}</svg>;
}

export const ArrowRight = (props: ComponentProps<'svg'>) => (
  <Icon {...props}><path d="M5 12h13m0 0-4.5-5m4.5 5-4.5 5" /></Icon>
);
export const Check = (props: ComponentProps<'svg'>) => (
  <Icon {...props}><path d="m20 6-11 11-5-5" /></Icon>
);
export const Copy = (props: ComponentProps<'svg'>) => (
  <Icon {...props}><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></Icon>
);
export const Pause = (props: ComponentProps<'svg'>) => (
  <Icon {...props}><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></Icon>
);
export const Play = (props: ComponentProps<'svg'>) => (
  <Icon {...props}><path d="M6 4l14 8-14 8z" /></Icon>
);
export const Blocks = (props: ComponentProps<'svg'>) => (
  <Icon {...props}><rect x="3" y="3" width="8" height="8" rx="1.5" /><rect x="13" y="13" width="8" height="8" rx="1.5" /><path d="M13 7h8M17 3v8M3 17h8M7 13v8" /></Icon>
);
export const Wand = (props: ComponentProps<'svg'>) => (
  <Icon {...props}><path d="M15 4V2m0 20v-2m5-7h2M2 13h2m13.5-6.5 1.5-1.5M5 21l10-10M6.5 6.5 5 5" /></Icon>
);
export const Accessibility = (props: ComponentProps<'svg'>) => (
  <Icon {...props}><circle cx="12" cy="4" r="2" /><path d="M5 8h14M12 8v6m0 0-3 7m3-7 3 7" /></Icon>
);
export const Bolt = (props: ComponentProps<'svg'>) => (
  <Icon {...props}><path d="M13 2 4 14h6l-1 8 9-12h-6z" /></Icon>
);
export const Repeat = (props: ComponentProps<'svg'>) => (
  <Icon {...props}><path d="M4 9V7a2 2 0 0 1 2-2h12l-3-3m3 11v2a2 2 0 0 1-2 2H4l3 3" /></Icon>
);
export const Sparkle = (props: ComponentProps<'svg'>) => (
  <Icon {...props}><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" /></Icon>
);
export const Github = (props: ComponentProps<'svg'>) => (
  <Icon {...props}><path d="M9 19c-4 1.4-4-2.2-6-2.7m12 5.7v-3.6a3.2 3.2 0 0 0-.9-2.5c3-.3 6.1-1.5 6.1-6.6a5.1 5.1 0 0 0-1.4-3.5 4.8 4.8 0 0 0-.1-3.6s-1.4-.4-4.6 1.8a12.3 12.3 0 0 0-6.4 0C4.5 1.3 3.1 1.7 3.1 1.7A4.8 4.8 0 0 0 3 5.3 5.1 5.1 0 0 0 1.6 8.9c0 5 3.1 6.2 6.1 6.6a3.2 3.2 0 0 0-.9 2.5V22" /></Icon>
);
