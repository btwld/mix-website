'use client';

import { useEffect } from 'react';
import { PROJECTS } from '@/lib/projects.mjs';

// Old catalog deep links used the docs root with a Widgetbook hash
// (btwld.github.io/remix/#/?path=...). Forward them to the catalog.
export function LegacyCatalogRedirect() {
  useEffect(() => {
    if (location.hash.startsWith('#/?')) {
      const query = new URLSearchParams(location.hash.slice(3));
      const legacy = query.get('path');
      if (legacy === 'components/button') query.set('path', 'components/remixbutton/button-component');
      location.replace(PROJECTS.remix.catalogPath + location.search + (legacy === 'components/button' ? '#/?' + query.toString().replaceAll('%2F', '/') : location.hash));
    }
  }, []);
  return null;
}
