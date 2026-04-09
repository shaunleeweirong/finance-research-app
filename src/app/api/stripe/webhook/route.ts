import { NextRequest, NextResponse } from 'next/server';
import { getStripe, getPlanFromPriceId } from '@/lib/stripe';
import { clerkClient } from '@clerk/nextjs/server';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const client = await clerkClient();

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const clerkUserId = session.metadata?.clerkUserId;
      if (!clerkUserId || !session.subscription) break;

      const subscription = await getStripe().subscriptions.retrieve(session.subscription as string);
      const priceId = subscription.items.data[0]?.price.id;
      const plan = getPlanFromPriceId(priceId);

      await client.users.updateUserMetadata(clerkUserId, {
        publicMetadata: {
          plan,
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: session.subscription as string,
        },
      });
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object;
      const priceId = subscription.items.data[0]?.price.id;
      const plan = getPlanFromPriceId(priceId);

      // Find Clerk user by stripeCustomerId
      const customerId = subscription.customer as string;
      const matchedUser = (await client.users.getUserList({ limit: 100 })).data.find(
        (u) => u.publicMetadata.stripeCustomerId === customerId,
      );
      if (matchedUser) {
        await client.users.updateUserMetadata(matchedUser.id, {
          publicMetadata: {
            plan: subscription.status === 'active' ? plan : 'free',
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscription.id,
          },
        });
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      const customerId = subscription.customer as string;

      const matchedUser = (await client.users.getUserList({ limit: 100 })).data.find(
        (u) => u.publicMetadata.stripeCustomerId === customerId,
      );
      if (matchedUser) {
        await client.users.updateUserMetadata(matchedUser.id, {
          publicMetadata: {
            plan: 'free',
            stripeCustomerId: customerId,
            stripeSubscriptionId: null,
          },
        });
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
