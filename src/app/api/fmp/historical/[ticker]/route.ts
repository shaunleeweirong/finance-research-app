import { NextRequest, NextResponse } from 'next/server';
import { getHistoricalPrices, FMPError } from '@/lib/fmp';
import { isValidTicker } from '@/lib/utils/validation';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;

  if (!isValidTicker(ticker)) {
    return NextResponse.json({ error: 'Invalid ticker symbol' }, { status: 400 });
  }
  const from = request.nextUrl.searchParams.get('from') ?? undefined;
  const to = request.nextUrl.searchParams.get('to') ?? undefined;

  try {
    const result = await getHistoricalPrices(ticker, from, to);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof FMPError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
