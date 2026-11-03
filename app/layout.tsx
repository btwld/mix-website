import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { SiteProvider } from '@/components/site-provider';
import { SITE_DESCRIPTION, SITE_NAME, indexing, siteUrl } from '@/lib/site';
import './global.css';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: SITE_NAME, template: `%s | ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  icons: { icon: '/remix/assets/favicon.png' },
  // Pilot and preview backends stay out of search engines (plan phase 2).
  robots: indexing ? undefined : { index: false, follow: false },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="en" className="concepta-docs" suppressHydrationWarning>
    <body className="flex min-h-screen flex-col">
      <SiteProvider>{children}</SiteProvider>
    </body>
  </html>;
}
