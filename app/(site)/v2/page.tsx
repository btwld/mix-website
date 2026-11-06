import type { Metadata } from 'next';
import { Tour } from '@/components/v2/tour';
import { showcaseCode } from '@/lib/showcase-source';
import '../../v2.css';

export const metadata: Metadata = {
  title: 'Version 2 prototype',
  description: 'One live Flutter app that shows Mix, Remix and Naked UI as layers of the same interface.',
  robots: { index: false, follow: false },
};

export default async function VersionTwo() {
  return <Tour code={await showcaseCode()} />;
}
