import { NextRequest, NextResponse } from 'next/server';
import {
  getAnalystEstimates,
  getPriceTargetConsensus,
  getPriceTargetSummary,
  getPriceTargets,
  FMPError,
} from '@/lib/fmp';
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
    const [estimates, priceTargetConsensus, priceTargetSummary, priceTargets] =
      await Promise.all([
        getAnalystEstimates(ticker),
        getPriceTargetConsensus(ticker),
        getPriceTargetSummary(ticker),
        getPriceTargets(ticker),
      ]);

    return NextResponse.json({
      estimates,
      priceTargetConsensus,
      priceTargetSummary,
      priceTargets,
    });
  } catch (error) {
    if (error instanceof FMPError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
