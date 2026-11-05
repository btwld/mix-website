import { createDocsRoute } from '@/lib/docs-route';

const route = createDocsRoute('remix');
export default route.Page;
export const generateStaticParams = route.generateStaticParams;
export const generateMetadata = route.generateMetadata;
// Only published pages exist; everything else is a real 404.
export const dynamicParams = false;
