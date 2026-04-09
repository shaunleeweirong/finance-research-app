'use client';

import { useUser } from '@clerk/nextjs';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AuthHeader } from '@/components/auth/auth-header';
import { Check, CreditCard, ArrowRight } from 'lucide-react';
import type { Plan } from '@/lib/auth/plans';

const PLAN_DETAILS: Record<Plan, { label: string; description: string }> = {
  free: { label: 'Free', description: 'Basic financial data access' },
  pro: { label: 'Pro', description: 'Advanced data for serious investors' },
  premium: { label: 'Premium', description: 'Full platform access with AI features' },
};

export function BillingContent() {
  const { user, isLoaded, isSignedIn } = useUser();
  const searchParams = useSearchParams();
  const success = searchParams.get('success');

  if (!isLoaded) {
    return (
      <main className="min-h-screen bg-background px-4 py-8">
        <div className="mx-auto max-w-2xl">
          <div className="h-96 animate-pulse rounded-lg bg-surface" />
        </div>
      </main>
    );
  }

  if (!isSignedIn) {
    return (
      <main className="min-h-screen bg-background px-4 py-8">
        <div className="mx-auto max-w-2xl text-center py-24">
          <h1 className="text-2xl font-bold text-foreground mb-4">Sign in to view billing</h1>
          <Link
            href="/sign-in"
            className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-500 transition-colors"
          >
            Sign in
          </Link>
        </div>
      </main>
    );
  }

  const plan = (user?.publicMetadata?.plan as Plan) || 'free';
  const details = PLAN_DETAILS[plan];

  async function handleManageSubscription() {
    const res = await fetch('/api/stripe/portal', {
      method: 'POST',
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    }
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <Link href="/" className="text-lg font-bold text-foreground">
            FinanceResearch
          </Link>
          <AuthHeader />
        </div>

        <h1 className="text-3xl font-bold text-foreground mb-8">Billing</h1>

        {/* Success message */}
        {success && (
          <div className="mb-6 rounded-lg border border-green-600/30 bg-green-600/10 px-4 py-3 flex items-center gap-2">
            <Check className="h-4 w-4 text-green-500" />
            <span className="text-sm text-green-400">
              Subscription activated successfully! Welcome to {details.label}.
            </span>
          </div>
        )}

        {/* Current plan card */}
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

        {/* Actions */}
        {plan === 'free' ? (
          <Link
            href="/pricing"
            className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-500 transition-colors w-full"
          >
            Upgrade your plan
            <ArrowRight className="h-4 w-4" />
          </Link>
        ) : (
          <div className="space-y-3">
            <button
              onClick={handleManageSubscription}
              className="flex items-center justify-center gap-2 rounded-lg border border-border bg-surface px-6 py-3 text-sm font-medium text-foreground hover:bg-surface-hover transition-colors w-full"
            >
              Manage subscription
              <ArrowRight className="h-4 w-4" />
            </button>
            <p className="text-xs text-text-muted text-center">
              Change plan, update payment method, or cancel via Stripe Customer Portal
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
