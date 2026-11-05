import { pageSearch } from '@/lib/search-index';
export const dynamic = 'force-static';
export async function GET() { return Response.json(await pageSearch.export()); }
