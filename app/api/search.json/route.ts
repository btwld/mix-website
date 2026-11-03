import { sectionSearch } from '@/lib/search-index';
export const dynamic = 'force-static';
export async function GET() { return Response.json(await sectionSearch.export()); }
