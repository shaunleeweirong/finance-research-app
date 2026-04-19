'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Check, X, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { UserMenu } from '@/components/auth/user-menu';
import { WaitlistForm } from '@/components/landing/waitlist-form';
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
      { name: 'DCF & EPS Valuation models', included: false },
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
      { name: 'DCF & EPS Valuation models', included: true },
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
    cta: 'Join Waitlist',
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

const FAQS = [
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. Cancel from your billing page in one click — no questions asked. You keep access until the end of your current billing period.',
  },
  {
    q: 'Do you offer refunds?',
    a: "If you're unhappy within your first 7 days, email us and we'll refund you in full, no questions asked.",
  },
  {
    q: "What's the difference between Free and Pro?",
    a: 'Free covers Overview, Key Metrics, News, Filings, and 5 years of financials. Pro unlocks 40-year financials, Estimates, Ownership, Revenue Segments, DCF/EPS valuation models, CSV export, and unlimited chart metrics.',
  },
  {
    q: 'Where does the data come from?',
    a: 'We source data from Financial Modeling Prep (FMP), the same provider used by hedge funds and research shops. Fundamentals update with SEC filings; quotes are real-time during market hours.',
  },
  {
    q: 'How current is the data?',
    a: 'Quotes update in real-time during market hours. Fundamentals (income statement, balance sheet, cash flow) update as companies file with the SEC — typically within hours of the filing.',
  },
  {
    q: 'Can I switch plans later?',
    a: 'Yes. Upgrade, downgrade, or cancel anytime from your billing page. Prorated billing means you only pay for what you use.',
  },
];

