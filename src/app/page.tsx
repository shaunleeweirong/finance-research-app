import { createClient } from '@/lib/supabase/server';
import { SearchBar } from '@/components/search/search-bar';
import { UserMenu } from '@/components/auth/user-menu';
import { StickyCta } from '@/components/landing/sticky-cta';
import Link from 'next/link';
import {
  BarChart3,
  LineChart,
  Zap,
  Users,
  Calculator,
  Check,
  TrendingUp,
  Sparkles,
} from 'lucide-react';

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Signed-in users see the search experience
  if (user) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-4">
        <div className="absolute top-4 right-6">
          <UserMenu />
        </div>
        <div className="w-full max-w-2xl space-y-8 text-center">
          <div className="space-y-3">
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              FinanceResearch
            </h1>
            <p className="text-lg text-text-secondary">
              Your research terminal — ready to search any public company.
            </p>
          </div>
          <SearchBar size="large" />
        </div>
      </main>
    );
  }

  // Visitors see the landing page
  return (
    <main className="min-h-screen bg-background pb-20 sm:pb-0">
      {/* Nav */}
      <nav className="sticky top-0 z-30 border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 max-w-6xl mx-auto">
          <span className="text-base sm:text-lg font-bold text-foreground shrink-0">FinanceResearch</span>
          <div className="flex items-center gap-2 sm:gap-3 whitespace-nowrap">
            <Link href="/pricing" className="hidden sm:inline text-sm text-text-secondary hover:text-foreground transition-colors py-2">
              Pricing
            </Link>
            <Link href="/sign-in" className="rounded-md px-3 py-2 text-sm text-text-secondary hover:text-foreground transition-colors">
              Sign in
            </Link>
            <Link href="/sign-up" className="rounded-lg bg-blue-600 px-3 sm:px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 transition-colors">
              Sign up
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden px-4 pt-12 sm:pt-20 pb-12 sm:pb-16">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-blue-600/5 via-transparent to-transparent" />
        <div className="mx-auto max-w-6xl grid gap-10 lg:grid-cols-[1.05fr_1fr] lg:items-center">
          <div className="text-center lg:text-left space-y-5 sm:space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/5 px-3 py-1 text-xs font-medium text-blue-400">
              <Sparkles className="h-3 w-3" />
              <span>Now with AI stock briefs</span>
            </div>
            <h1 className="text-[2rem] leading-[1.1] font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              The research terminal for
              <br className="hidden sm:block" />{' '}
              <span className="text-blue-500">retail investors.</span>
            </h1>
            <p className="mx-auto lg:mx-0 max-w-xl text-base sm:text-lg text-text-secondary">
              Everything a serious investor needs to analyze a stock — without the Bloomberg bill
              or the enterprise demo call. Institutional-grade data. Retail-grade pricing.
            </p>
            <div className="flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-3 pt-1">
              <Link
                href="/sign-up"
                className="w-full sm:w-auto rounded-lg bg-blue-600 px-6 py-3.5 text-center text-sm font-semibold text-white hover:bg-blue-500 transition-colors shadow-lg shadow-blue-600/20"
              >
                Start researching — free
              </Link>
              <Link
                href="/pricing"
                className="w-full sm:w-auto rounded-lg border border-border px-6 py-3.5 text-center text-sm font-medium text-foreground hover:bg-surface transition-colors"
              >
                View pricing
              </Link>
            </div>
            <p className="text-xs text-text-muted">
              ✓ No credit card required &nbsp;·&nbsp; ✓ Free forever plan &nbsp;·&nbsp; ✓ Cancel anytime
            </p>
          </div>

          {/* Product mockup */}
          <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
            <div className="absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-br from-blue-600/20 via-blue-500/5 to-transparent blur-2xl" />
            <ProductMockup />
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="border-y border-border/60 bg-surface/30 px-4 py-5 sm:py-6">
        <div className="mx-auto max-w-6xl grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
          {[
            { value: '60,000+', label: 'Global tickers' },
            { value: '40 years', label: 'Historical data' },
            { value: '100+', label: 'Financial metrics' },
            { value: 'Real-time', label: 'Market quotes' },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-lg sm:text-2xl font-bold text-foreground">{s.value}</div>
              <div className="text-xs sm:text-sm text-text-muted">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="px-4 py-14 sm:py-20 max-w-6xl mx-auto">
        <div className="mb-10 sm:mb-14 text-center max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-foreground">
            A terminal, without the terminal.
          </h2>
          <p className="mt-3 text-sm sm:text-base text-text-secondary">
            The depth institutions pay thousands for — packaged for self-directed investors.
          </p>
        </div>
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: BarChart3,
              title: '40-Year Financials',
              desc: 'Income statements, balance sheets, cash flow, and ratios spanning decades.',
            },
            {
              icon: Zap,
              title: 'Analyst Estimates',
              desc: 'Revenue, EPS, and EBITDA consensus forecasts with price targets.',
            },
            {
              icon: Users,
              title: 'Ownership Data',
              desc: 'Institutional holders, insider trading activity, and ownership trends.',
            },
            {
              icon: LineChart,
              title: 'Interactive Charts',
              desc: 'Visualize any metric with multi-series charts and flexible time ranges.',
            },
            {
              icon: Calculator,
              title: 'Valuation Models',
              desc: 'Built-in DCF and EPS valuation calculators with editable assumptions.',
            },
            {
              icon: Sparkles,
              title: 'AI Stock Briefs',
              desc: 'Instant AI-generated company summaries with key highlights and risks.',
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border border-border bg-surface p-5 sm:p-6 hover:border-blue-500/40 transition-colors"
            >
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                <feature.icon className="h-5 w-5 text-blue-500" />
              </div>
              <h3 className="mb-1.5 font-semibold text-foreground">{feature.title}</h3>
              <p className="text-sm text-text-secondary leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison */}
      <section className="px-4 py-14 sm:py-20 bg-surface/30 border-y border-border/60">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 sm:mb-12 text-center max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-foreground">
              Deeper than Yahoo. Cheaper than Bloomberg.
            </h2>
            <p className="mt-3 text-sm sm:text-base text-text-secondary">
              A research terminal built for retail investors — not institutional budgets.
            </p>
          </div>
          <div className="overflow-x-auto -mx-4 px-4">
            <table className="w-full min-w-[520px] border-separate border-spacing-0 text-sm">
              <thead>
                <tr>
                  <th className="sticky left-0 bg-background text-left py-3 pr-4 font-medium text-text-muted" />
                  <th className="py-3 px-3 sm:px-4 text-center">
                    <div className="font-semibold text-blue-500">FinanceResearch</div>
                    <div className="text-xs font-normal text-text-muted">From $0/mo</div>
                  </th>
                  <th className="py-3 px-3 sm:px-4 text-center">
                    <div className="font-semibold text-foreground">Bloomberg</div>
                    <div className="text-xs font-normal text-text-muted">~$2,000/mo</div>
                  </th>
                  <th className="py-3 px-3 sm:px-4 text-center">
                    <div className="font-semibold text-foreground">Free sites</div>
                    <div className="text-xs font-normal text-text-muted">$0/mo</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['40-year financials', true, true, false],
                  ['Interactive charting', true, true, false],
                  ['Analyst estimates', true, true, false],
                  ['Ownership & insider data', true, true, false],
                  ['AI stock briefs', true, false, false],
                  ['DCF valuation models', true, true, false],
                  ['Built for retail', true, false, true],
                ].map(([label, a, b, c], i) => (
                  <tr key={String(label)} className={i % 2 === 0 ? 'bg-background/40' : ''}>
                    <td className="py-2.5 pr-4 pl-3 text-text-secondary">{label as string}</td>
                    <td className="py-2.5 px-3 sm:px-4 text-center">
                      <Cell on={a as boolean} accent />
                    </td>
                    <td className="py-2.5 px-3 sm:px-4 text-center">
                      <Cell on={b as boolean} />
                    </td>
                    <td className="py-2.5 px-3 sm:px-4 text-center">
                      <Cell on={c as boolean} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 py-14 sm:py-20 max-w-3xl mx-auto">
        <div className="mb-8 sm:mb-10 text-center">
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-foreground">
            Frequently asked questions
          </h2>
        </div>
        <div className="space-y-3">
          {[
            {
              q: 'Where does the data come from?',
              a: 'We source data from Financial Modeling Prep (FMP), the same provider used by hedge funds and research shops. Fundamentals update with SEC filings; quotes are real-time during market hours.',
            },
            {
              q: 'Is there a free plan?',
              a: 'Yes — our Free plan is permanent and includes price charts, key metrics, 5 years of financials, and a 2-metric chart panel. No credit card required to sign up.',
            },
            {
              q: 'Can I cancel anytime?',
              a: 'Absolutely. Cancel from your billing page in one click, no questions asked. You keep access until the end of your billing period.',
            },
            {
              q: 'What tickers are covered?',
              a: '60,000+ global tickers including US, Canadian, UK, and major European exchanges, plus ADRs and most major ETFs.',
            },
            {
              q: 'How is this different from Yahoo Finance or Google Finance?',
              a: 'Free sites cover the surface. We offer deeper history (40 years vs. ~5), analyst estimates, ownership data, DCF models, AI briefs, and an interface built for actual research — not ads.',
            },
          ].map((item) => (
            <details
              key={item.q}
              className="group rounded-xl border border-border bg-surface px-5 py-4 open:bg-surface-hover transition-colors"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm sm:text-base font-medium text-foreground">
                <span>{item.q}</span>
                <span className="shrink-0 text-text-muted transition-transform group-open:rotate-45 text-xl leading-none">+</span>
              </summary>
              <p className="mt-3 text-sm text-text-secondary leading-relaxed">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-gradient-to-br from-blue-600/10 via-surface to-surface p-8 sm:p-12 text-center">
          <h2 className="mb-3 text-2xl sm:text-4xl font-bold tracking-tight text-foreground">
            Get your research terminal.
            <br className="hidden sm:block" /> Free to start.
          </h2>
          <p className="mb-8 text-sm sm:text-base text-text-secondary">
            Built for retail investors. No credit card, no sales call, no enterprise contract.
          </p>
          <Link
            href="/sign-up"
            className="inline-block w-full sm:w-auto rounded-lg bg-blue-600 px-8 py-3.5 text-sm font-semibold text-white hover:bg-blue-500 transition-colors shadow-lg shadow-blue-600/20"
          >
            Get my free account
          </Link>
          <p className="mt-4 text-xs text-text-muted">Takes under 30 seconds</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60 px-4 py-8">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-text-muted">
          <span>© {new Date().getFullYear()} FinanceResearch · Data by Financial Modeling Prep</span>
          <div className="flex items-center gap-4">
            <Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
            <Link href="/sign-in" className="hover:text-foreground transition-colors">Sign in</Link>
            <Link href="/sign-up" className="hover:text-foreground transition-colors">Sign up</Link>
          </div>
        </div>
      </footer>

      <StickyCta />
    </main>
  );
}

function Cell({ on, accent = false }: { on: boolean; accent?: boolean }) {
  if (on) {
    return (
      <Check
        className={`mx-auto h-4 w-4 ${accent ? 'text-blue-500' : 'text-green-500'}`}
      />
    );
  }
  return <span className="text-text-muted">—</span>;
}

function ProductMockup() {
  return (
    <div className="rounded-xl border border-border bg-surface shadow-2xl shadow-blue-600/10 overflow-hidden">
      {/* mock browser chrome */}
      <div className="flex items-center gap-1.5 border-b border-border bg-background/60 px-3 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
        <span className="ml-3 text-[10px] text-text-muted truncate">financeresearch.app/stock/AAPL</span>
      </div>

      {/* Header row */}
      <div className="p-4 sm:p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-md bg-blue-500/20 flex items-center justify-center text-xs font-bold text-blue-400">A</div>
              <div className="min-w-0">
                <div className="font-semibold text-foreground text-sm truncate">Apple Inc.</div>
                <div className="text-[10px] text-text-muted truncate">AAPL · NASDAQ</div>
              </div>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-lg font-bold text-foreground tabular-nums">$228.52</div>
            <div className="flex items-center justify-end gap-1 text-xs font-medium text-green-500 tabular-nums">
              <TrendingUp className="h-3 w-3" />
              +1.84 (+0.81%)
            </div>
          </div>
        </div>

        {/* Chart area */}
        <div className="relative h-24 sm:h-28 rounded-lg bg-background/60 overflow-hidden">
          <svg
            viewBox="0 0 300 100"
            preserveAspectRatio="none"
            className="absolute inset-0 h-full w-full"
          >
            <defs>
              <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d="M0,75 C20,70 35,55 55,50 C80,44 95,60 115,52 C140,42 160,30 185,35 C210,40 225,22 250,18 C275,14 290,24 300,20 L300,100 L0,100 Z"
              fill="url(#g1)"
            />
            <path
              d="M0,75 C20,70 35,55 55,50 C80,44 95,60 115,52 C140,42 160,30 185,35 C210,40 225,22 250,18 C275,14 290,24 300,20"
              fill="none"
              stroke="#3b82f6"
              strokeWidth="1.8"
            />
          </svg>
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between px-3 py-1.5 text-[9px] text-text-muted border-t border-border/50">
            {['1D', '1M', '1Y', '5Y', 'Max'].map((r, i) => (
              <span
                key={r}
                className={i === 2 ? 'font-semibold text-blue-500' : ''}
              >
                {r}
              </span>
            ))}
          </div>
        </div>

        {/* Key metrics */}
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            { l: 'Market Cap', v: '$3.41T' },
            { l: 'P/E', v: '34.8' },
            { l: 'EPS', v: '$6.57' },
          ].map((m) => (
            <div key={m.l} className="rounded-md border border-border/60 bg-background/40 px-2 py-2">
              <div className="text-[9px] text-text-muted uppercase tracking-wide">{m.l}</div>
              <div className="text-xs font-semibold text-foreground tabular-nums">{m.v}</div>
            </div>
          ))}
        </div>

        {/* Mini revenue bars */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <div className="text-[10px] font-medium text-text-secondary uppercase tracking-wide">Revenue</div>
            <div className="flex items-center gap-1 text-[10px] text-green-500">
              <TrendingUp className="h-2.5 w-2.5" /> +8.1% YoY
            </div>
          </div>
          <div className="flex items-end gap-1 h-12">
            {[40, 48, 55, 52, 60, 65, 70, 75, 72, 82, 88, 100].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-sm bg-blue-500/70"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
