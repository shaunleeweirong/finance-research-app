'use client';

import { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatLargeNumber, formatCompactNumber, formatNumber, formatCurrency } from '@/lib/utils/format';
import type {
  FMPAnalystEstimate,
  FMPIncomeStatement,
  FMPPriceTargetConsensus,
  FMPPriceTargetSummary,
  FMPPriceTarget,
} from '@/lib/fmp/types';

type FinancialMetricKey = 'revenue' | 'ebitda' | 'eps';
type ViewKey = FinancialMetricKey | 'priceTargets';

interface MetricConfig {
  key: FinancialMetricKey;
  label: string;
  title: string;
  estLowField: keyof FMPAnalystEstimate;
  estAvgField: keyof FMPAnalystEstimate;
  estHighField: keyof FMPAnalystEstimate;
  analystField: keyof FMPAnalystEstimate;
  // For real actuals from income statement
  actualField: keyof FMPIncomeStatement | null;
  format: (v: number | null) => string;
  yAxisFormatter: (v: number) => string;
}

const METRICS: MetricConfig[] = [
  {
    key: 'revenue',
    label: 'Revenue',
    title: 'Revenue Consensus Analyst Estimates',
    estLowField: 'estimatedRevenueLow',
    estAvgField: 'estimatedRevenueAvg',
    estHighField: 'estimatedRevenueHigh',
    analystField: 'numberAnalystEstimatedRevenue',
    actualField: 'revenue',
    format: formatLargeNumber,
    yAxisFormatter: (v: number) => formatCompactNumber(v),
  },
  {
    key: 'ebitda',
    label: 'EBITDA',
    title: 'EBITDA Consensus Analyst Estimates',
    estLowField: 'estimatedEbitdaLow',
    estAvgField: 'estimatedEbitdaAvg',
    estHighField: 'estimatedEbitdaHigh',
    analystField: 'numberAnalystEstimatedRevenue',
    actualField: 'ebitda',
    format: formatLargeNumber,
    yAxisFormatter: (v: number) => formatCompactNumber(v),
  },
  {
    key: 'eps',
    label: 'EPS',
    title: 'EPS Consensus Analyst Estimates',
    estLowField: 'estimatedEpsLow',
    estAvgField: 'estimatedEpsAvg',
    estHighField: 'estimatedEpsHigh',
    analystField: 'numberAnalystsEstimatedEps',
    actualField: 'epsdiluted',
    format: (v: number | null) => (v != null ? `$${v.toFixed(2)}` : 'N/A'),
    yAxisFormatter: (v: number) => `$${v.toFixed(2)}`,
  },
];

interface EstimatesTabProps {
  estimates: FMPAnalystEstimate[];
  actuals: FMPIncomeStatement[];
  currentPrice: number | null;
  priceTargetConsensus: FMPPriceTargetConsensus | null;
  priceTargetSummary: FMPPriceTargetSummary | null;
  priceTargets: FMPPriceTarget[];
}

interface ChartPoint {
  year: number;
  yearLabel: string;
  low: number | null;
  avg: number | null;
  high: number | null;
  rangeBase: number | null;
  rangeHeight: number | null;
  actualAvg: number | null;
  estimateAvg: number | null;
  analysts: number | null;
  isActual: boolean;
}

