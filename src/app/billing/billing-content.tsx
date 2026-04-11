'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { UserMenu } from '@/components/auth/user-menu';
import { Check, CreditCard, ArrowRight } from 'lucide-react';
import type { Plan } from '@/lib/auth/plans';
import type { User } from '@supabase/supabase-js';

const PLAN_DETAILS: Record<Plan, { label: string; description: string }> = {
  free: { label: 'Free', description: 'Basic financial data access' },
  pro: { label: 'Pro', description: 'Advanced data for serious investors' },
  premium: { label: 'Premium', description: 'Full platform access with AI features' },
};

export function BillingContent() {
  const [user, setUser] = useState<User | null>(null);
  const [plan, setPlan] = useState<Plan>('free');
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const success = searchParams.get('success');
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('plan')
          .eq('id', user.id)
          .single();
        setPlan((profile?.plan as Plan) || 'free');
      }
      setLoading(false);
    }
    load();
  }, [supabase]);

  if (loading) {
    return (
      <main className="min-h-screen bg-background px-4 py-8">
        <div className="mx-auto max-w-2xl">
          <div className="h-96 animate-pulse rounded-lg bg-surface" />
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-background px-4 py-8">
        <div className="mx-auto max-w-2xl text-center py-24">
          <h1 className="text-2xl font-bold text-foreground mb-4">Sign in to view billing</h1>
          <Link href="/sign-in" className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-500 transition-colors">
            Sign in
          </Link>
        </div>
      </main>
    );
  }

  const details = PLAN_DETAILS[plan];

  async function handleManageSubscription() {
    const res = await fetch('/api/stripe/portal', { method: 'POST' });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    }
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between mb-12">
          <Link href="/" className="text-lg font-bold text-foreground">FinanceResearch</Link>
          <UserMenu />
        </div>

        <h1 className="text-3xl font-bold text-foreground mb-8">Billing</h1>

        {success && (
          <div className="mb-6 rounded-lg border border-green-600/30 bg-green-600/10 px-4 py-3 flex items-center gap-2">
            <Check className="h-4 w-4 text-green-500" />
            <span className="text-sm text-green-400">Subscription activated successfully! Welcome to {details.label}.</span>
          </div>
        )}

        <div className="rounded-xl border border-border bg-surface p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-text-secondary mb-1">Current plan</p>
              <h2 className="text-xl font-semibold text-foreground">{details.label}</h2>
              <p className="text-sm text-text-secondary mt-1">{details.description}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600/10">
              <CreditCard className="h-5 w-5 text-blue-500" />
            </div>
          </div>
        </div>

        {plan === 'free' ? (
          <Link href="/pricing" className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-500 transition-colors w-full">
            Upgrade your plan
            <ArrowRight className="h-4 w-4" />
          </Link>
        ) : (
          <div className="space-y-3">
            <button onClick={handleManageSubscription} className="flex items-center justify-center gap-2 rounded-lg border border-border bg-surface px-6 py-3 text-sm font-medium text-foreground hover:bg-surface-hover transition-colors w-full">
              Manage subscription
              <ArrowRight className="h-4 w-4" />
            </button>
            <p className="text-xs text-text-muted text-center">Change plan, update payment method, or cancel via Stripe Customer Portal</p>
          </div>
        )}

        <Link href="/pricing" className="mt-4 block text-center text-sm text-text-secondary hover:text-foreground transition-colors">
          Compare plans
        </Link>
      </div>
    </main>
  );
}
