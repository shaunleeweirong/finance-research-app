import { Suspense } from 'react';
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
  getStockNews,
  getSecFilings,
  getAnalystEstimates,
  getPriceTargetConsensus,
  getPriceTargetSummary,
  getPriceTargets,
  getRevenueProductSegmentation,
  getRevenueGeographicSegmentation,
  getInstitutionalHolders,
  getInsiderTrading,
} from '@/lib/fmp';
import { CompanyHeader } from '@/components/stock/company-header';
import { TabNavigation } from '@/components/stock/tab-navigation';
import { PriceChart } from '@/components/stock/overview/price-chart';
import { KeyMetrics } from '@/components/stock/overview/key-metrics';
import { CompanyStatistics } from '@/components/stock/overview/company-statistics';
import { CompanyProfile } from '@/components/stock/overview/company-profile';
import { FinancialsView } from '@/components/stock/financials/financials-view';
import { NewsTab } from '@/components/stock/news/news-tab';
import { FilingsTab } from '@/components/stock/filings/filings-tab';
import { EstimatesTab } from '@/components/stock/estimates/estimates-tab';
import { OwnershipTab } from '@/components/stock/ownership/ownership-tab';
import { UpgradePrompt } from '@/components/paywall/upgrade-prompt';
import { ValuationView } from '@/components/stock/dcf/valuation-view';
import { SearchBar } from '@/components/search/search-bar';
import { UserMenu } from '@/components/auth/user-menu';
import { WatchlistToggleButton } from '@/components/watchlist/watchlist-toggle-button';
import { Skeleton } from '@/components/ui/skeleton';
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

  // Fetch all data in parallel
  const { from, to } = getDateRangeForPeriod('1Y');

  const [
    profile, quote, historicalData, keyMetricsData,
    incomeData, balanceData, cashflowData, ratiosData,
    productSegments, geographicSegments,
    newsData, filingsData, estimatesData,
    priceTargetConsensus, priceTargetSummary, priceTargets,
    holdersData, insiderData,
  ] = await Promise.all([
    getCompanyProfile(upperTicker),
    getQuote(upperTicker),
    getHistoricalPrices(upperTicker, from, to),
    getKeyMetrics(upperTicker),
    getIncomeStatement(upperTicker, 'annual', 10),
    getBalanceSheet(upperTicker, 'annual', 10),
    getCashFlowStatement(upperTicker, 'annual', 10),
    getRatios(upperTicker, 'annual', 10),
    activeTab === 'financials' && canAccess(userPlan, 'financials:segments')
      ? getRevenueProductSegmentation(upperTicker)
      : Promise.resolve([]),
    activeTab === 'financials' && canAccess(userPlan, 'financials:segments')
      ? getRevenueGeographicSegmentation(upperTicker)
      : Promise.resolve([]),
    activeTab === 'news' ? getStockNews(upperTicker, 20) : Promise.resolve([]),
    activeTab === 'filings' ? getSecFilings(upperTicker, undefined, 40) : Promise.resolve([]),
    activeTab === 'estimates' && canAccess(userPlan, 'tab:estimates')
      ? getAnalystEstimates(upperTicker)
      : Promise.resolve([]),
    activeTab === 'estimates' && canAccess(userPlan, 'tab:estimates')
      ? getPriceTargetConsensus(upperTicker)
      : Promise.resolve(null),
    activeTab === 'estimates' && canAccess(userPlan, 'tab:estimates')
      ? getPriceTargetSummary(upperTicker)
      : Promise.resolve(null),
    activeTab === 'estimates' && canAccess(userPlan, 'tab:estimates')
      ? getPriceTargets(upperTicker)
      : Promise.resolve([]),
    activeTab === 'ownership' && canAccess(userPlan, 'tab:ownership')
      ? getInstitutionalHolders(upperTicker)
      : Promise.resolve([]),
    activeTab === 'ownership' && canAccess(userPlan, 'tab:ownership')
      ? getInsiderTrading(upperTicker, 20)
      : Promise.resolve([]),
  ]);

  if (!profile) {
    notFound();
  }
  const safeProfile = profile;

  const resolvedQuote: FMPQuote = quote ?? {
    symbol: safeProfile.symbol,
    name: safeProfile.companyName,
    price: safeProfile.price,
    change: safeProfile.changes,
    changesPercentage:
      safeProfile.changes != null && safeProfile.price != null && safeProfile.price !== 0
        ? (safeProfile.changes / safeProfile.price) * 100
        : null,
    dayLow: null,
    dayHigh: null,
    yearHigh: null,
    yearLow: null,
    marketCap: safeProfile.mktCap,
    priceAvg50: null,
    priceAvg200: null,
    volume: safeProfile.volAvg,
    avgVolume: safeProfile.volAvg,
    exchange: safeProfile.exchange,
    open: null,
    previousClose: null,
    eps: null,
    pe: null,
    earningsAnnouncement: '',
    sharesOutstanding: null,
    timestamp: null,
  };

  function renderTabContent() {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <PriceChart ticker={upperTicker} initialData={historicalData?.historical ?? []} />
            <KeyMetrics quote={resolvedQuote} keyMetrics={keyMetricsData?.[0] ?? null} profile={safeProfile} />
            <CompanyStatistics
              profile={safeProfile}
              quote={resolvedQuote}
              keyMetrics={keyMetricsData ?? []}
              ratios={ratiosData ?? []}
              income={incomeData ?? []}
              balance={balanceData ?? []}
              cashflow={cashflowData ?? []}
            />
            <CompanyProfile profile={safeProfile} />
          </div>
        );
      case 'financials':
        return (
          <FinancialsView
            ticker={upperTicker}
            initialData={{
              income: incomeData ?? [],
              balance: balanceData ?? [],
              cashflow: cashflowData ?? [],
              ratios: ratiosData ?? [],
              productSegments: productSegments ?? [],
              geographicSegments: geographicSegments ?? [],
            }}
            plan={userPlan}
          />
        );
      case 'news':
        return <NewsTab news={newsData} />;
      case 'estimates':
        if (!canAccess(userPlan, 'tab:estimates')) {
          return <UpgradePrompt feature="tab:estimates" title="Analyst Estimates" description="Access analyst consensus estimates, EPS forecasts, revenue projections, and price targets with a Pro plan." />;
        }
        return (
          <EstimatesTab
            estimates={estimatesData}
            actuals={incomeData ?? []}
            currentPrice={resolvedQuote.price}
            priceTargetConsensus={priceTargetConsensus}
            priceTargetSummary={priceTargetSummary}
            priceTargets={priceTargets}
          />
        );
      case 'ownership':
        if (!canAccess(userPlan, 'tab:ownership')) {
          return <UpgradePrompt feature="tab:ownership" title="Ownership Data" description="See institutional holders, insider trading activity, and ownership breakdowns with a Pro plan." />;
        }
        return <OwnershipTab holders={holdersData} insiderTrades={insiderData} />;
      case 'filings':
        return <FilingsTab filings={filingsData} />;
      case 'valuation':
        if (!canAccess(userPlan, 'tab:valuation')) {
          return <UpgradePrompt feature="tab:valuation" title="Valuation Models" description="Build DCF and EPS valuation models with adjustable growth rates, projection periods, and discount rates to find intrinsic value." />;
        }
        return (
          <ValuationView
            profile={safeProfile}
            quote={resolvedQuote}
            cashflow={cashflowData ?? []}
            income={incomeData ?? []}
          />
        );
      default:
        return (
          <div className="rounded-lg border border-border bg-surface p-12 text-center text-text-muted">
            Tab not found
          </div>
        );
    }
  }

  return (
    <>
      <div className="flex items-center justify-between py-4">
        <div className="max-w-md flex-1">
          <SearchBar />
        </div>
        <div className="ml-6 shrink-0">
          <UserMenu />
        </div>
      </div>

      <CompanyHeader
        profile={safeProfile}
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

      <TabNavigation ticker={upperTicker} plan={userPlan}>
        <Suspense fallback={<Skeleton className="h-96 w-full" />}>
          {renderTabContent()}
        </Suspense>
      </TabNavigation>
    </>
  );
}
