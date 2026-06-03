import { NextRequest, NextResponse } from 'next/server';
import { getStripe, getPlanFromPriceId } from '@/lib/stripe';
import { createServiceClient } from '@/lib/supabase/server';
import { hashId } from '@/lib/utils/log-redact';
import Stripe from 'stripe';

function getEntitledPlan(subscription: Stripe.Subscription): 'free' | 'pro' | 'premium' {
  const priceId = subscription.items.data[0]?.price.id;
  const paidPlan = getPlanFromPriceId(priceId);

  switch (subscription.status) {
    case 'active':
    case 'trialing':
    case 'past_due':
      return paidPlan;
    case 'incomplete':
    case 'incomplete_expired':
    case 'unpaid':
    case 'paused':
    case 'canceled':
    default:
      return 'free';
  }
}

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

  const supabase = await createServiceClient();

  // Idempotency guard. Stripe guarantees at-least-once delivery; record the
  // event ID first and short-circuit if we have already processed it. The
  // INSERT is the source of truth — if it succeeds, we own this delivery; if
  // it fails with 23505 (unique violation) the event was processed before.
  const { error: idempotencyError } = await supabase
    .from('processed_webhook_events')
    .insert({ stripe_event_id: event.id, event_type: event.type });

  if (idempotencyError) {
    if (idempotencyError.code === '23505') {
      // Duplicate delivery — acknowledge to stop Stripe from retrying.
      return NextResponse.json({ received: true, duplicate: true });
    }
    // Any other DB error (table missing, network) is a genuine failure.
    // Returning 500 lets Stripe retry once the underlying issue is fixed.
    console.error('Webhook idempotency record failed:', JSON.stringify({
      eventId: event.id,
      eventType: event.type,
      code: idempotencyError.code,
      message: idempotencyError.message,
    }));
    return NextResponse.json({ error: 'Idempotency check failed' }, { status: 500 });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const userId = session.metadata?.supabaseUserId;
      if (!userId || !session.subscription) break;

      const subscription = await getStripe().subscriptions.retrieve(session.subscription as string);
      const plan = getEntitledPlan(subscription);

      const { error } = await supabase
        .from('user_profiles')
        .update({
          plan,
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: session.subscription as string,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) {
        console.error('Webhook checkout.session.completed sync failed:', JSON.stringify({
          userId: hashId(userId),
          code: error.code,
          message: error.message,
        }));
        return NextResponse.json({ error: 'Profile sync failed' }, { status: 500 });
      }
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object;
      const plan = getEntitledPlan(subscription);
      const customerId = subscription.customer as string;

      const { data: profiles, error: lookupError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .limit(1);

      if (lookupError) {
        console.error('Webhook customer.subscription.updated lookup failed:', JSON.stringify({
          customerId: hashId(customerId),
          code: lookupError.code,
          message: lookupError.message,
        }));
        return NextResponse.json({ error: 'Profile lookup failed' }, { status: 500 });
      }

      if (profiles?.[0]) {
        const { error } = await supabase
          .from('user_profiles')
          .update({
            plan,
            stripe_subscription_id: subscription.id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', profiles[0].id);

        if (error) {
          console.error('Webhook customer.subscription.updated sync failed:', JSON.stringify({
            customerId: hashId(customerId),
            profileId: hashId(profiles[0].id),
            code: error.code,
            message: error.message,
          }));
          return NextResponse.json({ error: 'Profile sync failed' }, { status: 500 });
        }
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      const customerId = subscription.customer as string;

      const { error } = await supabase
        .from('user_profiles')
        .update({
          plan: 'free',
          stripe_subscription_id: null,
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_customer_id', customerId);

      if (error) {
        console.error('Webhook customer.subscription.deleted sync failed:', JSON.stringify({
          customerId: hashId(customerId),
          code: error.code,
          message: error.message,
        }));
        return NextResponse.json({ error: 'Profile sync failed' }, { status: 500 });
      }
      break;
    }

    case 'customer.subscription.paused': {
      // getEntitledPlan() above already maps `paused` → 'free' for
      // customer.subscription.updated, so most paused subs are caught there.
      // This case handles the rare delivery where Stripe emits the explicit
      // paused event without a preceding updated event.
      const subscription = event.data.object;
      const customerId = subscription.customer as string;

      const { error } = await supabase
        .from('user_profiles')
        .update({
          plan: 'free',
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_customer_id', customerId);

      if (error) {
        console.error('Webhook customer.subscription.paused sync failed:', JSON.stringify({
          customerId,
          code: error.code,
          message: error.message,
        }));
        return NextResponse.json({ error: 'Profile sync failed' }, { status: 500 });
      }
      break;
    }

    case 'customer.deleted': {
      // Hard delete of a Stripe customer. Clear the linkage so a future signup
      // with the same email won't end up bound to a dead Stripe customer ID,
      // and drop the plan since billing is no longer possible.
      const customer = event.data.object as Stripe.Customer;

      const { error } = await supabase
        .from('user_profiles')
        .update({
          plan: 'free',
          stripe_customer_id: null,
          stripe_subscription_id: null,
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_customer_id', customer.id);

      if (error) {
        console.error('Webhook customer.deleted sync failed:', JSON.stringify({
          customerId: customer.id,
          code: error.code,
          message: error.message,
        }));
        return NextResponse.json({ error: 'Profile sync failed' }, { status: 500 });
      }
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;

      // Log for monitoring — in production, integrate email notifications
      console.error('Payment failed for customer:', JSON.stringify({
        customerId: hashId(customerId),
        invoiceId: invoice.id,
        attemptCount: invoice.attempt_count,
        amountDue: invoice.amount_due,
      }));

      // After 3 failed attempts, downgrade to free
      if (invoice.attempt_count >= 3) {
        const { error } = await supabase
          .from('user_profiles')
          .update({
            plan: 'free',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_customer_id', customerId);

        if (error) {
          console.error('Webhook invoice.payment_failed downgrade failed:', JSON.stringify({
            customerId: hashId(customerId),
            code: error.code,
            message: error.message,
          }));
        }
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