export default function PricingPage() {
  const [interval, setInterval] = useState<Interval>('monthly');
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

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
        alert(data.error || 'Failed to create checkout session. Please try again.');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      alert('Something went wrong. Please try again.');
    }
  }

  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:py-8">
      <div className="mx-auto max-w-6xl">
        {/* Nav */}
        <div className="flex items-center justify-between mb-10 sm:mb-16">
          <Link href="/" className="text-base sm:text-lg font-bold text-foreground">FinanceResearch</Link>
          {user ? <UserMenu /> : (
            <div className="flex items-center gap-2 sm:gap-3">
              <Link href="/sign-in" className="text-sm text-text-secondary hover:text-foreground transition-colors">Sign in</Link>
              <Link href="/sign-up" className="rounded-lg bg-blue-600 px-3 sm:px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-500 transition-colors">Sign up</Link>
            </div>
          )}
        </div>

        {/* Header */}
        <div className="text-center mb-10 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-3">Simple, transparent pricing</h1>
          <p className="text-base sm:text-lg text-text-secondary max-w-lg mx-auto">
            Choose the plan that fits your research needs. Upgrade or downgrade anytime.
          </p>

          {/* Billing toggle */}
          <div className="mt-7 sm:mt-8 inline-flex items-center rounded-lg bg-surface p-1">
            <button
              onClick={() => setInterval('monthly')}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${interval === 'monthly' ? 'bg-surface-hover text-foreground' : 'text-text-secondary hover:text-foreground'}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setInterval('annual')}
              className={`rounded-md px-3 sm:px-4 py-2 text-sm font-medium transition-colors flex items-center gap-1.5 ${interval === 'annual' ? 'bg-surface-hover text-foreground' : 'text-text-secondary hover:text-foreground'}`}
            >
              Annual
              <span className="rounded-full bg-green-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-green-500">
                2 months free
              </span>
            </button>
          </div>

          {/* Trust row */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-xs text-text-muted">
            <span className="inline-flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-green-500" /> Cancel anytime
            </span>
            <span className="inline-flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-green-500" /> 7-day money-back
            </span>
            <span className="inline-flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-green-500" /> Secure checkout by Stripe
            </span>
          </div>
        </div>

        {/* Pricing grid */}
        <div className="grid gap-5 sm:gap-6 md:grid-cols-3 max-w-5xl mx-auto">
          {TIERS.map((tier) => {
            const price = interval === 'monthly' ? tier.monthlyPrice : tier.annualPrice;
            const isPremium = 'comingSoon' in tier && tier.comingSoon;
            return (
              <div
                key={tier.name}
                className={`relative rounded-xl border p-5 sm:p-6 flex flex-col ${
                  tier.highlighted
                    ? 'border-blue-600 bg-surface shadow-lg shadow-blue-600/10'
                    : 'border-border bg-surface'
                }`}
              >
                {tier.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-3 py-0.5 text-xs font-semibold text-white whitespace-nowrap">
                    Most Popular
                  </div>
                )}
                {isPremium && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-surface-hover border border-border px-3 py-0.5 text-xs font-semibold text-text-secondary whitespace-nowrap">
                    Coming Soon
                  </div>
                )}
                <div className="mb-5 sm:mb-6">
                  <h3 className="text-lg font-semibold text-foreground">{tier.name}</h3>
                  <p className="mt-1 text-sm text-text-secondary">{tier.description}</p>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-foreground">${price}</span>
                    {price > 0 && <span className="text-sm text-text-secondary">/mo</span>}
                  </div>
                  {interval === 'annual' && price > 0 && (
                    <p className="mt-1 text-xs text-text-muted">
                      Billed annually (${price * 12}/yr · save ${(tier.monthlyPrice - tier.annualPrice) * 12})
                    </p>
                  )}
                  {price === 0 && (
                    <p className="mt-1 text-xs text-text-muted">Free forever · no card required</p>
                  )}
                </div>

                {tier.plan === 'free' ? (
                  <Link
                    href={user ? '/' : '/sign-up'}
                    className="mb-6 block rounded-lg border border-border bg-background px-4 py-2.5 text-center text-sm font-medium text-foreground hover:bg-surface-hover transition-colors"
                  >
                    {tier.cta}
                  </Link>
                ) : isPremium ? (
                  <WaitlistForm />
                ) : (
                  <>
                    <button
                      onClick={() => handleCheckout(tier.plan)}
                      className={`mb-1.5 w-full rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                        tier.highlighted
                          ? 'bg-blue-600 text-white hover:bg-blue-500'
                          : 'bg-foreground text-background hover:opacity-90'
                      }`}
                    >
                      {tier.cta}
                    </button>
                    <p className="mb-5 text-center text-[11px] text-text-muted">
                      Cancel anytime · 7-day refund
                    </p>
                  </>
                )}

                <ul className="space-y-2.5 sm:space-y-3 flex-1">
                  {tier.features.map((feature) => (
                    <li key={feature.name} className="flex items-start gap-2.5 text-sm">
                      {feature.included ? (
                        <Check className="h-4 w-4 shrink-0 text-green-500 mt-0.5" />
                      ) : (
                        <X className="h-4 w-4 shrink-0 text-text-muted mt-0.5" />
                      )}
                      <span className={feature.included ? 'text-text-secondary' : 'text-text-muted'}>
                        {feature.name}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* FAQ */}
        <section className="mt-20 sm:mt-24 max-w-3xl mx-auto">
          <div className="mb-8 sm:mb-10 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Pricing questions
            </h2>
            <p className="mt-2 text-sm text-text-secondary">Everything you need to know before you upgrade.</p>
          </div>
          <div className="space-y-3">
            {FAQS.map((item) => (
              <details
                key={item.q}
                className="group rounded-xl border border-border bg-surface px-5 py-4 open:bg-surface-hover transition-colors"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm sm:text-base font-medium text-foreground">
                  <span>{item.q}</span>
                  <span className="shrink-0 text-text-muted transition-transform group-open:rotate-45 text-xl leading-none">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm text-text-secondary leading-relaxed">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="mt-16 sm:mt-20 mb-8 text-center">
          <h2 className="mb-3 text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Your research terminal, on your terms.
          </h2>
          <p className="mb-6 text-sm sm:text-base text-text-secondary max-w-md mx-auto">
            Start free. Upgrade to Pro when you need the full terminal depth.
          </p>
          <Link
            href="/sign-up"
            className="inline-block w-full sm:w-auto rounded-lg bg-blue-600 px-8 py-3.5 text-sm font-semibold text-white hover:bg-blue-500 transition-colors shadow-lg shadow-blue-600/20"
          >
            Start free — no card required
          </Link>
        </section>
      </div>
    </main>
  );
}
