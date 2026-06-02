'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { PriceChart } from '@/components/stock/overview/price-chart';
import { KeyMetrics } from '@/components/stock/overview/key-metrics';
import { CompanyStatistics } from '@/components/stock/overview/company-statistics';
import { CompanyProfile } from '@/components/stock/overview/company-profile';
import { WhatsHappening } from '@/components/stock/overview/whats-happening';
import { FinancialsView } from '@/components/stock/financials/financials-view';
import { NewsTab } from '@/components/stock/news/news-tab';
import { FilingsTab } from '@/components/stock/filings/filings-tab';
import { EstimatesTab } from '@/components/stock/estimates/estimates-tab';
import { OwnershipTab } from '@/components/stock/ownership/ownership-tab';
import { ValuationView } from '@/components/stock/dcf/valuation-view';
import { UpgradePrompt } from '@/components/paywall/upgrade-prompt';
import { Skeleton } from '@/components/ui/skeleton';
import { TabNavigation } from '@/components/stock/tab-navigation';
import { canAccess, type Plan } from '@/lib/auth/plans';
import type {
  FMPProfile,
  FMPQuote,
  FMPHistoricalPrice,
  FMPKeyMetrics,
  FMPIncomeStatement,
  FMPBalanceSheet,
  FMPCashFlowStatement,
  FMPRatios,
  FMPStockNews,
  FMPSecFiling,
  FMPAnalystEstimate,
  FMPPriceTargetConsensus,
  FMPPriceTargetSummary,
  FMPPriceTarget,
  FMPInstitutionalHolder,
  FMPInsiderTrade,
  SegmentPeriod,
} from '@/lib/fmp/types';

interface StockContentProps {
  ticker: string;
  plan: Plan;
  initialTab: string;
  profile: FMPProfile;
  quote: FMPQuote;
  historicalData: FMPHistoricalPrice[];
  keyMetricsData: FMPKeyMetrics[];
  incomeData: FMPIncomeStatement[];
  balanceData: FMPBalanceSheet[];
  cashflowData: FMPCashFlowStatement[];
  ratiosData: FMPRatios[];
}

interface LazyTabData {
  news: FMPStockNews[] | null;
  filings: FMPSecFiling[] | null;
  estimates: {
    estimates: FMPAnalystEstimate[];
    priceTargetConsensus: FMPPriceTargetConsensus | null;
    priceTargetSummary: FMPPriceTargetSummary | null;
    priceTargets: FMPPriceTarget[];
  } | null;
  ownership: {
    holders: FMPInstitutionalHolder[];
    insiderTrades: FMPInsiderTrade[];
  } | null;
  segments: {
    product: SegmentPeriod[];
    geographic: SegmentPeriod[];
  } | null;
}

