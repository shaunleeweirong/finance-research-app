import Link from 'next/link';
import { ArrowRight, ArrowUpRight, Star, TrendingUp, TrendingDown } from 'lucide-react';
import { SearchBar } from '@/components/search/search-bar';
import type { FMPQuote } from '@/lib/fmp/types';

type Props = {
  userEmail: string | null | undefined;
  userName: string | null | undefined;
  plan: 'free' | 'pro' | 'premium';
  watchlistQuotes: FMPQuote[];
  indexQuotes: FMPQuote[];
  trendingQuotes: FMPQuote[];
};

const PLAN_LABEL = { free: 'Free', pro: 'Pro', premium: 'Premium' } as const;

export function Dashboard({
  userEmail,
  userName,
  plan,
  watchlistQuotes,
  indexQuotes,
  trendingQuotes,
}: Props) {
  const displayName =
    userName?.trim().split(' ')[0] ||
    (userEmail ? userEmail.split('@')[0] : 'there');
  const planLabel = PLAN_LABEL[plan];

  return (
    <main className="min-h-screen pb-20">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        {/* Hero */}
        <section className="mb-10 sm:mb-14">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/8 px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wider text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              {planLabel} plan
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
            Welcome back,{' '}
            <span className="text-emerald-400 italic font-semibold">
              {displayName}.
            </span>
          </h1>
          <p className="mt-3 max-w-xl text-sm sm:text-base text-text-secondary">
            Research any public company. Jump to a ticker, scan the market, or pick up where you left off.
          </p>
          <div className="mt-6 max-w-2xl">
            <SearchBar size="large" />
          </div>
        </section>

        {/* Market today strip */}
        <section className="mb-10 sm:mb-12">
          <SectionHeading label="Market today" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            {indexQuotes.map((q) => (
              <IndexTile key={q.symbol} quote={q} />
            ))}
            {indexQuotes.length === 0 &&
              ['SPY', 'QQQ', 'DIA', 'IWM'].map((s) => (
                <div
                  key={s}
                  className="rounded-xl border border-border bg-surface/60 px-4 py-3"
                >
                  <div className="text-xs text-text-muted">{s}</div>
                  <div className="mt-2 h-5 w-16 animate-pulse rounded bg-border" />
                </div>
              ))}
          </div>
        </section>

        {/* Two-column: watchlist + trending */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Watchlist */}
          <section className="lg:col-span-2">
            <SectionHeading
              label="Your watchlist"
              action={
                <Link
                  href="/watchlist"
                  className="inline-flex items-center gap-1 text-xs font-medium text-text-secondary hover:text-emerald-400 transition-colors"
                >
                  View all <ArrowRight className="h-3 w-3" />
                </Link>
              }
            />
            {watchlistQuotes.length > 0 ? (
              <div className="rounded-xl border border-border bg-surface/60 overflow-hidden">
                <ul className="divide-y divide-border">
                  {watchlistQuotes.slice(0, 6).map((q) => (
                    <li key={q.symbol}>
                      <Link
                        href={`/stock/${q.symbol}`}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-surface-hover transition-colors"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-emerald-500/10 text-[11px] font-bold text-emerald-400">
                          {q.symbol.slice(0, 4)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline gap-2">
                            <span className="text-sm font-semibold text-foreground truncate">
                              {q.symbol}
                            </span>
                            <span className="text-xs text-text-muted truncate hidden sm:inline">
                              {q.name}
                            </span>
                          </div>
                          <div className="mt-0.5 text-xs text-text-muted sm:hidden truncate">
                            {q.name}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-sm font-semibold text-foreground tabular-nums">
                            {formatPrice(q.price)}
                          </div>
                          <ChangePill pct={q.changesPercentage} />
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <EmptyWatchlist />
            )}
          </section>

          {/* Plan card */}
          <aside>
            <SectionHeading label="Plan" />
            <div className="rounded-xl border border-border bg-surface/60 p-5">
              <div className="text-xs uppercase tracking-wider text-text-muted">
                Current plan
              </div>
              <div className="mt-1 text-xl font-bold text-foreground">
                {planLabel}
              </div>
              {plan === 'free' ? (
                <>
                  <p className="mt-2 text-sm text-text-secondary">
                    Unlock 40-year financials, analyst estimates, ownership data, and DCF models.
                  </p>
                  <Link
                    href="/pricing"
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 transition-colors"
                  >
                    Upgrade to Pro <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </>
              ) : (
                <>
                  <p className="mt-2 text-sm text-text-secondary">
                    You&apos;re on the {planLabel} plan. Manage billing or change your plan anytime.
                  </p>
                  <Link
                    href="/billing"
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-medium text-foreground hover:bg-surface-hover transition-colors"
                  >
                    Manage billing <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </>
              )}
            </div>
          </aside>
        </div>

        {/* Trending */}
        <section className="mt-10 sm:mt-12">
          <SectionHeading label="Trending tickers" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {trendingQuotes.map((q) => (
              <Link
                key={q.symbol}
                href={`/stock/${q.symbol}`}
                className="group rounded-xl border border-border bg-surface/60 p-4 hover:border-emerald-500/40 hover:bg-surface transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-foreground">
                    {q.symbol}
                  </span>
                  <ArrowUpRight className="h-3.5 w-3.5 text-text-muted group-hover:text-emerald-400 transition-colors" />
                </div>
                <div className="mt-1 line-clamp-1 text-[11px] text-text-muted">
                  {q.name}
                </div>
                <div className="mt-3 text-sm font-semibold text-foreground tabular-nums">
                  {formatPrice(q.price)}
                </div>
                <ChangePill pct={q.changesPercentage} compact />
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function SectionHeading({
  label,
  action,
}: {
  label: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">
        {label}
      </h2>
      {action}
    </div>
  );
}

function IndexTile({ quote }: { quote: FMPQuote }) {
  const pct = quote.changesPercentage;
  const up = (pct ?? 0) >= 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <Link
      href={`/stock/${quote.symbol}`}
      className="group rounded-xl border border-border bg-surface/60 p-4 hover:border-emerald-500/40 transition-colors"
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wider text-text-muted">
          {quote.symbol}
        </span>
        <Icon
          className={`h-3.5 w-3.5 ${up ? 'text-emerald-400' : 'text-red-400'}`}
        />
      </div>
      <div className="mt-2 text-lg font-bold text-foreground tabular-nums">
        {formatPrice(quote.price)}
      </div>
      <div
        className={`mt-0.5 text-xs font-medium tabular-nums ${up ? 'text-emerald-400' : 'text-red-400'}`}
      >
        {formatPct(pct)}
      </div>
    </Link>
  );
}

function ChangePill({
  pct,
  compact = false,
}: {
  pct: number | null;
  compact?: boolean;
}) {
  if (pct === null || pct === undefined) {
    return <div className="text-xs text-text-muted">—</div>;
  }
  const up = pct >= 0;
  const color = up ? 'text-emerald-400' : 'text-red-400';
  return (
    <div className={`${compact ? 'mt-0.5' : ''} text-xs font-medium tabular-nums ${color}`}>
      {formatPct(pct)}
    </div>
  );
}

function EmptyWatchlist() {
  return (
    <div className="rounded-xl border border-dashed border-border bg-surface/40 px-6 py-10 text-center">
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10">
        <Star className="h-4 w-4 text-emerald-400" />
      </div>
      <h3 className="text-sm font-semibold text-foreground">
        No tickers yet
      </h3>
      <p className="mt-1 mx-auto max-w-xs text-xs text-text-muted">
        Search a company above and tap the star on its page to save it here.
      </p>
    </div>
  );
}

function formatPrice(price: number | null): string {
  if (price === null || price === undefined) return '—';
  return price >= 1000
    ? `$${price.toLocaleString('en-US', { maximumFractionDigits: 2 })}`
    : `$${price.toFixed(2)}`;
}

function formatPct(pct: number | null): string {
  if (pct === null || pct === undefined) return '—';
  const sign = pct >= 0 ? '+' : '';
  return `${sign}${pct.toFixed(2)}%`;
}
