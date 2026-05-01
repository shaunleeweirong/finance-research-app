import { createClient, createServiceClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  // CSRF protection: validate Origin matches the server's own origin
  const origin = req.headers.get('origin');
  if (origin && origin !== req.nextUrl.origin) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Read billing-sensitive profile fields via the service-role client to
  // match how the checkout route reads them. Defense-in-depth: a future
  // RLS regression on user_profiles can't surface another user's
  // stripe_customer_id, since the lookup is explicitly scoped by user.id.
  const serviceClient = await createServiceClient();
  const { data: profile } = await serviceClient
    .from('user_profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single();

  if (!profile?.stripe_customer_id) {
    return NextResponse.json({ error: 'No subscription found' }, { status: 404 });
  }

  const session = await getStripe().billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${req.nextUrl.origin}/billing`,
  });

  return NextResponse.json({ url: session.url });
}
