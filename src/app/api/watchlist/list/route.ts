import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { canAccess } from '@/lib/auth/plans';
import { getUserPlan } from '@/lib/auth/get-user-plan';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userPlan = await getUserPlan(user.id);
  if (!canAccess(userPlan, 'watchlist:basic')) {
    return NextResponse.json({ error: 'Upgrade required' }, { status: 403 });
  }

  const { data, error } = await supabase
    .from('watchlist')
    .select('ticker, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    if (error.code === '42P01') {
      return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 });
    }
    console.error('watchlist_list_error', { userId: user.id, code: error.code });
    return NextResponse.json({ error: 'Failed to fetch watchlist' }, { status: 400 });
  }

  return NextResponse.json({ items: data ?? [] });
}
