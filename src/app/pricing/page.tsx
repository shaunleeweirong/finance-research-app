'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Check, ShieldCheck, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { MarketingNav } from '@/components/marketing/marketing-nav';
import { MarketingFooter } from '@/components/marketing/marketing-footer';
import type { User } from '@supabase/supabase-js';

type Interval = 'monthly' | 'annual';

type Tier = {
  name: string;
  plan: 'free' | 'pro' | 'premium';
  monthlyPrice: number;
  annualPrice: number;
  description: string;
  cta: string;
  highlighted?: boolean;
  comingSoon?: boolean;
  badge?: string;
  note: string;
  features: { name: string; included: boolean }[];
};

const TIERS: Tier[] = [
  {
    name: 'Free',
    plan: 'free',
    monthlyPrice: 0,
    annualPrice: 0,
    description: 'Get started with essential research.',
    cta: 'Get started',
    note: 'Free forever · no card required',
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
    plan: 'pro',
    monthlyPrice: 20,
    annualPrice: 16,
    description: 'Advanced data for serious investors.',
    cta: 'Start Pro',
    highlighted: true,
    badge: '★ MOST POPULAR',
    note: 'Cancel anytime · 7-day refund',
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
    plan: 'premium',
    monthlyPrice: 35,
    annualPrice: 28,
    description: 'Full platform with AI features.',
    cta: 'Coming soon',
    comingSoon: true,
    badge: 'COMING SOON',
    note: 'Start with Free — upgrade at launch',
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
  const [interval, setBillingInterval] = useState<Interval>('monthly');
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  async function handleCheckout(plan: 'pro') {
    if (!user) {
      window.location.assign('/sign-up');
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
        window.location.assign(data.url);
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
    <div className="marketing-theme" style={{ minHeight: '100vh' }}>
      <MarketingNav isAuthenticated={!!user} />

      {/* Header band */}
      <section className="mk-grain" style={{ position: 'relative', overflow: 'hidden' }}>
        <div
          style={{
            maxWidth: 1100,
            margin: '0 auto',
            padding: '72px 28px 36px',
            textAlign: 'center',
          }}
        >
          <div className="mk-eyebrow" style={{ marginBottom: 14 }}>
            <span className="mk-dot" />
            PRICING
          </div>
          <h1
            className="mk-display"
            style={{
              fontSize: 'clamp(32px, 5.2vw, 64px)',
              fontWeight: 700,
              letterSpacing: '-0.035em',
              margin: 0,
              lineHeight: 1.02,
            }}
          >
            Simple, transparent{' '}
            <span style={{ color: 'var(--mk-accent)', fontStyle: 'italic', fontWeight: 600 }}>
              pricing.
            </span>
          </h1>
          <p
            style={{
              fontSize: 17,
              color: 'var(--mk-ink-soft)',
              marginTop: 14,
              lineHeight: 1.5,
              maxWidth: 560,
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            Choose the plan that fits your research. Upgrade or downgrade anytime.
          </p>

          {/* Billing toggle */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: 4,
              background: 'var(--mk-bg-warm)',
              borderRadius: 999,
              marginTop: 28,
              border: '1px solid var(--mk-line)',
            }}
          >
            <button
              type="button"
              onClick={() => setBillingInterval('monthly')}
              className="mk-grotesk"
              style={pillTab(interval === 'monthly')}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBillingInterval('annual')}
              className="mk-grotesk"
              style={{
                ...pillTab(interval === 'annual'),
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              Annual
              <span
                style={{
                  background: 'var(--mk-accent-soft)',
                  color: 'var(--mk-accent)',
                  padding: '2px 8px',
                  borderRadius: 999,
                  fontSize: 10,
                  fontFamily: 'var(--font-dm-mono), "DM Mono", monospace',
                  letterSpacing: 0.04,
                }}
              >
                2 MO FREE
              </span>
            </button>
          </div>

          {/* Trust row */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 16,
              justifyContent: 'center',
              marginTop: 16,
              fontFamily: 'var(--font-dm-mono), "DM Mono", monospace',
              fontSize: 11,
              color: 'var(--mk-ink-mute)',
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <ShieldCheck className="h-3.5 w-3.5" style={{ color: 'var(--mk-accent)' }} /> Cancel anytime
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <ShieldCheck className="h-3.5 w-3.5" style={{ color: 'var(--mk-accent)' }} /> 7-day money-back
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <ShieldCheck className="h-3.5 w-3.5" style={{ color: 'var(--mk-accent)' }} /> Stripe checkout
            </span>
          </div>
        </div>
      </section>

      {/* Pricing grid */}
      <section style={{ padding: '24px 0 72px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 28px' }}>
          <div
            className="mk-pricing-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 18,
              maxWidth: 1100,
              margin: '0 auto',
            }}
          >
            {TIERS.map((tier) => {
              const price = interval === 'monthly' ? tier.monthlyPrice : tier.annualPrice;
              const highlight = !!tier.highlighted;
              const savings = (tier.monthlyPrice - tier.annualPrice) * 12;
              return (
                <div
                  key={tier.name}
                  style={{
                    position: 'relative',
                    background: highlight ? 'var(--mk-ink)' : 'var(--mk-paper-warm)',
                    color: highlight ? 'var(--mk-bg)' : 'var(--mk-ink)',
                    border: '1px solid ' + (highlight ? 'var(--mk-ink)' : 'var(--mk-line)'),
                    borderRadius: 'var(--mk-radius-lg)',
                    padding: '28px 26px',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: highlight ? 'var(--mk-shadow-lg)' : 'none',
                  }}
                >
                  {tier.badge && (
                    <div
                      style={{
                        position: 'absolute',
                        top: -12,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: highlight ? 'var(--mk-accent)' : 'var(--mk-bg-warm)',
                        color: highlight ? '#fff' : 'var(--mk-ink-soft)',
                        border: highlight ? 'none' : '1px solid var(--mk-line)',
                        fontFamily: 'var(--font-dm-mono), "DM Mono", monospace',
                        fontSize: 10,
                        letterSpacing: 0.08,
                        padding: '4px 12px',
                        borderRadius: 999,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {tier.badge}
                    </div>
                  )}
                  <h3
                    className="mk-display"
                    style={{
                      fontSize: 22,
                      fontWeight: 700,
                      letterSpacing: '-0.02em',
                      margin: '0 0 6px',
                    }}
                  >
                    {tier.name}
                  </h3>
                  <p
                    style={{
                      fontSize: 14,
                      color: highlight ? 'rgba(239,238,235,0.7)' : 'var(--mk-ink-soft)',
                      margin: '0 0 22px',
                      lineHeight: 1.4,
                    }}
                  >
                    {tier.description}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
                    <span
                      className="mk-display mk-tabular"
                      style={{ fontSize: 48, fontWeight: 700, letterSpacing: '-0.035em' }}
                    >
                      ${price}
                    </span>
                    {price > 0 && (
                      <span
                        style={{
                          fontSize: 14,
                          color: highlight ? 'rgba(239,238,235,0.65)' : 'var(--mk-ink-soft)',
                        }}
                      >
                        /month
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-dm-mono), "DM Mono", monospace',
                      fontSize: 11,
                      color: highlight ? 'rgba(239,238,235,0.55)' : 'var(--mk-ink-mute)',
                      marginBottom: 22,
                      minHeight: 16,
                    }}
                  >
                    {price > 0 && interval === 'annual'
                      ? `Billed $${price * 12}/yr · save $${savings}`
                      : price === 0
                        ? 'No card required'
                        : 'Billed monthly'}
                  </div>

                  {tier.plan === 'free' ? (
                    <Link
                      href={user ? '/' : '/sign-up'}
                      className="mk-btn mk-btn-primary"
                      style={{ width: '100%', padding: '14px', fontSize: 14 }}
                    >
                      {tier.cta} <ArrowRight className="h-3.5 w-3.5" style={{ opacity: 0.7 }} />
                    </Link>
                  ) : tier.comingSoon ? (
                    <div
                      aria-disabled="true"
                      className="mk-btn mk-btn-secondary"
                      style={{ width: '100%', padding: '14px', fontSize: 14, cursor: 'default', opacity: 0.75 }}
                    >
                      Coming soon
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleCheckout('pro')}
                      className={highlight ? 'mk-btn mk-btn-accent' : 'mk-btn mk-btn-primary'}
                      style={{ width: '100%', padding: '14px', fontSize: 14 }}
                    >
                      {tier.cta} <ArrowRight className="h-3.5 w-3.5" style={{ opacity: 0.7 }} />
                    </button>
                  )}

                  <div
                    style={{
                      fontFamily: 'var(--font-dm-mono), "DM Mono", monospace',
                      fontSize: 10,
                      color: highlight ? 'rgba(239,238,235,0.55)' : 'var(--mk-ink-mute)',
                      textAlign: 'center',
                      marginTop: 8,
                      marginBottom: 22,
                    }}
                  >
                    {tier.note}
                  </div>
                  <div
                    style={{
                      height: 1,
                      background: highlight ? 'rgba(239,238,235,0.12)' : 'var(--mk-line)',
                      margin: '0 0 18px',
                    }}
                  />
                  <ul
                    style={{
                      listStyle: 'none',
                      padding: 0,
                      margin: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10,
                      flex: 1,
                    }}
                  >
                    {tier.features.map((feature) => (
                      <li
                        key={feature.name}
                        style={{
                          display: 'flex',
                          gap: 10,
                          alignItems: 'flex-start',
                          fontSize: 13.5,
                          lineHeight: 1.45,
                        }}
                      >
                        {feature.included ? (
                          <Check
                            className="h-3.5 w-3.5"
                            style={{
                              color: highlight ? 'var(--mk-accent-2)' : 'var(--mk-accent)',
                              marginTop: 3,
                              flexShrink: 0,
                            }}
                          />
                        ) : (
                          <X
                            className="h-3.5 w-3.5"
                            style={{
                              color: highlight ? 'rgba(239,238,235,0.3)' : 'var(--mk-ink-mute)',
                              marginTop: 3,
                              flexShrink: 0,
                            }}
                          />
                        )}
                        <span
                          style={{
                            color: feature.included
                              ? highlight
                                ? 'rgba(239,238,235,0.85)'
                                : 'var(--mk-ink-2)'
                              : highlight
                                ? 'rgba(239,238,235,0.45)'
                                : 'var(--mk-ink-mute)',
                          }}
                        >
                          {feature.name}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section
        style={{
          padding: '90px 0',
          borderTop: '1px solid var(--mk-line)',
          background: 'var(--mk-bg-warm)',
        }}
      >
        <div style={{ maxWidth: 820, margin: '0 auto', padding: '0 28px' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div className="mk-eyebrow" style={{ marginBottom: 14 }}>
              <span className="mk-dot" />
              FAQ
            </div>
            <h2
              className="mk-display"
              style={{
                fontSize: 'clamp(28px, 3.4vw, 40px)',
                fontWeight: 700,
                letterSpacing: '-0.03em',
                margin: 0,
              }}
            >
              Pricing questions.
            </h2>
          </div>
          <div>
            {FAQS.map((item, i) => (
              <details className="mk-faq" key={item.q} open={i === 0}>
                <summary>
                  <span>{item.q}</span>
                  <span className="mk-plus">+</span>
                </summary>
                <p className="mk-answer">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section style={{ padding: '90px 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 28px' }}>
          <div
            className="mk-grain"
            style={{
              background: 'var(--mk-ink)',
              color: 'var(--mk-bg)',
              borderRadius: 'var(--mk-radius-lg)',
              padding: '64px 40px',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background:
                  'radial-gradient(80% 60% at 50% 0%, rgba(31,83,64,0.45), transparent 60%)',
              }}
            />
            <div style={{ position: 'relative' }}>
              <h2
                className="mk-display"
                style={{
                  fontSize: 'clamp(28px, 4vw, 44px)',
                  fontWeight: 700,
                  letterSpacing: '-0.03em',
                  margin: '0 0 14px',
                  lineHeight: 1.1,
                }}
              >
                Your research terminal,{' '}
                <span style={{ color: 'var(--mk-accent-2)', fontStyle: 'italic', fontWeight: 600 }}>
                  on your terms.
                </span>
              </h2>
              <p
                style={{
                  fontSize: 16,
                  color: 'rgba(239,238,235,0.7)',
                  maxWidth: 480,
                  margin: '0 auto 24px',
                  lineHeight: 1.5,
                }}
              >
                Start free. Upgrade to Pro when you need the full terminal depth.
              </p>
              <Link
                href="/sign-up"
                className="mk-btn mk-btn-accent"
                style={{ padding: '15px 26px', fontSize: 14 }}
              >
                Start free — no card <ArrowRight className="h-3.5 w-3.5" style={{ opacity: 0.7 }} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}

function pillTab(active: boolean): React.CSSProperties {
  return {
    padding: '8px 16px',
    borderRadius: 999,
    border: 'none',
    background: active ? 'var(--mk-paper)' : 'transparent',
    color: active ? 'var(--mk-ink)' : 'var(--mk-ink-soft)',
    fontSize: 13,
    fontWeight: 600,
    boxShadow: active ? 'var(--mk-shadow-sm)' : 'none',
    cursor: 'pointer',
  };
}
