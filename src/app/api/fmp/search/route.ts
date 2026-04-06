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
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
