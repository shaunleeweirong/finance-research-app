'use client';

import { useState, useMemo, useCallback, useRef } from 'react';
import { ChartPanel } from './chart-panel';
import { ControlsBar, type DepthLimit } from './controls-bar';
import { DataTable } from './data-table';
import { SegmentsView } from './segments-view';
import { STATEMENT_CONFIGS, type StatementType } from '@/config/financial-line-items';
import type {
  FMPIncomeStatement,
  FMPBalanceSheet,
  FMPCashFlowStatement,
  FMPRatios,
  FinancialRecord,
  SegmentPeriod,
} from '@/lib/fmp/types';
import { detectBestUnit, type DataUnit } from '@/lib/utils/format';
import type { Plan } from '@/lib/auth/plans';
import { canAccess, FREE_MAX_CHART_METRICS } from '@/lib/auth/plans';

interface FinancialsViewProps {
  ticker: string;
  initialData: {
    income: FMPIncomeStatement[];
    balance: FMPBalanceSheet[];
    cashflow: FMPCashFlowStatement[];
    ratios: FMPRatios[];
    productSegments: SegmentPeriod[];
    geographicSegments: SegmentPeriod[];
  };
  plan?: Plan;
}

type StatementData = Record<string, FinancialRecord[]>;

export function FinancialsView({ ticker, initialData, plan = 'free' }: FinancialsViewProps) {
  const [activeStatement, setActiveStatement] = useState<StatementType>('income');
  const [activePeriod, setActivePeriod] = useState<'annual' | 'quarter'>('annual');
  const [activeLimit, setActiveLimit] = useState<DepthLimit>(10);
  // Auto-detect initial unit based on the largest revenue value in income data
  const [activeUnit, setActiveUnit] = useState<DataUnit>(() => {
    const revenues = initialData.income.map((r) => r.revenue);
    return detectBestUnit(revenues);
  });
  const [selectedMetrics, setSelectedMetrics] = useState<Map<string, { chartType: 'bar' | 'line' }>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [showChange, setShowChange] = useState(false);

  const unlimitedMetrics = canAccess(plan, 'financials:unlimited-metrics');

  // Cache fetched data to avoid re-fetching. Key format: `{statement}-{period}-{limit}`
  // Initial server-side data is always annual 10-year
  const [dataCache, setDataCache] = useState<StatementData>(() => ({
    'income-annual-10': initialData.income as unknown as FinancialRecord[],
    'balance-annual-10': initialData.balance as unknown as FinancialRecord[],
    'cashflow-annual-10': initialData.cashflow as unknown as FinancialRecord[],
    'ratios-annual-10': initialData.ratios as unknown as FinancialRecord[],
  }));

  // Ref to avoid stale closure in fetchData without adding dataCache as dependency
  const dataCacheRef = useRef(dataCache);
  dataCacheRef.current = dataCache;

  const cacheKey = `${activeStatement}-${activePeriod}-${activeLimit}`;
  const currentData = dataCache[cacheKey] || [];
  const currentConfig = STATEMENT_CONFIGS[activeStatement];

  // Build label and format lookups for chart.
  // `${key}:pct` variants represent the YoY % change series for that metric.
  const metricLabels = useMemo(() => {
    const labels: Record<string, string> = {};
    currentConfig.items.forEach((item) => {
      labels[item.key] = item.label;
      labels[`${item.key}:pct`] = `${item.label} % Chg`;
    });
    return labels;
  }, [currentConfig]);

  const metricFormats = useMemo(() => {
    const formats: Record<string, string> = {};
    currentConfig.items.forEach((item) => {
      formats[item.key] = item.format;
      formats[`${item.key}:pct`] = 'percent';
    });
    return formats;
  }, [currentConfig]);

  const fetchData = useCallback(
    async (statement: StatementType, period: 'annual' | 'quarter', limit: DepthLimit) => {
      // Segments tab uses its own data (server-fetched), not the financials API
      if (statement === 'segments') return;

      const key = `${statement}-${period}-${limit}`;
      if (dataCacheRef.current[key]) return; // Check via ref to avoid stale closure

      setIsLoading(true);
      try {
        const res = await fetch(
          `/api/fmp/financials/${ticker}?statement=${statement}&period=${period}&limit=${limit}`,
        );
        if (res.ok) {
          const data = (await res.json()) as FinancialRecord[];
          setDataCache((prev) => ({ ...prev, [key]: data }));
        }
      } catch {
        // Keep existing data on error
      } finally {
        setIsLoading(false);
      }
    },
    [ticker],
  );

  function handleStatementChange(statement: StatementType) {
    setActiveStatement(statement);
    setSelectedMetrics(new Map()); // Clear selections when switching statements
    // Segments tab doesn't use the financials fetch endpoint
    if (statement !== 'segments') {
      void fetchData(statement, activePeriod, activeLimit);
    }
  }

  function handlePeriodChange(period: 'annual' | 'quarter') {
    setActivePeriod(period);
    void fetchData(activeStatement, period, activeLimit);
  }

  function handleLimitChange(limit: DepthLimit) {
    setActiveLimit(limit);
    void fetchData(activeStatement, activePeriod, limit);
  }

  function handleUnitChange(unit: DataUnit) {
    setActiveUnit(unit);
  }

  function handleMetricToggle(key: string) {
    setSelectedMetrics((prev) => {
      const next = new Map(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        // Enforce metric limit for free users
        if (!unlimitedMetrics && next.size >= FREE_MAX_CHART_METRICS) {
          return prev;
        }
        next.set(key, { chartType: 'bar' });
      }
      return next;
    });
  }

  function handleChartTypeChange(key: string, type: 'bar' | 'line') {
    setSelectedMetrics((prev) => {
      const next = new Map(prev);
      const existing = next.get(key);
      if (existing) {
        next.set(key, { ...existing, chartType: type });
      }
      return next;
    });
  }

  function handleRemoveMetric(key: string) {
    setSelectedMetrics((prev) => {
      const next = new Map(prev);
      next.delete(key);
      return next;
    });
  }

  const selectedSet = useMemo(() => new Set(selectedMetrics.keys()), [selectedMetrics]);
  const isSegmentsTab = activeStatement === 'segments';

  return (
    <div className="space-y-4">
      {/* Metric limit notice for free users */}
      {!unlimitedMetrics && !isSegmentsTab && selectedMetrics.size >= FREE_MAX_CHART_METRICS && (
        <p className="text-xs text-text-muted text-center">
          Free plan: max {FREE_MAX_CHART_METRICS} chart metrics.{' '}
          <a href="/pricing" className="text-blue-500 hover:underline">Upgrade for unlimited</a>
        </p>
      )}

      {/* Chart panel — only for statement tabs, not segments */}
      {!isSegmentsTab && (
        <ChartPanel
          data={currentData}
          selectedMetrics={selectedMetrics}
          metricLabels={metricLabels}
          metricFormats={metricFormats}
          activePeriod={activePeriod}
          activeUnit={activeUnit}
          onChartTypeChange={handleChartTypeChange}
          onRemove={handleRemoveMetric}
        />
      )}

      {/* Controls */}
      <ControlsBar
        activeStatement={activeStatement}
        activePeriod={activePeriod}
        activeLimit={activeLimit}
        activeUnit={activeUnit}
        onStatementChange={handleStatementChange}
        onPeriodChange={handlePeriodChange}
        onLimitChange={handleLimitChange}
        onUnitChange={handleUnitChange}
        isLoading={isLoading}
        plan={plan}
        showChange={showChange}
        onShowChangeToggle={() => setShowChange((prev) => !prev)}
      />

      {/* Content: segments view OR data table */}
      {isSegmentsTab ? (
        <SegmentsView
          productData={initialData.productSegments}
          geographicData={initialData.geographicSegments}
          activeUnit={activeUnit}
        />
      ) : isLoading ? (
        <div className="h-96 animate-pulse rounded-lg bg-surface" />
      ) : (
        <DataTable
          data={currentData}
          lineItems={currentConfig.items}
          selectedMetrics={selectedSet}
          activeUnit={activeUnit}
          onMetricToggle={handleMetricToggle}
          showChange={showChange}
        />
      )}
    </div>
  );
}
