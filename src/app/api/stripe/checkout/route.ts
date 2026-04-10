import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/server';
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

  // Get or create Stripe customer
  const serviceClient = await createServiceClient();
  const { data: profile } = await serviceClient
    .from('user_profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single();

  let customerId = profile?.stripe_customer_id;

  if (!customerId) {
    // Create a Stripe customer first (required for Accounts V2)
    const customer = await getStripe().customers.create({
      email: user.email!,
      metadata: { supabaseUserId: user.id },
    });
    customerId = customer.id;

    // Save customer ID to profile
    await serviceClient
      .from('user_profiles')
      .update({ stripe_customer_id: customerId, updated_at: new Date().toISOString() })
      .eq('id', user.id);
  }

  try {
    const session = await getStripe().checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      customer: customerId,
      metadata: { supabaseUserId: user.id },
      success_url: `${req.nextUrl.origin}/billing?success=true`,
      cancel_url: `${req.nextUrl.origin}/pricing?canceled=true`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('Stripe checkout error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to create checkout' },
      { status: 500 },
    );
  }
}
