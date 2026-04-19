import { createClient } from '@/lib/supabase/server';
import { StickyCta } from '@/components/landing/sticky-cta';
import { MarketingPricingCards } from '@/components/marketing/pricing-cards';
import { HeroMockup } from '@/components/marketing/hero-mockup';
import { MarketingNav } from '@/components/marketing/marketing-nav';
import { MarketingFooter } from '@/components/marketing/marketing-footer';
import { AppNav } from '@/components/app/app-nav';
import { Dashboard } from '@/components/app/dashboard';
import { getUserPlan } from '@/lib/auth/get-user-plan';
import { getBatchQuotes } from '@/lib/fmp';
import type { FMPQuote } from '@/lib/fmp/types';
import Link from 'next/link';
import {
  ArrowRight,
  BarChart2,
  BarChart3,
  Calculator,
  Check,
  LineChart,
  Sparkles,
  Users,
} from 'lucide-react';

const INDEX_TICKERS = ['SPY', 'QQQ', 'DIA', 'IWM'];
const TRENDING_TICKERS = ['AAPL', 'NVDA', 'MSFT', 'META', 'TSLA', 'GOOGL'];

async function safeBatchQuotes(tickers: string[]): Promise<FMPQuote[]> {
  if (tickers.length === 0) return [];
  try {
    return await getBatchQuotes(tickers);
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const [plan, watchlistRows, indexQuotes, trendingQuotes] = await Promise.all([
      getUserPlan(user.id),
      supabase
        .from('watchlist')
        .select('ticker, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(6),
      safeBatchQuotes(INDEX_TICKERS),
      safeBatchQuotes(TRENDING_TICKERS),
    ]);

    const watchlistTickers = (watchlistRows.data ?? []).map((r) => r.ticker);
    const watchlistQuotes = await safeBatchQuotes(watchlistTickers);
    // Preserve the user's watchlist order (most recent first)
    const orderedWatchlist = watchlistTickers
      .map((t) => watchlistQuotes.find((q) => q.symbol === t))
      .filter((q): q is FMPQuote => Boolean(q));

    return (
      <>
        <AppNav />
        <Dashboard
          userEmail={user.email}
          userName={user.user_metadata?.full_name ?? null}
          plan={plan}
          watchlistQuotes={orderedWatchlist}
          indexQuotes={indexQuotes}
          trendingQuotes={trendingQuotes}
        />
      </>
    );
  }

  return (
    <div className="marketing-theme" style={{ minHeight: '100vh' }}>
      <MarketingNav isAuthenticated={false} />
      <main>
        <Hero />
        <TrustBar />
        <Features />
        <ProductTour />
        <Pricing isAuthenticated={false} />
        <FAQ />
        <FinalCTA />
      </main>
      <MarketingFooter />
      <StickyCta />
    </div>
  );
}

function Hero() {
  return (
    <section className="mk-grain" style={{ position: 'relative', overflow: 'hidden' }}>
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '72px 28px 60px',
          position: 'relative',
        }}
      >
        <div
          className="mk-hero-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: '1.05fr 1fr',
            gap: 64,
            alignItems: 'center',
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div className="mk-pill mk-pill-accent" style={{ marginBottom: 22 }}>
              <span className="mk-dot" /> NEW · AI stock briefs
            </div>
            <h1
              className="mk-display mk-hero-h1"
              style={{
                fontSize: 'clamp(32px, 5.6vw, 72px)',
                lineHeight: 1.02,
                letterSpacing: '-0.035em',
                margin: '0 0 22px',
                fontWeight: 700,
              }}
            >
              The research terminal for{' '}
              <span
                style={{
                  color: 'var(--mk-accent)',
                  fontStyle: 'italic',
                  fontWeight: 600,
                }}
              >
                retail investors.
              </span>
            </h1>
            <p
              style={{
                fontSize: 18,
                lineHeight: 1.55,
                color: 'var(--mk-ink-soft)',
                maxWidth: 560,
                margin: '0 0 32px',
              }}
            >
              Everything a serious investor needs to analyze a stock — without the Bloomberg bill or the
              enterprise demo call. Institutional-grade data. Retail-grade pricing.
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
              <Link
                href="/sign-up"
                className="mk-btn mk-btn-primary"
                style={{ padding: '15px 22px', fontSize: 15 }}
              >
                Start researching — free <ArrowRight className="h-3.5 w-3.5" style={{ opacity: 0.7 }} />
              </Link>
              <Link
                href="#pricing"
                className="mk-btn mk-btn-secondary"
                style={{ padding: '15px 22px', fontSize: 15 }}
              >
                See pricing
              </Link>
            </div>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 18,
                fontFamily: 'var(--font-dm-mono), "DM Mono", monospace',
                fontSize: 11,
                color: 'var(--mk-ink-mute)',
              }}
            >
              <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                <Check className="h-3 w-3" style={{ color: 'var(--mk-accent)' }} /> No card required
              </span>
              <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                <Check className="h-3 w-3" style={{ color: 'var(--mk-accent)' }} /> Free forever plan
              </span>
              <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                <Check className="h-3 w-3" style={{ color: 'var(--mk-accent)' }} /> Cancel anytime
              </span>
            </div>
          </div>

          <div style={{ position: 'relative' }}>
            <div
              style={{
                position: 'absolute',
                inset: '-40px',
                background:
                  'radial-gradient(60% 60% at 60% 40%, rgba(31,83,64,0.18), transparent 70%)',
                filter: 'blur(20px)',
                zIndex: 0,
              }}
            />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <HeroMockup />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustBar() {
  const stats = [
    { v: '60,000+', l: 'Global tickers' },
    { v: '40 years', l: 'Historical data' },
    { v: '100+', l: 'Financial metrics' },
    { v: 'Real-time', l: 'Market quotes' },
  ];
  return (
    <section
      style={{
        borderTop: '1px solid var(--mk-line)',
        borderBottom: '1px solid var(--mk-line)',
        background: 'var(--mk-bg-warm)',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: 28 }}>
        <div
          className="mk-trust-grid"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}
        >
          {stats.map((s, i) => (
            <div
              key={s.l}
              style={{
                textAlign: 'center',
                borderLeft: i ? '1px solid var(--mk-line)' : 'none',
                padding: '6px 12px',
              }}
            >
              <div
                className="mk-display mk-tabular"
                style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.025em' }}
              >
                {s.v}
              </div>
              <div className="mk-eyebrow" style={{ marginTop: 4 }}>
                {s.l}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Features() {
  const features = [
    {
      icon: Sparkles,
      t: 'AI Stock Briefs',
      d: 'Instant AI-generated company summaries with key highlights, recent catalysts, and risks — in plain English.',
      tag: 'NEW',
    },
    {
      icon: BarChart3,
      t: '40-Year Financials',
      d: 'Income statements, balance sheets, cash flow, and ratios spanning four decades. Source: SEC filings.',
    },
    {
      icon: LineChart,
      t: 'Interactive Charts',
      d: 'Visualize any metric with multi-series charts, custom ranges, and side-by-side comparison.',
    },
    {
      icon: BarChart2,
      t: 'Analyst Estimates',
      d: 'Forward revenue, EPS, and EBITDA consensus with price targets, surprises, and revisions.',
    },
    {
      icon: Users,
      t: 'Ownership Data',
      d: 'Institutional holders, insider trading activity, and ownership trend lines updated weekly.',
    },
    {
      icon: Calculator,
      t: 'Valuation Models',
      d: 'Built-in DCF and EPS calculators. Tweak assumptions, see fair value live.',
    },
  ];
  return (
    <section id="features" style={{ padding: '100px 0' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 28px' }}>
        <div style={{ maxWidth: 680, marginBottom: 60 }}>
          <div className="mk-eyebrow" style={{ marginBottom: 14 }}>
            <span className="mk-dot" />
            FEATURES
          </div>
          <h2
            className="mk-display"
            style={{
              fontSize: 'clamp(32px, 4vw, 48px)',
              fontWeight: 700,
              letterSpacing: '-0.03em',
              margin: 0,
              lineHeight: 1.05,
            }}
          >
            A terminal, without the terminal.
          </h2>
          <p
            style={{
              fontSize: 17,
              color: 'var(--mk-ink-soft)',
              marginTop: 14,
              lineHeight: 1.5,
            }}
          >
            The depth institutions pay thousands for — packaged for self-directed investors.
          </p>
        </div>
        <div
          className="mk-features-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 1,
            background: 'var(--mk-line)',
            border: '1px solid var(--mk-line)',
            borderRadius: 'var(--mk-radius-lg)',
            overflow: 'hidden',
          }}
        >
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.t}
                style={{ background: 'var(--mk-bg)', padding: 28, position: 'relative' }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 22,
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: 'var(--mk-accent-soft)',
                      color: 'var(--mk-accent)',
                      display: 'grid',
                      placeItems: 'center',
                    }}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  {f.tag && (
                    <span className="mk-pill mk-pill-accent" style={{ fontSize: 9 }}>
                      {f.tag}
                    </span>
                  )}
                </div>
                <h3
                  className="mk-display"
                  style={{
                    fontSize: 19,
                    fontWeight: 700,
                    letterSpacing: '-0.015em',
                    margin: '0 0 8px',
                  }}
                >
                  {f.t}
                </h3>
                <p
                  style={{
                    fontSize: 14.5,
                    color: 'var(--mk-ink-soft)',
                    lineHeight: 1.5,
                    margin: 0,
                  }}
                >
                  {f.d}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function ProductTour() {
  const strips = [
    {
      tag: 'AI Briefs',
      title: 'AI that actually reads filings.',
      desc: 'Bull case, bear case, key developments — grounded in the 10-K, not Reddit. Cited sources, generated in seconds.',
      image: '/screenshots/tour-ai-brief.png',
      alt: 'Moatscape AI brief showing bull case, bear case, key developments and cited sources for Apple',
    },
    {
      tag: 'Financials',
      title: 'Forty years of data, one interface.',
      desc: 'Income, balance sheet, cash flow, ratios. Chart any metric, toggle between 10Y / 20Y / 40Y, export any row.',
      image: '/screenshots/tour-financials.png',
      alt: 'Moatscape financials tab with a multi-metric chart and ten years of income statement data for Apple',
    },
    {
      tag: 'Valuation',
      title: 'Valuation, in the room.',
      desc: 'DCF and EPS models with draggable assumptions. Flip growth and discount rates, watch fair value move live.',
      image: '/screenshots/tour-dcf.png',
      alt: 'Moatscape DCF valuation model with assumption sliders and a five-year free cash flow projection chart',
    },
  ];
  return (
    <section
      id="tour"
      style={{
        padding: '100px 0',
        borderTop: '1px solid var(--mk-line)',
        background: 'var(--mk-bg-warm)',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 28px' }}>
        <div style={{ textAlign: 'center', maxWidth: 720, margin: '0 auto 72px' }}>
          <div className="mk-eyebrow" style={{ marginBottom: 14 }}>
            <span className="mk-dot" />
            THE PRODUCT
          </div>
          <h2
            className="mk-display"
            style={{
              fontSize: 'clamp(32px, 4vw, 48px)',
              fontWeight: 700,
              letterSpacing: '-0.03em',
              margin: 0,
              lineHeight: 1.05,
            }}
          >
            Built to make you{' '}
            <span
              style={{
                color: 'var(--mk-accent)',
                fontStyle: 'italic',
                fontWeight: 600,
              }}
            >
              a better researcher.
            </span>
          </h2>
          <p
            style={{
              fontSize: 17,
              color: 'var(--mk-ink-soft)',
              marginTop: 14,
              lineHeight: 1.5,
            }}
          >
            Three tools doing the heavy lifting. No context switching, no export chains.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 96 }}>
          {strips.map((s, i) => (
            <TourStrip key={s.tag} strip={s} flip={i % 2 === 1} />
          ))}
        </div>
      </div>
    </section>
  );
}

type Strip = {
  tag: string;
  title: string;
  desc: string;
  image: string;
  alt: string;
};

function TourStrip({ strip, flip }: { strip: Strip; flip: boolean }) {
  const copy = (
    <div style={{ minWidth: 0 }}>
      <span
        className="mk-pill mk-pill-accent"
        style={{ marginBottom: 18, fontSize: 10 }}
      >
        <span className="mk-dot" /> {strip.tag.toUpperCase()}
      </span>
      <h3
        className="mk-display"
        style={{
          fontSize: 'clamp(26px, 3vw, 36px)',
          fontWeight: 700,
          letterSpacing: '-0.025em',
          margin: '0 0 14px',
          lineHeight: 1.1,
        }}
      >
        {strip.title.split('.')[0]}
        {strip.title.includes('.') && (
          <span style={{ color: 'var(--mk-accent)', fontStyle: 'italic', fontWeight: 600 }}>.</span>
        )}
      </h3>
      <p
        style={{
          fontSize: 17,
          color: 'var(--mk-ink-soft)',
          lineHeight: 1.55,
          margin: 0,
          maxWidth: 440,
        }}
      >
        {strip.desc}
      </p>
    </div>
  );

  const image = (
    <div style={{ position: 'relative', minWidth: 0 }}>
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: '-30px',
          background:
            'radial-gradient(60% 60% at 60% 40%, rgba(31,83,64,0.16), transparent 70%)',
          filter: 'blur(20px)',
          zIndex: 0,
        }}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={strip.image}
        alt={strip.alt}
        loading="lazy"
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          height: 'auto',
          display: 'block',
          borderRadius: 18,
          border: '1px solid var(--mk-line)',
          boxShadow: 'var(--mk-shadow-lg)',
          background: 'var(--mk-paper)',
        }}
      />
    </div>
  );

  return (
    <div
      className="mk-hero-grid"
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1.2fr',
        gap: 64,
        alignItems: 'center',
      }}
    >
      {flip ? (
        <>
          {image}
          {copy}
        </>
      ) : (
        <>
          {copy}
          {image}
        </>
      )}
    </div>
  );
}
function Pricing({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <section id="pricing" style={{ padding: '100px 0', borderTop: '1px solid var(--mk-line)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 28px' }}>
        <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto 36px' }}>
          <div className="mk-eyebrow" style={{ marginBottom: 14 }}>
            <span className="mk-dot" />
            PRICING
          </div>
          <h2
            className="mk-display"
            style={{
              fontSize: 'clamp(32px, 4vw, 48px)',
              fontWeight: 700,
              letterSpacing: '-0.03em',
              margin: 0,
              lineHeight: 1.05,
            }}
          >
            Retail-grade pricing.
          </h2>
          <p
            style={{
              fontSize: 17,
              color: 'var(--mk-ink-soft)',
              marginTop: 14,
              lineHeight: 1.5,
            }}
          >
            Choose the plan that fits your research. Upgrade or downgrade anytime.
          </p>
        </div>
        <MarketingPricingCards isAuthenticated={isAuthenticated} />
      </div>
    </section>
  );
}

