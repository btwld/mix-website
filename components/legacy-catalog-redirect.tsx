'use client';

import { useEffect } from 'react';
import { PROJECTS } from '@/lib/projects.mjs';

// Old catalog deep links used the docs root with a Widgetbook hash
// (btwld.github.io/remix/#/?path=...). Forward them to the catalog.
export function LegacyCatalogRedirect() {
  useEffect(() => {
    if (location.hash.startsWith('#/?')) location.replace(PROJECTS.remix.catalogPath + location.search + location.hash);
  }, []);
  return null;
}
