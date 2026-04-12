import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getStripe } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate',
};

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select('plan, stripe_subscription_id')
    .eq('id', user.id)
    .maybeSingle();

  if (error) {
    console.error('Billing subscription lookup failed:', JSON.stringify({
      userId: user.id,
      code: error.code,
      message: error.message,
    }));
    return NextResponse.json({ error: 'Failed to load subscription' }, { status: 500, headers: NO_CACHE_HEADERS });
  }

  if (!profile?.stripe_subscription_id) {
    return NextResponse.json({
      plan: profile?.plan ?? 'free',
      subscription: null,
    }, { headers: NO_CACHE_HEADERS });
  }

  try {
    const subscription = await getStripe().subscriptions.retrieve(profile.stripe_subscription_id);

    return NextResponse.json({
      plan: profile.plan,
      subscription: {
        status: subscription.status,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        cancelAt: subscription.cancel_at,
        currentPeriodEnd: subscription.items.data[0]?.current_period_end ?? null,
      },
    }, { headers: NO_CACHE_HEADERS });
  } catch (stripeError) {
    console.error('Stripe subscription fetch failed:', stripeError);
    return NextResponse.json({ error: 'Failed to load subscription' }, { status: 502, headers: NO_CACHE_HEADERS });
  }
}