'use client';

import { useState, useMemo, useCallback, useRef } from 'react';
import { ChartPanel } from './chart-panel';
import { ControlsBar, type DepthLimit } from './controls-bar';
import { DataTable } from './data-table';
import { STATEMENT_CONFIGS, type StatementType } from '@/config/financial-line-items';
import type { FMPIncomeStatement, FMPBalanceSheet, FMPCashFlowStatement, FMPRatios, FinancialRecord } from '@/lib/fmp/types';

interface FinancialsViewProps {
  ticker: string;
  initialData: {
    income: FMPIncomeStatement[];
    balance: FMPBalanceSheet[];
    cashflow: FMPCashFlowStatement[];
    ratios: FMPRatios[];
  };
}

type StatementData = Record<string, FinancialRecord[]>;

export function FinancialsView({ ticker, initialData }: FinancialsViewProps) {
  const [activeStatement, setActiveStatement] = useState<StatementType>('income');
  const [activePeriod, setActivePeriod] = useState<'annual' | 'quarter'>('annual');
  const [activeLimit, setActiveLimit] = useState<DepthLimit>(10);
  const [selectedMetrics, setSelectedMetrics] = useState<Map<string, { chartType: 'bar' | 'line' }>>(new Map());
  const [isLoading, setIsLoading] = useState(false);

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

  // Build label lookup for chart legend
  const metricLabels = useMemo(() => {
    const labels: Record<string, string> = {};
    currentConfig.items.forEach((item) => {
      labels[item.key] = item.label;
    });
    return labels;
  }, [currentConfig]);

  const fetchData = useCallback(
    async (statement: StatementType, period: 'annual' | 'quarter', limit: DepthLimit) => {
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
    void fetchData(statement, activePeriod, activeLimit);
  }

  function handlePeriodChange(period: 'annual' | 'quarter') {
    setActivePeriod(period);
    void fetchData(activeStatement, period, activeLimit);
  }

  function handleLimitChange(limit: DepthLimit) {
    setActiveLimit(limit);
    void fetchData(activeStatement, activePeriod, limit);
  }

  function handleMetricToggle(key: string) {
    setSelectedMetrics((prev) => {
      const next = new Map(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
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

  return (
    <div className="space-y-4">
      {/* Chart panel */}
      <ChartPanel
        data={currentData}
        selectedMetrics={selectedMetrics}
        metricLabels={metricLabels}
        activePeriod={activePeriod}
        onChartTypeChange={handleChartTypeChange}
        onRemove={handleRemoveMetric}
      />

      {/* Controls */}
      <ControlsBar
        activeStatement={activeStatement}
        activePeriod={activePeriod}
        activeLimit={activeLimit}
        onStatementChange={handleStatementChange}
        onPeriodChange={handlePeriodChange}
        onLimitChange={handleLimitChange}
        isLoading={isLoading}
      />

      {/* Data table */}
      {isLoading ? (
        <div className="h-96 animate-pulse rounded-lg bg-surface" />
      ) : (
        <DataTable
          data={currentData}
          lineItems={currentConfig.items}
          selectedMetrics={selectedSet}
          onMetricToggle={handleMetricToggle}
        />
      )}
    </div>
  );
}