function buildChartData(
  metric: MetricConfig,
  estimates: FMPAnalystEstimate[],
  actuals: FMPIncomeStatement[],
  currentYear: number,
): ChartPoint[] {
  // Build a year -> actual value lookup from real income statements
  const actualsMap = new Map<number, number | null>();
  if (metric.actualField) {
    for (const a of actuals) {
      const year = parseInt(a.date.split('-')[0], 10);
      const value = a[metric.actualField] as number | null;
      actualsMap.set(year, value);
    }
  }

  // Sort estimates oldest to newest
  const sortedEstimates = [...estimates].reverse();
  const points: ChartPoint[] = [];

  for (const e of sortedEstimates) {
    const year = parseInt(e.date.split('-')[0], 10);
    const isPast = year <= currentYear;
    const estLow = e[metric.estLowField] as number | null;
    const estAvg = e[metric.estAvgField] as number | null;
    const estHigh = e[metric.estHighField] as number | null;
    const analysts = e[metric.analystField] as number | null;

    // For past years, use real actual value if available
    const realActual = isPast ? actualsMap.get(year) ?? null : null;
    const avgValue = isPast && realActual != null ? realActual : estAvg;

    points.push({
      year,
      yearLabel: `${year} ${isPast ? '(A)' : '(E)'}`,
      low: estLow,
      avg: avgValue,
      high: estHigh,
      rangeBase: !isPast ? estLow : null,
      rangeHeight: !isPast && estLow != null && estHigh != null ? estHigh - estLow : null,
      actualAvg: isPast ? avgValue : null,
      estimateAvg: !isPast ? avgValue : null,
      analysts,
      isActual: isPast,
    });
  }

  // Bridge the last actual to the first estimate so the dashed line connects
  const lastActualIdx = points.findIndex(
    (d, i) => d.isActual && (i === points.length - 1 || !points[i + 1].isActual),
  );
  if (lastActualIdx !== -1 && lastActualIdx < points.length - 1) {
    points[lastActualIdx] = { ...points[lastActualIdx], estimateAvg: points[lastActualIdx].actualAvg };
  }

  return points;
}

