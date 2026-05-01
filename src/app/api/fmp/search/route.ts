import { NextRequest, NextResponse } from 'next/server';
import { searchCompanies, FMPError } from '@/lib/fmp';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q');

  if (!q || q.length < 1) {
    return NextResponse.json(
      { error: 'Query parameter "q" is required and must have at least 1 character' },
      { status: 400 }
    );
  }

  try {
    const results = await searchCompanies(q);
    return NextResponse.json(results);
  } catch (error) {
    if (error instanceof FMPError) {
      // Don't echo FMPError.message to the browser — it can reveal the
      // upstream provider, the failing endpoint, or the env-var-missing
      // condition. Log internally; surface a generic status to the caller.
      console.error('fmp_search_error', JSON.stringify({
        endpoint: error.endpoint,
        status: error.status,
        message: error.message,
      }));
      const clientStatus = error.status === 429 ? 429 : 502;
      const clientMessage = error.status === 429 ? 'Search temporarily rate-limited' : 'Search unavailable';
      return NextResponse.json({ error: clientMessage }, { status: clientStatus });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
