import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isValidTicker } from '@/lib/utils/validation';
import { canAccess } from '@/lib/auth/plans';
import { getUserPlan } from '@/lib/auth/get-user-plan';

export async function POST(request: NextRequest) {
  // CSRF protection: validate Origin
  const origin = request.headers.get('origin');
  const appOrigin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  if (origin && !origin.includes(new URL(appOrigin).hostname)) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userPlan = await getUserPlan(user.id);
  if (!canAccess(userPlan, 'watchlist:basic')) {
    return NextResponse.json({ error: 'Upgrade required' }, { status: 403 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const ticker = typeof payload === 'object' && payload !== null && 'ticker' in payload
    ? (payload as { ticker?: unknown }).ticker
    : undefined;

  if (typeof ticker !== 'string') {
    return NextResponse.json({ error: 'Ticker must be a string' }, { status: 400 });
  }

  const normalizedTicker = ticker.toUpperCase().trim();

  if (!normalizedTicker || !isValidTicker(normalizedTicker)) {
    return NextResponse.json({ error: 'Invalid ticker symbol' }, { status: 400 });
  }

  const { error } = await supabase
    .from('watchlist')
    .upsert(
      { user_id: user.id, ticker: normalizedTicker },
      { onConflict: 'user_id,ticker', ignoreDuplicates: true }
    );

  if (error) {
    if (error.code === '42P01') {
      return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 });
    }
    console.error('watchlist_add_error', { userId: user.id, ticker: normalizedTicker, code: error.code });
    return NextResponse.json({ error: 'Failed to add watchlist item' }, { status: 400 });
  }

  return NextResponse.json({ ok: true, ticker: normalizedTicker, isWatchlisted: true });
}
