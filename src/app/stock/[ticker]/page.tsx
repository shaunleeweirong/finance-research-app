import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isValidTicker } from '@/lib/utils/validation';
import {
  getCompanyProfile,
  getQuote,
  getHistoricalPrices,
  getKeyMetrics,
  getIncomeStatement,
  getBalanceSheet,
  getCashFlowStatement,
  getRatios,
} from '@/lib/fmp';
import { CompanyHeader } from '@/components/stock/company-header';
import { StockContent } from '@/components/stock/stock-content';
import { WatchlistToggleButton } from '@/components/watchlist/watchlist-toggle-button';
import { getDateRangeForPeriod } from '@/lib/utils/chart-helpers';
import { canAccess, type Plan } from '@/lib/auth/plans';
import type { FMPQuote } from '@/lib/fmp/types';
import Link from 'next/link';

export default async function StockPage({
  params,
  searchParams,
}: {
  params: Promise<{ ticker: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { ticker } = await params;
  const { tab = 'overview' } = await searchParams;
  const upperTicker = ticker.toUpperCase();

  if (!isValidTicker(upperTicker)) {
    notFound();
  }

  // Get user plan from Supabase
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let userPlan: Plan = 'free';
  if (user) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('plan')
      .eq('id', user.id)
      .single();
    userPlan = (profile?.plan as Plan) || 'free';
  }

  const canManageWatchlist = canAccess(userPlan, 'watchlist:basic');
  let isWatchlisted = false;

  if (user && canManageWatchlist) {
    const { data: watchlistItem } = await supabase
      .from('watchlist')
      .select('ticker')
      .eq('user_id', user.id)
      .eq('ticker', upperTicker)
      .maybeSingle();

    isWatchlisted = Boolean(watchlistItem);
  }

  // If user tries to access a gated tab via URL, fall back to overview
  const activeTab = canAccess(userPlan, `tab:${tab}`) ? tab : 'overview';

  // Fetch only core data — tab-specific data is loaded client-side on demand
  const { from, to } = getDateRangeForPeriod('1Y');

  const [
    profile, quote, historicalData, keyMetricsData,
    incomeData, balanceData, cashflowData, ratiosData,
  ] = await Promise.all([
    getCompanyProfile(upperTicker),
    getQuote(upperTicker),
    getHistoricalPrices(upperTicker, from, to),
    getKeyMetrics(upperTicker),
    getIncomeStatement(upperTicker, 'annual', 10),
    getBalanceSheet(upperTicker, 'annual', 10),
    getCashFlowStatement(upperTicker, 'annual', 10),
    getRatios(upperTicker, 'annual', 10),
  ]);

  if (!profile) {
    notFound();
  }

  const resolvedQuote: FMPQuote = quote ?? {
    symbol: profile.symbol,
    name: profile.companyName,
    price: profile.price,
    change: profile.changes,
    changesPercentage:
      profile.changes != null && profile.price != null && profile.price !== 0
        ? (profile.changes / profile.price) * 100
        : null,
    dayLow: null,
    dayHigh: null,
    yearHigh: null,
    yearLow: null,
    marketCap: profile.mktCap,
    priceAvg50: null,
    priceAvg200: null,
    volume: profile.volAvg,
    avgVolume: profile.volAvg,
    exchange: profile.exchange,
    open: null,
    previousClose: null,
    eps: null,
    pe: null,
    earningsAnnouncement: '',
    sharesOutstanding: null,
    timestamp: null,
  };

  return (
    <>
      <CompanyHeader
        profile={profile}
        quote={resolvedQuote}
        action={
          canManageWatchlist ? (
            <WatchlistToggleButton
              ticker={upperTicker}
              initiallyWatchlisted={isWatchlisted}
            />
          ) : (
            <Link
              href="/pricing"
              className="inline-flex h-7 items-center rounded-lg border border-border px-2.5 text-xs font-medium text-foreground hover:bg-surface"
            >
              Watchlist: Pro
            </Link>
          )
        }
      />

      <StockContent
        ticker={upperTicker}
        plan={userPlan}
        initialTab={activeTab}
        profile={profile}
        quote={resolvedQuote}
        historicalData={historicalData?.historical ?? []}
        keyMetricsData={keyMetricsData ?? []}
        incomeData={incomeData ?? []}
        balanceData={balanceData ?? []}
        cashflowData={cashflowData ?? []}
        ratiosData={ratiosData ?? []}
      />
    </>
  );
}
