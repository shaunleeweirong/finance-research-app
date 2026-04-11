import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function GET() {
  const key = process.env.STRIPE_SECRET_KEY;
  const result: Record<string, unknown> = {
    hasKey: !!key,
    keyPrefix: key?.substring(0, 12) + '...',
  };

  try {
    // Test 1: Raw fetch to Stripe API
    const fetchRes = await fetch('https://api.stripe.com/v1/customers?limit=1', {
      headers: { Authorization: `Bearer ${key}` },
    });
    result.fetchStatus = fetchRes.status;
    result.fetchOk = fetchRes.ok;
    const fetchData = await fetchRes.json();
    result.fetchError = fetchData.error?.message ?? null;
    result.fetchCustomerCount = fetchData.data?.length ?? 0;
  } catch (err) {
    result.fetchError = (err as Error).message;
  }

  try {
    // Test 2: Stripe SDK
    const stripe = new Stripe(key!);
    const customers = await stripe.customers.list({ limit: 1 });
    result.sdkOk = true;
    result.sdkCustomerCount = customers.data.length;
  } catch (err) {
    const error = err as { message?: string; type?: string };
    result.sdkOk = false;
    result.sdkError = error.message;
    result.sdkErrorType = error.type;
  }

  return NextResponse.json(result);
}
