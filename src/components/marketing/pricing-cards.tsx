'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Check, ShieldCheck } from 'lucide-react';

type Interval = 'monthly' | 'annual';

type Tier = {
  name: string;
  plan: 'free' | 'pro' | 'premium';
  monthly: number;
  annual: number;
  desc: string;
  cta: string;
  highlight?: boolean;
  soon?: boolean;
  badge?: string;
  features: string[];
  note: string;
};

const TIERS: Tier[] = [
  {
    name: 'Free',
    plan: 'free',
    monthly: 0,
    annual: 0,
    desc: 'Get started with essential research.',
    cta: 'Get started',
    features: [
      'Overview & key metrics',
      'Price chart (all ranges)',
      '5 years of financials',
      'News & SEC filings',
      '2-metric chart panel',
      'Watchlist (basic)',
    ],
    note: 'Free forever · no card required',
  },
  {
    name: 'Pro',
    plan: 'pro',
    monthly: 20,
    annual: 16,
    desc: 'Advanced data for serious investors.',
    cta: 'Start Pro',
    highlight: true,
    badge: '★ MOST POPULAR',
    features: [
      'Everything in Free',
      '40 years of financials',
      'Unlimited chart metrics',
      'Revenue segments',
      'Estimates & ownership',
      'DCF & EPS models',
      'CSV export',
    ],
    note: 'Cancel anytime · 7-day refund',
  },
  {
    name: 'Premium',
    plan: 'premium',
    monthly: 35,
    annual: 28,
    desc: 'Full platform with AI features.',
    cta: 'Coming soon',
    soon: true,
    badge: 'COMING SOON',
    features: [
      'Everything in Pro',
      'AI Copilot (200 q/mo)',
      'Peer comparison',
      'Priority support',
    ],
    note: 'Start with Free — upgrade at launch',
  },
];

type Props = {
  isAuthenticated: boolean;
};

export function MarketingPricingCards({ isAuthenticated }: Props) {
  const [interval, setInterval] = useState<Interval>('monthly');

  async function handleCheckout(plan: 'pro' | 'premium') {
    if (!isAuthenticated) {
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
    <>
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: 4,
            background: 'var(--mk-bg-warm)',
            borderRadius: 999,
            marginTop: 24,
            border: '1px solid var(--mk-line)',
          }}
        >
          <button
            type="button"
            onClick={() => setInterval('monthly')}
            className="mk-grotesk"
            style={pillTab(interval === 'monthly')}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setInterval('annual')}
            className="mk-grotesk"
            style={{ ...pillTab(interval === 'annual'), display: 'inline-flex', alignItems: 'center', gap: 8 }}
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

      <div
        className="mk-pricing-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 24,
          maxWidth: 1144,
          margin: '64px auto 0',
        }}
      >
        {TIERS.map((t) => {
          const price = interval === 'monthly' ? t.monthly : t.annual;
          const highlight = !!t.highlight;
          return (
            <div
              key={t.name}
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
              {t.badge && (
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
                  {t.badge}
                </div>
              )}
              <h3
                className="mk-display"
                style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 6px' }}
              >
                {t.name}
              </h3>
              <p
                style={{
                  fontSize: 14,
                  color: highlight ? 'rgba(239,238,235,0.7)' : 'var(--mk-ink-soft)',
                  margin: '0 0 22px',
                  lineHeight: 1.4,
                }}
              >
                {t.desc}
              </p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
                <span
                  className="mk-display mk-tabular"
                  style={{ fontSize: 48, fontWeight: 700, letterSpacing: '-0.035em' }}
                >
                  ${price}
                </span>
                {price > 0 && (
                  <span style={{ fontSize: 14, color: highlight ? 'rgba(239,238,235,0.65)' : 'var(--mk-ink-soft)' }}>
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
                  ? `Billed $${price * 12}/yr · save $${(t.monthly - t.annual) * 12}`
                  : price === 0
                    ? 'No card required'
                    : 'Billed monthly'}
              </div>

              {t.plan === 'free' ? (
                <Link
                  href={isAuthenticated ? '/' : '/sign-up'}
                  className="mk-btn mk-btn-primary"
                  style={{ width: '100%', padding: '14px', fontSize: 14 }}
                >
                  {t.cta} <ArrowRight className="h-3.5 w-3.5" style={{ opacity: 0.7 }} />
                </Link>
              ) : t.soon ? (
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
                  onClick={() => handleCheckout(t.plan as 'pro')}
                  className={highlight ? 'mk-btn mk-btn-accent' : 'mk-btn mk-btn-primary'}
                  style={{ width: '100%', padding: '14px', fontSize: 14 }}
                >
                  {t.cta} <ArrowRight className="h-3.5 w-3.5" style={{ opacity: 0.7 }} />
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
                {t.note}
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
                  gap: 12,
                  flex: 1,
                }}
              >
                {t.features.map((f) => (
                  <li
                    key={f}
                    style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 14, lineHeight: 1.45 }}
                  >
                    <Check
                      className="h-3.5 w-3.5"
                      style={{
                        color: highlight ? 'var(--mk-accent-2)' : 'var(--mk-accent)',
                        marginTop: 3,
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ color: highlight ? 'rgba(239,238,235,0.85)' : 'var(--mk-ink-2)' }}>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </>
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
