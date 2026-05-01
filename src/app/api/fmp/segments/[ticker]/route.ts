import { NextRequest, NextResponse } from 'next/server';
import {
  getRevenueProductSegmentation,
  getRevenueGeographicSegmentation,
  FMPError,
} from '@/lib/fmp';
import { isValidTicker } from '@/lib/utils/validation';
import { createClient } from '@/lib/supabase/server';
import { getUserPlan } from '@/lib/auth/get-user-plan';
import { canAccess } from '@/lib/auth/plans';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;

  if (!isValidTicker(ticker)) {
    return NextResponse.json({ error: 'Invalid ticker symbol' }, { status: 400 });
  }

  // Defense-in-depth: segmentation is Pro-gated under financials:segments.
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userPlan = await getUserPlan(user.id, supabase);
  if (!canAccess(userPlan, 'financials:segments')) {
    return NextResponse.json({ error: 'Upgrade required' }, { status: 403 });
  }

  try {
    const [product, geographic] = await Promise.all([
      getRevenueProductSegmentation(ticker),
      getRevenueGeographicSegmentation(ticker),
    ]);

    return NextResponse.json({ product, geographic });
  } catch (error) {
    if (error instanceof FMPError) {
      console.error('fmp_segments_error', JSON.stringify({
        ticker,
        endpoint: error.endpoint,
        status: error.status,
        message: error.message,
      }));
      const clientStatus = error.status === 429 ? 429 : 502;
      const clientMessage = error.status === 429 ? 'Data temporarily rate-limited' : 'Data unavailable';
      return NextResponse.json({ error: clientMessage }, { status: clientStatus });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
