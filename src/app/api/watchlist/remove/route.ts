import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isValidTicker } from '@/lib/utils/validation';
import { canAccess } from '@/lib/auth/plans';
import { getUserPlan } from '@/lib/auth/get-user-plan';

export async function POST(request: NextRequest) {
  // CSRF protection: validate Origin matches the server's own origin
  const origin = request.headers.get('origin');
  if (origin && origin !== request.nextUrl.origin) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userPlan = await getUserPlan(user.id, supabase);
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
    .delete()
    .eq('user_id', user.id)
    .eq('ticker', normalizedTicker);

  if (error) {
    if (error.code === '42P01') {
      return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 });
    }
    console.error('watchlist_remove_error', { userId: user.id, ticker: normalizedTicker, code: error.code });
    return NextResponse.json({ error: 'Failed to remove watchlist item' }, { status: 400 });
  }

  return NextResponse.json({ ok: true, ticker: normalizedTicker, isWatchlisted: false });
}
