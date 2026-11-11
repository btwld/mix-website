import type { Metadata } from 'next';
import { Showcase } from '@/components/v2/showcase';
import { showcaseCode, showcasePackage } from '@/lib/showcase-source';
import '../../v2.css';

export const metadata: Metadata = {
  title: 'Mix, Naked UI and Remix for Flutter',
  description: 'Three open-source libraries for building a Flutter design system: Mix for styling, Naked UI for behavior, Remix for components. Live examples with the source they run.',
  robots: { index: false, follow: false },
};

export default async function VersionTwo() {
  const [code, packages] = await Promise.all([showcaseCode(), showcasePackage()]);
  return <Showcase code={code} packages={packages} />;
}
