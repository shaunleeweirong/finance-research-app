import { NextRequest, NextResponse } from 'next/server';
import {
  getAnalystEstimates,
  getPriceTargetConsensus,
  getPriceTargetSummary,
  getPriceTargets,
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

  // Defense-in-depth: middleware enforces auth on /api/*, but the route also
  // verifies the user's plan grants access to estimates data (Pro-gated).
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userPlan = await getUserPlan(user.id);
  if (!canAccess(userPlan, 'tab:estimates')) {
    return NextResponse.json({ error: 'Upgrade required' }, { status: 403 });
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