function FAQ() {
  const items = [
    {
      q: 'Where does the data come from?',
      a: 'We source data from Financial Modeling Prep (FMP), the same provider used by hedge funds and research desks. Fundamentals update with SEC filings; quotes are real-time during market hours.',
    },
    {
      q: 'Is there really a free plan?',
      a: 'Yes — the Free plan is permanent. It includes price charts, key metrics, 5 years of financials, news & filings, and a 2-metric chart panel. No credit card required to sign up.',
    },
    {
      q: 'Can I cancel anytime?',
      a: 'Absolutely. Cancel from your billing page in one click. You keep access until the end of your billing period — no questions asked.',
    },
    {
      q: 'How many tickers are covered?',
      a: 'Over 60,000 global tickers including the US, Canada, UK, and major European exchanges, plus ADRs and most major ETFs.',
    },
    {
      q: 'How is this different from Yahoo Finance or Google Finance?',
      a: 'Free sites cover the surface. Moatscape gives you 40-year history (vs. ~5), analyst estimates, ownership data, DCF/EPS models, AI briefs, and an interface built for actual research — not ads.',
    },
  ];
  return (
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
            Frequently asked questions.
          </h2>
        </div>
        <div>
          {items.map((it, i) => (
            <details className="mk-faq" key={it.q} open={i === 0}>
              <summary>
                <span>{it.q}</span>
                <span className="mk-plus">+</span>
              </summary>
              <p className="mk-answer">{it.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
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
            <div className="mk-eyebrow" style={{ color: 'rgba(239,238,235,0.6)', marginBottom: 18 }}>
              <span className="mk-dot" style={{ background: 'var(--mk-accent-2)' }} />
              GET STARTED
            </div>
            <h2
              className="mk-display"
              style={{
                fontSize: 'clamp(34px, 4.4vw, 56px)',
                fontWeight: 700,
                letterSpacing: '-0.03em',
                margin: '0 0 16px',
                lineHeight: 1.05,
              }}
            >
              Get your research terminal.
              <br />
              <span
                style={{
                  color: 'var(--mk-accent-2)',
                  fontStyle: 'italic',
                  fontWeight: 600,
                }}
              >
                Free to start.
              </span>
            </h2>
            <p
              style={{
                fontSize: 17,
                color: 'rgba(239,238,235,0.7)',
                maxWidth: 520,
                margin: '0 auto 28px',
                lineHeight: 1.5,
              }}
            >
              Built for retail investors. No credit card, no sales call, no enterprise contract.
            </p>
            <Link
              href="/sign-up"
              className="mk-btn mk-btn-accent"
              style={{ padding: '16px 28px', fontSize: 15 }}
            >
              Get my free account <ArrowRight className="h-3.5 w-3.5" style={{ opacity: 0.7 }} />
            </Link>
            <div
              style={{
                marginTop: 14,
                fontFamily: 'var(--font-dm-mono), "DM Mono", monospace',
                fontSize: 11,
                color: 'rgba(239,238,235,0.5)',
              }}
            >
              Takes under 30 seconds
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