export function EstimatesTab({
  estimates,
  actuals,
  currentPrice,
  priceTargetConsensus,
  priceTargetSummary,
  priceTargets,
}: EstimatesTabProps) {
  const [activeView, setActiveView] = useState<ViewKey>('revenue');
  const currentYear = new Date().getFullYear();

  if (estimates.length === 0 && !priceTargetConsensus) {
    return (
      <Card className="bg-surface border-border p-12 text-center">
        <p className="text-text-muted">No analyst estimates available for this company.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* View Switcher Tabs */}
      <div className="flex flex-wrap gap-1">
        {METRICS.map((m) => (
          <button
            key={m.key}
            onClick={() => setActiveView(m.key)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              activeView === m.key
                ? 'bg-primary text-primary-foreground'
                : 'text-text-secondary hover:bg-surface-hover hover:text-foreground'
            }`}
          >
            {m.label}
          </button>
        ))}
        <button
          onClick={() => setActiveView('priceTargets')}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            activeView === 'priceTargets'
              ? 'bg-primary text-primary-foreground'
              : 'text-text-secondary hover:bg-surface-hover hover:text-foreground'
          }`}
        >
          Price Targets
        </button>
      </div>

      {/* Render the active view */}
      {activeView === 'priceTargets' ? (
        <PriceTargetsView
          consensus={priceTargetConsensus}
          summary={priceTargetSummary}
          targets={priceTargets}
          currentPrice={currentPrice}
        />
      ) : (
        <FinancialEstimateView
          metric={METRICS.find((m) => m.key === activeView)!}
          estimates={estimates}
          actuals={actuals}
          currentYear={currentYear}
        />
      )}
    </div>
  );
}

// =======================
// Financial Estimate View (Revenue / EBITDA / EPS)
// =======================

interface FinancialEstimateViewProps {
  metric: MetricConfig;
  estimates: FMPAnalystEstimate[];
  actuals: FMPIncomeStatement[];
  currentYear: number;
}

function FinancialEstimateView({ metric, estimates, actuals, currentYear }: FinancialEstimateViewProps) {
  const chartData = useMemo(
    () => buildChartData(metric, estimates, actuals, currentYear),
    [metric, estimates, actuals, currentYear],
  );

  const boundaryYear = useMemo(() => {
    const lastActual = chartData.filter((d) => d.isActual).pop();
    return lastActual?.yearLabel ?? null;
  }, [chartData]);

  return (
    <>
      {/* Chart Card */}
      <Card className="bg-surface border-border p-6">
        <h3 className="mb-6 text-center text-base font-semibold text-foreground">
          {metric.title}
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 20, bottom: 5, left: 10 }}>
              <defs>
                <linearGradient id="estimateCone" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey="yearLabel"
                tick={{ fill: '#64748b', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fill: '#64748b', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={metric.yAxisFormatter}
                width={70}
                domain={['auto', 'auto']}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || payload.length === 0) return null;
                  const data = payload[0]?.payload as ChartPoint | undefined;
                  if (!data) return null;
                  return (
                    <div className="rounded-lg border border-border bg-card p-3 text-xs shadow-xl">
                      <div className="mb-2 font-semibold text-foreground">{data.yearLabel}</div>
                      <div className="space-y-1">
                        <div className="flex justify-between gap-4">
                          <span className="text-text-muted">{data.isActual ? 'Actual' : 'Average'}</span>
                          <span className="font-mono text-foreground">{metric.format(data.avg)}</span>
                        </div>
                        {!data.isActual && (
                          <>
                            <div className="flex justify-between gap-4">
                              <span className="text-text-muted">High</span>
                              <span className="font-mono text-positive">{metric.format(data.high)}</span>
                            </div>
                            <div className="flex justify-between gap-4">
                              <span className="text-text-muted">Low</span>
                              <span className="font-mono text-negative">{metric.format(data.low)}</span>
                            </div>
                          </>
                        )}
                        {data.analysts != null && (
                          <div className="flex justify-between gap-4 border-t border-border pt-1 mt-1">
                            <span className="text-text-muted">Analysts</span>
                            <span className="font-mono text-text-secondary">{data.analysts}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }}
              />

              {boundaryYear && (
                <ReferenceLine
                  x={boundaryYear}
                  stroke="#475569"
                  strokeDasharray="3 3"
                  strokeWidth={1}
                />
              )}

              {/* Uncertainty cone — only on estimate side */}
              <Area
                dataKey="rangeBase"
                stackId="cone"
                stroke="none"
                fill="transparent"
                isAnimationActive={false}
              />
              <Area
                dataKey="rangeHeight"
                stackId="cone"
                stroke="none"
                fill="url(#estimateCone)"
                isAnimationActive={false}
              />

              {/* Actual line — solid */}
              <Line
                type="monotone"
                dataKey="actualAvg"
                stroke="#3b82f6"
                strokeWidth={2.5}
                dot={{ fill: '#3b82f6', r: 4, strokeWidth: 0 }}
                connectNulls={false}
                isAnimationActive={false}
              />

              {/* Estimate line — dashed */}
              <Line
                type="monotone"
                dataKey="estimateAvg"
                stroke="#3b82f6"
                strokeWidth={2.5}
                strokeDasharray="6 4"
                dot={{ fill: '#3b82f6', r: 4, strokeWidth: 0 }}
                connectNulls={false}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Legend hint */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-text-muted">
          <div className="flex items-center gap-2">
            <div className="h-0.5 w-6 bg-primary" />
            <span>Actual (A)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-0.5 w-6 border-t-2 border-dashed border-primary" />
            <span>Estimate (E)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-6 rounded-sm bg-primary/20" />
            <span>Low – High range</span>
          </div>
        </div>
      </Card>

      {/* Detail Table */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-background">
              <th className="sticky left-0 bg-background px-4 py-3 text-left text-xs font-medium text-text-muted min-w-[140px]">
                Estimates
              </th>
              {chartData.map((d) => (
                <th
                  key={d.yearLabel}
                  className="px-4 py-3 text-right text-xs font-medium text-text-muted whitespace-nowrap min-w-[110px]"
                >
                  {d.yearLabel}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border hover:bg-surface-hover">
              <td className="sticky left-0 bg-surface px-4 py-2.5 font-medium text-foreground">
                {metric.actualField ? 'Mean / Actual' : 'Mean'}
              </td>
              {chartData.map((d) => (
                <td
                  key={`mean-${d.yearLabel}`}
                  className={`px-4 py-2.5 text-right font-mono ${d.isActual ? 'text-foreground font-semibold' : 'text-foreground'}`}
                >
                  {metric.format(d.avg)}
                </td>
              ))}
            </tr>
            <tr className="border-b border-border hover:bg-surface-hover">
              <td className="sticky left-0 bg-surface px-4 py-2.5 font-medium text-foreground">High</td>
              {chartData.map((d) => (
                <td
                  key={`high-${d.yearLabel}`}
                  className="px-4 py-2.5 text-right font-mono text-text-secondary"
                >
                  {d.isActual ? '—' : metric.format(d.high)}
                </td>
              ))}
            </tr>
            <tr className="border-b border-border hover:bg-surface-hover">
              <td className="sticky left-0 bg-surface px-4 py-2.5 font-medium text-foreground">Low</td>
              {chartData.map((d) => (
                <td
                  key={`low-${d.yearLabel}`}
                  className="px-4 py-2.5 text-right font-mono text-text-secondary"
                >
                  {d.isActual ? '—' : metric.format(d.low)}
                </td>
              ))}
            </tr>
            <tr className="hover:bg-surface-hover">
              <td className="sticky left-0 bg-surface px-4 py-2.5 font-medium text-foreground"># of Analysts</td>
              {chartData.map((d) => (
                <td
                  key={`analysts-${d.yearLabel}`}
                  className="px-4 py-2.5 text-right font-mono text-text-secondary"
                >
                  {d.analysts != null ? formatNumber(d.analysts) : '—'}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}

// =======================
// Price Targets View
// =======================

interface PriceTargetsViewProps {
  consensus: FMPPriceTargetConsensus | null;
  summary: FMPPriceTargetSummary | null;
  targets: FMPPriceTarget[];
  currentPrice: number | null;
}

function formatTargetPrice(v: number | null): string {
  if (v == null) return 'N/A';
  return `$${v.toFixed(2)}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// Compute a centered rolling average over a series of points
function computeRollingAverage(
  values: (number | null)[],
  window: number,
): (number | null)[] {
  const result: (number | null)[] = [];
  for (let i = 0; i < values.length; i++) {
    const half = Math.floor(window / 2);
    const start = Math.max(0, i - half);
    const end = Math.min(values.length, i + half + 1);
    const slice = values.slice(start, end).filter((v): v is number => v != null);
    if (slice.length === 0) {
      result.push(null);
    } else {
      result.push(slice.reduce((a, b) => a + b, 0) / slice.length);
    }
  }
  return result;
}

function PriceTargetsView({ consensus, summary, targets, currentPrice }: PriceTargetsViewProps) {
  // Calculate upside vs current price
  const consensusUpside =
    consensus?.targetConsensus != null && currentPrice != null && currentPrice > 0
      ? ((consensus.targetConsensus - currentPrice) / currentPrice) * 100
      : null;

  // Build chronological history chart data (oldest -> newest, with rolling average)
  const historyChartData = useMemo(() => {
    if (targets.length === 0) return [];
    const sorted = [...targets].sort(
      (a, b) => new Date(a.publishedDate).getTime() - new Date(b.publishedDate).getTime(),
    );
    const targetValues = sorted.map((t) => t.priceTarget);
    const window = Math.min(10, Math.max(3, Math.floor(sorted.length / 8)));
    const rolling = computeRollingAverage(targetValues, window);
    return sorted.map((t, i) => ({
      date: t.publishedDate,
      target: t.priceTarget,
      rolling: rolling[i],
      analyst: t.analystName,
      firm: t.analystCompany,
      priceWhenPosted: t.priceWhenPosted,
    }));
  }, [targets]);

  // Stat card data — honest, no fake timeline
  const statCards = summary
    ? [
        { label: 'Last Month', avg: summary.lastMonthAvgPriceTarget, count: summary.lastMonth },
        { label: 'Last Quarter', avg: summary.lastQuarterAvgPriceTarget, count: summary.lastQuarter },
        { label: 'Last Year', avg: summary.lastYearAvgPriceTarget, count: summary.lastYear },
        { label: 'All Time', avg: summary.allTimeAvgPriceTarget, count: summary.allTime },
      ]
    : [];

  // Most recent calls table — capped at 25
  const recentTargets = useMemo(() => {
    return [...targets]
      .sort((a, b) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime())
      .slice(0, 25);
  }, [targets]);

  if (!consensus && !summary && targets.length === 0) {
    return (
      <Card className="bg-surface border-border p-12 text-center">
        <p className="text-text-muted">No price target data available for this company.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Consensus Card */}
      {consensus && (
        <Card className="bg-surface border-border p-6">
          <h3 className="mb-4 text-base font-semibold text-foreground">Analyst Price Target Consensus</h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <p className="text-xs text-text-muted">Current Price</p>
              <p className="mt-1 font-mono text-2xl font-semibold text-foreground">
                {currentPrice != null ? formatCurrency(currentPrice) : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-xs text-text-muted">Consensus</p>
              <p className="mt-1 font-mono text-2xl font-semibold text-primary">
                {formatTargetPrice(consensus.targetConsensus)}
              </p>
              {consensusUpside != null && (
                <p className={`mt-1 text-xs font-medium ${consensusUpside >= 0 ? 'text-positive' : 'text-negative'}`}>
                  {consensusUpside >= 0 ? '+' : ''}{consensusUpside.toFixed(1)}% upside
                </p>
              )}
            </div>
            <div>
              <p className="text-xs text-text-muted">High</p>
              <p className="mt-1 font-mono text-2xl font-semibold text-positive">
                {formatTargetPrice(consensus.targetHigh)}
              </p>
            </div>
            <div>
              <p className="text-xs text-text-muted">Low</p>
              <p className="mt-1 font-mono text-2xl font-semibold text-negative">
                {formatTargetPrice(consensus.targetLow)}
              </p>
            </div>
          </div>
          {consensus.targetMedian != null && (
            <div className="mt-4 border-t border-border pt-3 text-xs text-text-muted">
              Median target: <span className="font-mono text-text-secondary">{formatTargetPrice(consensus.targetMedian)}</span>
            </div>
          )}
        </Card>
      )}

      {/* Time-windowed Average Stat Cards (replaces the misleading line chart) */}
      {statCards.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-medium text-text-secondary">Average Target by Time Window</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {statCards.map((stat) => (
              <Card key={stat.label} className="bg-surface border-border p-4">
                <p className="text-xs text-text-muted">{stat.label}</p>
                <p className={`mt-1 font-mono text-xl font-semibold ${stat.avg != null ? 'text-foreground' : 'text-text-muted'}`}>
                  {stat.avg != null ? formatTargetPrice(stat.avg) : '—'}
                </p>
                <p className="mt-1 text-xs text-text-muted">
                  {stat.count != null && stat.count > 0
                    ? `${stat.count} analyst${stat.count === 1 ? '' : 's'}`
                    : 'No coverage'}
                </p>
              </Card>
            ))}
          </div>
          <p className="mt-2 text-xs text-text-muted italic">
            Each window is independent — they overlap and aggregate the same underlying calls.
          </p>
        </div>
      )}

      {/* Real chronological history chart */}
      {historyChartData.length > 0 && (
        <Card className="bg-surface border-border p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-foreground">Analyst Price Target History</h3>
            <span className="text-xs text-text-muted">{historyChartData.length} calls</span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={historyChartData} margin={{ top: 10, right: 20, bottom: 5, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: string) => {
                    const d = new Date(v);
                    return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
                  }}
                  minTickGap={40}
                />
                <YAxis
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: number) => `$${v.toFixed(0)}`}
                  width={60}
                  domain={['auto', 'auto']}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || payload.length === 0) return null;
                    const data = payload[0]?.payload as
                      | {
                          date: string;
                          target: number | null;
                          analyst: string | null;
                          firm: string | null;
                          priceWhenPosted: number | null;
                        }
                      | undefined;
                    if (!data) return null;
                    return (
                      <div className="rounded-lg border border-border bg-card p-3 text-xs shadow-xl">
                        <div className="mb-1 font-semibold text-foreground">
                          {new Date(data.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </div>
                        {data.analyst && (
                          <div className="text-text-secondary">{data.analyst}</div>
                        )}
                        {data.firm && <div className="text-text-muted">{data.firm}</div>}
                        <div className="mt-1 flex justify-between gap-4 border-t border-border pt-1">
                          <span className="text-text-muted">Target</span>
                          <span className="font-mono text-foreground">{formatTargetPrice(data.target)}</span>
                        </div>
                        {data.priceWhenPosted != null && (
                          <div className="flex justify-between gap-4">
                            <span className="text-text-muted">Price then</span>
                            <span className="font-mono text-text-secondary">{formatTargetPrice(data.priceWhenPosted)}</span>
                          </div>
                        )}
                      </div>
                    );
                  }}
                />
                {currentPrice != null && (
                  <ReferenceLine
                    y={currentPrice}
                    stroke="#94a3b8"
                    strokeDasharray="4 4"
                    strokeWidth={1}
                    label={{
                      value: `Current $${currentPrice.toFixed(2)}`,
                      fill: '#94a3b8',
                      fontSize: 10,
                      position: 'insideTopRight',
                    }}
                  />
                )}
                {/* Individual analyst calls — dots only, no line */}
                <Line
                  type="monotone"
                  dataKey="target"
                  stroke="transparent"
                  dot={{ fill: '#3b82f6', r: 3, strokeWidth: 0, fillOpacity: 0.6 }}
                  isAnimationActive={false}
                />
                {/* Smoothed rolling average */}
                <Line
                  type="monotone"
                  dataKey="rolling"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                  isAnimationActive={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-4 text-xs text-text-muted">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary opacity-60" />
              <span>Individual analyst call</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-0.5 w-6 bg-primary" />
              <span>Rolling average</span>
            </div>
          </div>
        </Card>
      )}

      {/* Recent Analyst Activity Table — capped at 25 */}
      {recentTargets.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-medium text-text-secondary">
            Recent Analyst Activity{' '}
            <span className="text-text-muted font-normal">
              (showing {recentTargets.length} of {targets.length})
            </span>
          </h3>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-background">
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted">Analyst / Firm</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-text-muted">Target</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-text-muted">Price Then</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted">Source</th>
                </tr>
              </thead>
              <tbody>
                {recentTargets.map((t, i) => {
                  const upside =
                    t.priceTarget != null && t.priceWhenPosted != null && t.priceWhenPosted > 0
                      ? ((t.priceTarget - t.priceWhenPosted) / t.priceWhenPosted) * 100
                      : null;
                  return (
                    <tr key={`${t.publishedDate}-${i}`} className="border-b border-border hover:bg-surface-hover">
                      <td className="px-4 py-2.5 text-text-secondary whitespace-nowrap">
                        {formatDate(t.publishedDate)}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="text-foreground font-medium">{t.analystName ?? 'Unknown'}</div>
                        {t.analystCompany && (
                          <div className="text-xs text-text-muted">{t.analystCompany}</div>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <div className="font-mono text-foreground font-semibold">{formatTargetPrice(t.priceTarget)}</div>
                        {upside != null && (
                          <div className={`text-xs font-medium ${upside >= 0 ? 'text-positive' : 'text-negative'}`}>
                            {upside >= 0 ? '+' : ''}{upside.toFixed(1)}%
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-text-secondary">
                        {formatTargetPrice(t.priceWhenPosted)}
                      </td>
                      <td className="px-4 py-2.5">
                        <a
                          href={t.newsURL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline inline-flex items-center gap-1 text-xs"
                        >
                          {t.newsPublisher}
                          <Badge variant="secondary" className="text-[10px]">view</Badge>
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
