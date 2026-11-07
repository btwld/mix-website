import type { Metadata } from 'next';
import { Tour } from '@/components/v2/tour';
import { showcaseCode, showcasePackage } from '@/lib/showcase-source';
import '../../v2.css';

export const metadata: Metadata = {
  title: 'Flutter UI, your way',
  description: 'Style with Mix, compose with Remix, and build on Naked UI. Explore three open-source libraries in one live Flutter showcase.',
  robots: { index: false, follow: false },
};

export default async function VersionTwo() {
  const [code, packages] = await Promise.all([showcaseCode(), showcasePackage()]);
  return <Tour code={code} packages={packages} />;
}
