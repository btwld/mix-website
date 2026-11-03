import type { MetadataRoute } from 'next';
import { indexing, siteUrl } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  if (!indexing) return { rules: { userAgent: '*', disallow: '/' } };
  return { rules: { userAgent: '*', allow: '/' }, sitemap: `${siteUrl}/sitemap.xml` };
}
