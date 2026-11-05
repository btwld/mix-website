import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { RevealScript } from '@/components/landing/reveal-script';
import { SiteProvider } from '@/components/site-provider';
import { SITE_DESCRIPTION, SITE_NAME, indexing, siteUrl } from '@/lib/site';
import './global.css';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: SITE_NAME, template: `%s | ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  icons: { icon: { url: '/assets/icon_logo.svg', type: 'image/svg+xml' } },
  // Pilot and preview backends stay out of search engines (plan phase 2).
  robots: indexing ? undefined : { index: false, follow: false },
};

// Dark is the only site theme, so it belongs in the server-rendered document:
// first paint and readers without JavaScript must not depend on a client script.
export const viewport: Viewport = { colorScheme: 'dark', themeColor: '#05040a' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="en" className="concepta-docs dark" style={{ colorScheme: 'dark' }} suppressHydrationWarning>
    <head><RevealScript /></head>
    <body className="flex min-h-screen flex-col">
      <SiteProvider>{children}</SiteProvider>
    </body>
  </html>;
}
