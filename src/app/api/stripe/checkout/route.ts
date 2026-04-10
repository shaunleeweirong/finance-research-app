import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { getStripe, PRICE_IDS } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { plan, interval } = await req.json() as {
    plan: 'pro' | 'premium';
    interval: 'monthly' | 'annual';
  };

  if (!plan || !interval || !PRICE_IDS[plan]?.[interval]) {
    return NextResponse.json({ error: 'Invalid plan or interval' }, { status: 400 });
  }

  const priceId = PRICE_IDS[plan][interval];

  // Check for existing Stripe customer
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single();

  const stripeCustomerId = profile?.stripe_customer_id;

  const session = await getStripe().checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    customer: stripeCustomerId || undefined,
    customer_email: stripeCustomerId ? undefined : user.email!,
    metadata: { supabaseUserId: user.id },
    success_url: `${req.nextUrl.origin}/billing?success=true`,
    cancel_url: `${req.nextUrl.origin}/pricing?canceled=true`,
  });

  return NextResponse.json({ url: session.url });
}
