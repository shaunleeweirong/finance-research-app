import { NextRequest, NextResponse } from 'next/server';
import {
  getRevenueProductSegmentation,
  getRevenueGeographicSegmentation,
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
    const [product, geographic] = await Promise.all([
      getRevenueProductSegmentation(ticker),
      getRevenueGeographicSegmentation(ticker),
    ]);

    return NextResponse.json({ product, geographic });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
