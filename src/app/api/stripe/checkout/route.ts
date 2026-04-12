import { createClient, createServiceClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { getStripe, PRICE_IDS } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { plan, interval } = (payload ?? {}) as {
    plan: 'pro' | 'premium';
    interval: 'monthly' | 'annual';
  };

  if (!plan || !interval || !PRICE_IDS[plan]?.[interval]) {
    return NextResponse.json({ error: 'Invalid plan or interval' }, { status: 400 });
  }

  const priceId = PRICE_IDS[plan][interval];

  // Get or create Stripe customer
  const serviceClient = await createServiceClient();
  const { data: profile, error: profileError } = await serviceClient
    .from('user_profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    console.error('Stripe checkout profile lookup failed:', JSON.stringify({
      userId: user.id,
      code: profileError.code,
      message: profileError.message,
    }));
    return NextResponse.json({ error: 'Unable to load billing profile' }, { status: 500 });
  }

  if (!profile) {
    return NextResponse.json({ error: 'Account profile is not provisioned' }, { status: 409 });
  }

  let customerId = profile.stripe_customer_id;

  if (!customerId) {
    // Create a Stripe customer first (required for Accounts V2)
    const customer = await getStripe().customers.create({
      email: user.email!,
      metadata: { supabaseUserId: user.id },
    });
    customerId = customer.id;

    // Save customer ID to profile
    const { error: updateError } = await serviceClient
      .from('user_profiles')
      .update({ stripe_customer_id: customerId, updated_at: new Date().toISOString() })
      .eq('id', user.id);

    if (updateError) {
      await getStripe().customers.del(customerId);
      console.error('Stripe customer linkage save failed:', JSON.stringify({
        userId: user.id,
        customerId,
        code: updateError.code,
        message: updateError.message,
      }));
      return NextResponse.json({ error: 'Unable to prepare checkout session' }, { status: 500 });
    }
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
  } catch (err: unknown) {
    const error = err as { message?: string; type?: string; code?: string; statusCode?: number };
    console.error('Stripe checkout error:', JSON.stringify({
      message: error.message,
      type: error.type,
      code: error.code,
      statusCode: error.statusCode,
    }));
    return NextResponse.json(
      {
        error: error.message || 'Failed to create checkout',
        type: error.type,
        code: error.code,
      },
      { status: 500 },
    );
  }
}