export function StockContent({
  ticker,
  plan,
  initialTab,
  profile,
  quote,
  historicalData,
  keyMetricsData,
  incomeData,
  balanceData,
  cashflowData,
  ratiosData,
}: StockContentProps) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [lazyData, setLazyData] = useState<LazyTabData>({
    news: null,
    filings: null,
    estimates: null,
    ownership: null,
    segments: null,
  });
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const lazyDataRef = useRef(lazyData);
  lazyDataRef.current = lazyData;

  const fetchTabData = useCallback(
    async (tab: string) => {
      const current = lazyDataRef.current;

      // Core tabs don't need lazy fetching
      if (tab === 'overview' || tab === 'valuation') return;

      // Skip if already loaded
      if (tab === 'news' && current.news !== null) return;
      if (tab === 'filings' && current.filings !== null) return;
      if (tab === 'estimates' && current.estimates !== null) return;
      if (tab === 'ownership' && current.ownership !== null) return;
      if (tab === 'financials' && current.segments !== null) return;

      setLoading((prev) => ({ ...prev, [tab]: true }));

      try {
        switch (tab) {
          case 'news': {
            const res = await fetch(`/api/fmp/news/${ticker}`);
            if (res.ok) {
              const data = await res.json();
              setLazyData((prev) => ({ ...prev, news: data }));
            }
            break;
          }
          case 'filings': {
            const res = await fetch(`/api/fmp/filings/${ticker}`);
            if (res.ok) {
              const data = await res.json();
              setLazyData((prev) => ({ ...prev, filings: data }));
            }
            break;
          }
          case 'estimates': {
            const res = await fetch(`/api/fmp/estimates/${ticker}`);
            if (res.ok) {
              const data = await res.json();
              setLazyData((prev) => ({ ...prev, estimates: data }));
            }
            break;
          }
          case 'ownership': {
            const res = await fetch(`/api/fmp/ownership/${ticker}`);
            if (res.ok) {
              const data = await res.json();
              setLazyData((prev) => ({ ...prev, ownership: data }));
            }
            break;
          }
          case 'financials': {
            const res = await fetch(`/api/fmp/segments/${ticker}`);
            if (res.ok) {
              const data = await res.json();
              setLazyData((prev) => ({ ...prev, segments: data }));
            }
            break;
          }
        }
      } catch {
        // Keep null — tab will show empty state
      } finally {
        setLoading((prev) => ({ ...prev, [tab]: false }));
      }
    },
    [ticker],
  );

  // Fetch data for the initial tab on mount
  useEffect(() => {
    fetchTabData(initialTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleTabChange(tab: string) {
    if (!canAccess(plan, `tab:${tab}`)) return;
    setActiveTab(tab);
    fetchTabData(tab);
    // Update URL for shareability without triggering navigation
    const url =
      tab === 'overview'
        ? `/stock/${ticker}`
        : `/stock/${ticker}?tab=${tab}`;
    window.history.replaceState(null, '', url);
  }

  function renderTabContent() {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <PriceChart ticker={ticker} initialData={historicalData} />
            <WhatsHappening ticker={ticker} />
            <KeyMetrics
              quote={quote}
              keyMetrics={keyMetricsData?.[0] ?? null}
              profile={profile}
            />
            <CompanyStatistics
              profile={profile}
              quote={quote}
              keyMetrics={keyMetricsData ?? []}
              ratios={ratiosData ?? []}
              income={incomeData ?? []}
              balance={balanceData ?? []}
              cashflow={cashflowData ?? []}
            />
            <CompanyProfile profile={profile} />
          </div>
        );

      case 'financials':
        return (
          <FinancialsView
            ticker={ticker}
            initialData={{
              income: incomeData ?? [],
              balance: balanceData ?? [],
              cashflow: cashflowData ?? [],
              ratios: ratiosData ?? [],
              productSegments: lazyData.segments?.product ?? [],
              geographicSegments: lazyData.segments?.geographic ?? [],
            }}
            plan={plan}
          />
        );

      case 'news':
        if (loading.news) return <Skeleton className="h-96 w-full" />;
        return <NewsTab news={lazyData.news ?? []} />;

      case 'estimates':
        if (!canAccess(plan, 'tab:estimates')) {
          return (
            <UpgradePrompt
              feature="tab:estimates"
              title="Analyst Estimates"
              description="Access analyst consensus estimates, EPS forecasts, revenue projections, and price targets with a Pro plan."
            />
          );
        }
        if (loading.estimates) return <Skeleton className="h-96 w-full" />;
        return (
          <EstimatesTab
            estimates={lazyData.estimates?.estimates ?? []}
            actuals={incomeData ?? []}
            currentPrice={quote.price}
            priceTargetConsensus={lazyData.estimates?.priceTargetConsensus ?? null}
            priceTargetSummary={lazyData.estimates?.priceTargetSummary ?? null}
            priceTargets={lazyData.estimates?.priceTargets ?? []}
          />
        );

      case 'ownership':
        if (!canAccess(plan, 'tab:ownership')) {
          return (
            <UpgradePrompt
              feature="tab:ownership"
              title="Ownership Data"
              description="See institutional holders, insider trading activity, and ownership breakdowns with a Pro plan."
            />
          );
        }
        if (loading.ownership) return <Skeleton className="h-96 w-full" />;
        return (
          <OwnershipTab
            holders={lazyData.ownership?.holders ?? []}
            insiderTrades={lazyData.ownership?.insiderTrades ?? []}
          />
        );

      case 'filings':
        if (loading.filings) return <Skeleton className="h-96 w-full" />;
        return <FilingsTab filings={lazyData.filings ?? []} />;

      case 'valuation':
        if (!canAccess(plan, 'tab:valuation')) {
          return (
            <UpgradePrompt
              feature="tab:valuation"
              title="Valuation Models"
              description="Build DCF and EPS valuation models with adjustable growth rates, projection periods, and discount rates to find intrinsic value."
            />
          );
        }
        return (
          <ValuationView
            profile={profile}
            quote={quote}
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
    <TabNavigation
      ticker={ticker}
      plan={plan}
      activeTab={activeTab}
      onTabChange={handleTabChange}
    >
      {renderTabContent()}
    </TabNavigation>
  );
}
