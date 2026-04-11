'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Check, X } from 'lucide-react';
import Link from 'next/link';
import { UserMenu } from '@/components/auth/user-menu';
import type { User } from '@supabase/supabase-js';

type Interval = 'monthly' | 'annual';

const TIERS = [
  {
    name: 'Free',
    plan: 'free' as const,
    monthlyPrice: 0,
    annualPrice: 0,
    description: 'Get started with essential financial data',
    cta: 'Get Started',
    highlighted: false,
    features: [
      { name: 'Overview tab', included: true },
      { name: 'Price chart (all ranges)', included: true },
      { name: 'Key metrics', included: true },
      { name: 'News & Filings tabs', included: true },
      { name: 'Financials (5 years)', included: true },
      { name: 'Chart panel (2 metrics)', included: true },
      { name: 'Revenue Segments', included: false },
      { name: 'Estimates tab', included: false },
      { name: 'Ownership tab', included: false },
      { name: 'Extended history (20Y/40Y)', included: false },
      { name: 'Unlimited chart metrics', included: false },
      { name: 'Data export (CSV)', included: false },
    ],
  },
  {
    name: 'Pro',
    plan: 'pro' as const,
    monthlyPrice: 20,
    annualPrice: 16,
    description: 'Advanced data for serious investors',
    cta: 'Start Pro',
    highlighted: true,
    features: [
      { name: 'Everything in Free', included: true },
      { name: 'Financials (40 years)', included: true },
      { name: 'Unlimited chart metrics', included: true },
      { name: 'Revenue Segments', included: true },
      { name: 'Estimates tab', included: true },
      { name: 'Ownership tab', included: true },
      { name: 'Extended history (20Y/40Y)', included: true },
      { name: 'Data export (CSV)', included: true },
      { name: 'AI Copilot', included: false },
      { name: 'Peer comparison', included: false },
    ],
  },
  {
    name: 'Premium',
    plan: 'premium' as const,
    monthlyPrice: 35,
    annualPrice: 28,
    description: 'Full platform access with AI features',
    cta: 'Coming Soon',
    highlighted: false,
    comingSoon: true,
    features: [
      { name: 'Everything in Pro', included: true },
      { name: 'AI Copilot (200 queries/mo)', included: true },
      { name: 'Peer comparison', included: true },
      { name: 'Priority support', included: true },
    ],
  },
];

export default function PricingPage() {
  const [interval, setInterval] = useState<Interval>('monthly');
  const [user, setUser] = useState<User | null>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, [supabase]);

  async function handleCheckout(plan: 'pro' | 'premium') {
    if (!user) {
      window.location.href = '/sign-up';
      return;
    }
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, interval }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error('Checkout error:', data);
        alert(`${data.error || 'Failed to create checkout session'}\nType: ${data.type || 'unknown'}\nCode: ${data.code || 'none'}`);
      }
    } catch (err) {
      console.error('Checkout error:', err);
      alert('Something went wrong. Please try again.');
    }
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between mb-16">
          <Link href="/" className="text-lg font-bold text-foreground">FinanceResearch</Link>
          {user ? <UserMenu /> : (
            <div className="flex items-center gap-3">
              <Link href="/sign-in" className="text-sm text-text-secondary hover:text-foreground transition-colors">Sign in</Link>
              <Link href="/sign-up" className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-500 transition-colors">Sign up</Link>
            </div>
          )}
        </div>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-3">Simple, transparent pricing</h1>
          <p className="text-lg text-text-secondary max-w-lg mx-auto">
            Choose the plan that fits your research needs. Upgrade or downgrade anytime.
          </p>
          <div className="mt-8 inline-flex items-center rounded-lg bg-surface p-1">
            <button
              onClick={() => setInterval('monthly')}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${interval === 'monthly' ? 'bg-surface-hover text-foreground' : 'text-text-secondary hover:text-foreground'}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setInterval('annual')}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${interval === 'annual' ? 'bg-surface-hover text-foreground' : 'text-text-secondary hover:text-foreground'}`}
            >
              Annual
              <span className="ml-1.5 text-xs text-green-500 font-semibold">Save 20%</span>
            </button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
          {TIERS.map((tier) => {
            const price = interval === 'monthly' ? tier.monthlyPrice : tier.annualPrice;
            return (
              <div
                key={tier.name}
                className={`relative rounded-xl border p-6 flex flex-col ${tier.highlighted ? 'border-blue-600 bg-surface shadow-lg shadow-blue-600/5' : 'border-border bg-surface'}`}
              >
                {tier.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-3 py-0.5 text-xs font-semibold text-white">Most Popular</div>
                )}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-foreground">{tier.name}</h3>
                  <p className="mt-1 text-sm text-text-secondary">{tier.description}</p>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-foreground">${price}</span>
                    {price > 0 && <span className="text-sm text-text-secondary">/mo</span>}
                  </div>
                  {interval === 'annual' && price > 0 && (
                    <p className="mt-1 text-xs text-text-muted">Billed annually (${price * 12}/yr)</p>
                  )}
                </div>

                {tier.plan === 'free' ? (
                  <Link
                    href={user ? '/' : '/sign-up'}
                    className="mb-6 block rounded-lg border border-border bg-background px-4 py-2.5 text-center text-sm font-medium text-foreground hover:bg-surface-hover transition-colors"
                  >
                    {tier.cta}
                  </Link>
                ) : 'comingSoon' in tier && tier.comingSoon ? (
                  <button
                    disabled
                    className="mb-6 w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-medium text-text-muted cursor-not-allowed opacity-60"
                  >
                    Coming Soon
                  </button>
                ) : (
                  <button
                    onClick={() => handleCheckout(tier.plan)}
                    className={`mb-6 w-full rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${tier.highlighted ? 'bg-blue-600 text-white hover:bg-blue-500' : 'bg-foreground text-background hover:opacity-90'}`}
                  >
                    {tier.cta}
                  </button>
                )}

                <ul className="space-y-3 flex-1">
                  {tier.features.map((feature) => (
                    <li key={feature.name} className="flex items-center gap-2.5 text-sm">
                      {feature.included ? <Check className="h-4 w-4 flex-shrink-0 text-green-500" /> : <X className="h-4 w-4 flex-shrink-0 text-text-muted" />}
                      <span className={feature.included ? 'text-text-secondary' : 'text-text-muted'}>{feature.name}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
