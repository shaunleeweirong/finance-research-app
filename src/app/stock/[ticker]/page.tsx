import { Suspense } from 'react';
import { notFound } from 'next/navigation';
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
import { CompanyProfile } from '@/components/stock/overview/company-profile';
import { FinancialsView } from '@/components/stock/financials/financials-view';
import { NewsTab } from '@/components/stock/news/news-tab';
import { FilingsTab } from '@/components/stock/filings/filings-tab';
import { EstimatesTab } from '@/components/stock/estimates/estimates-tab';
import { OwnershipTab } from '@/components/stock/ownership/ownership-tab';
import { SearchBar } from '@/components/search/search-bar';
import { Skeleton } from '@/components/ui/skeleton';
import { getDateRangeForPeriod } from '@/lib/utils/chart-helpers';
import type { FMPQuote } from '@/lib/fmp/types';

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
    // Segments — only fetch when Financials tab is active
    tab === 'financials' ? getRevenueProductSegmentation(upperTicker) : Promise.resolve([]),
    tab === 'financials' ? getRevenueGeographicSegmentation(upperTicker) : Promise.resolve([]),
    // Tab-specific data — only fetch when needed
    tab === 'news' ? getStockNews(upperTicker, 20) : Promise.resolve([]),
    tab === 'filings' ? getSecFilings(upperTicker, undefined, 40) : Promise.resolve([]),
    tab === 'estimates' ? getAnalystEstimates(upperTicker) : Promise.resolve([]),
    tab === 'estimates' ? getPriceTargetConsensus(upperTicker) : Promise.resolve(null),
    tab === 'estimates' ? getPriceTargetSummary(upperTicker) : Promise.resolve(null),
    tab === 'estimates' ? getPriceTargets(upperTicker) : Promise.resolve([]),
    tab === 'ownership' ? getInstitutionalHolders(upperTicker) : Promise.resolve([]),
    tab === 'ownership' ? getInsiderTrading(upperTicker, 20) : Promise.resolve([]),
  ]);

  // If no profile found, show 404
  if (!profile) {
    notFound();
  }
  // TypeScript narrowing: profile is non-null past this point
  const safeProfile = profile;

  // Quote fallback — build minimal quote from profile if quote endpoint fails
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

  const activeTab = tab;

  function renderTabContent() {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <PriceChart ticker={upperTicker} initialData={historicalData?.historical ?? []} />
            <KeyMetrics quote={resolvedQuote} keyMetrics={keyMetricsData?.[0] ?? null} profile={safeProfile} />
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
          />
        );
      case 'news':
        return <NewsTab news={newsData} />;
      case 'estimates':
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
        return <OwnershipTab holders={holdersData} insiderTrades={insiderData} />;
      case 'filings':
        return <FilingsTab filings={filingsData} />;
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
      {/* Top search bar */}
      <div className="py-4">
        <SearchBar />
      </div>

      {/* Company header */}
      <CompanyHeader profile={safeProfile} quote={resolvedQuote} />

      {/* Tab navigation + content */}
      <TabNavigation ticker={upperTicker}>
        <Suspense fallback={<Skeleton className="h-96 w-full" />}>
          {renderTabContent()}
        </Suspense>
      </TabNavigation>
    </>
  );
}
