import { NextRequest, NextResponse } from 'next/server';
import { getInstitutionalHolders, getInsiderTrading, FMPError } from '@/lib/fmp';
import { isValidTicker } from '@/lib/utils/validation';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;

  if (!isValidTicker(ticker)) {
    return NextResponse.json({ error: 'Invalid ticker symbol' }, { status: 400 });
  }

  try {
    const [holders, insiderTrades] = await Promise.all([
      getInstitutionalHolders(ticker),
      getInsiderTrading(ticker, 20),
    ]);

    return NextResponse.json({ holders, insiderTrades });
  } catch (error) {
    if (error instanceof FMPError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
