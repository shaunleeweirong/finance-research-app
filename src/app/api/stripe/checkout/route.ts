import { auth, currentUser } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { getStripe, PRICE_IDS } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const { plan, interval } = await req.json() as {
    plan: 'pro' | 'premium';
    interval: 'monthly' | 'annual';
  };

  if (!plan || !interval || !PRICE_IDS[plan]?.[interval]) {
    return NextResponse.json({ error: 'Invalid plan or interval' }, { status: 400 });
  }

  const priceId = PRICE_IDS[plan][interval];

  // Reuse existing Stripe customer if one exists
  const stripeCustomerId = user.publicMetadata.stripeCustomerId as string | undefined;

  const session = await getStripe().checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    customer: stripeCustomerId || undefined,
    customer_email: stripeCustomerId ? undefined : user.emailAddresses[0]?.emailAddress,
    metadata: { clerkUserId: userId },
    success_url: `${req.nextUrl.origin}/billing?success=true`,
    cancel_url: `${req.nextUrl.origin}/pricing?canceled=true`,
  });

  return NextResponse.json({ url: session.url });
}
