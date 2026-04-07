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
import { formatLargeNumber, formatCompactNumber, formatNumber } from '@/lib/utils/format';
import type { FMPAnalystEstimate } from '@/lib/fmp/types';

type MetricKey = 'revenue' | 'ebitda' | 'eps';

interface MetricConfig {
  key: MetricKey;
  label: string;
  title: string;
  lowField: keyof FMPAnalystEstimate;
  avgField: keyof FMPAnalystEstimate;
  highField: keyof FMPAnalystEstimate;
  analystField: keyof FMPAnalystEstimate;
  format: (v: number | null) => string;
  yAxisFormatter: (v: number) => string;
}

const METRICS: MetricConfig[] = [
  {
    key: 'revenue',
    label: 'Revenue',
    title: 'Revenue Consensus Analyst Estimates',
    lowField: 'estimatedRevenueLow',
    avgField: 'estimatedRevenueAvg',
    highField: 'estimatedRevenueHigh',
    analystField: 'numberAnalystEstimatedRevenue',
    format: formatLargeNumber,
    yAxisFormatter: (v: number) => formatCompactNumber(v),
  },
  {
    key: 'ebitda',
    label: 'EBITDA',
    title: 'EBITDA Consensus Analyst Estimates',
    lowField: 'estimatedEbitdaLow',
    avgField: 'estimatedEbitdaAvg',
    highField: 'estimatedEbitdaHigh',
    analystField: 'numberAnalystEstimatedRevenue',
    format: formatLargeNumber,
    yAxisFormatter: (v: number) => formatCompactNumber(v),
  },
  {
    key: 'eps',
    label: 'EPS',
    title: 'EPS Consensus Analyst Estimates',
    lowField: 'estimatedEpsLow',
    avgField: 'estimatedEpsAvg',
    highField: 'estimatedEpsHigh',
    analystField: 'numberAnalystsEstimatedEps',
    format: (v: number | null) => (v != null ? `$${v.toFixed(2)}` : 'N/A'),
    yAxisFormatter: (v: number) => `$${v.toFixed(2)}`,
  },
];

interface EstimatesTabProps {
  estimates: FMPAnalystEstimate[];
}

export function EstimatesTab({ estimates }: EstimatesTabProps) {
  const [activeMetric, setActiveMetric] = useState<MetricKey>('revenue');
  const metric = METRICS.find((m) => m.key === activeMetric)!;
  const currentYear = new Date().getFullYear();

  // Build chart data — sort oldest to newest, split into actuals and estimates
  const chartData = useMemo(() => {
    const sorted = [...estimates].reverse(); // FMP returns newest first
    return sorted.map((e) => {
      const year = parseInt(e.date.split('-')[0], 10);
      const isActual = year <= currentYear;
      const low = e[metric.lowField] as number | null;
      const avg = e[metric.avgField] as number | null;
      const high = e[metric.highField] as number | null;
      const analysts = e[metric.analystField] as number | null;

      return {
        year,
        yearLabel: `${year} ${isActual ? '(A)' : '(E)'}`,
        low,
        avg,
        high,
        // Range for the cone (only on estimates side, but we draw on whole chart)
        rangeBase: low,
        rangeHeight: low != null && high != null ? high - low : null,
        // Split avg into two series so we can style them differently
        actualAvg: isActual ? avg : null,
        estimateAvg: isActual ? null : avg,
        analysts,
        isActual,
      };
    });
  }, [estimates, metric, currentYear]);

  // Build connection point: the last actual should also be the first estimate point
  // so the dashed line connects smoothly to the solid line
  const chartDataWithBridge = useMemo(() => {
    const lastActualIdx = chartData.findIndex((d, i) => d.isActual && (i === chartData.length - 1 || !chartData[i + 1].isActual));
    if (lastActualIdx === -1 || lastActualIdx === chartData.length - 1) return chartData;

    return chartData.map((d, i) => {
      if (i === lastActualIdx) {
        return { ...d, estimateAvg: d.actualAvg };
      }
      return d;
    });
  }, [chartData]);

  // Find the boundary year for the reference line
  const boundaryYear = useMemo(() => {
    const lastActual = chartData.filter((d) => d.isActual).pop();
    return lastActual?.yearLabel ?? null;
  }, [chartData]);

  if (estimates.length === 0) {
    return (
      <Card className="bg-surface border-border p-12 text-center">
        <p className="text-text-muted">No analyst estimates available for this company.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Metric Switcher Tabs */}
      <div className="flex flex-wrap gap-1">
        {METRICS.map((m) => (
          <button
            key={m.key}
            onClick={() => setActiveMetric(m.key)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              activeMetric === m.key
                ? 'bg-primary text-primary-foreground'
                : 'text-text-secondary hover:bg-surface-hover hover:text-foreground'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Chart Card */}
      <Card className="bg-surface border-border p-6">
        <h3 className="mb-6 text-center text-base font-semibold text-foreground">
          {metric.title}
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartDataWithBridge} margin={{ top: 10, right: 20, bottom: 5, left: 10 }}>
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
                contentStyle={{
                  backgroundColor: '#111827',
                  border: '1px solid #1e293b',
                  borderRadius: '8px',
                  color: '#f1f5f9',
                  fontSize: '12px',
                  padding: '8px 12px',
                }}
                content={({ active, payload }) => {
                  if (!active || !payload || payload.length === 0) return null;
                  const data = payload[0]?.payload;
                  if (!data) return null;
                  return (
                    <div className="rounded-lg border border-border bg-card p-3 text-xs shadow-xl">
                      <div className="mb-2 font-semibold text-foreground">{data.yearLabel}</div>
                      <div className="space-y-1">
                        <div className="flex justify-between gap-4">
                          <span className="text-text-muted">Average</span>
                          <span className="font-mono text-foreground">{metric.format(data.avg)}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-text-muted">High</span>
                          <span className="font-mono text-positive">{metric.format(data.high)}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-text-muted">Low</span>
                          <span className="font-mono text-negative">{metric.format(data.low)}</span>
                        </div>
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

              {/* Reference line at actuals/estimates boundary */}
              {boundaryYear && (
                <ReferenceLine
                  x={boundaryYear}
                  stroke="#475569"
                  strokeDasharray="3 3"
                  strokeWidth={1}
                />
              )}

              {/* Uncertainty cone — stacked area technique */}
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
              {chartDataWithBridge.map((d) => (
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
            {/* Mean */}
            <tr className="border-b border-border hover:bg-surface-hover">
              <td className="sticky left-0 bg-surface px-4 py-2.5 font-medium text-foreground">Mean</td>
              {chartDataWithBridge.map((d) => (
                <td
                  key={`mean-${d.yearLabel}`}
                  className="px-4 py-2.5 text-right font-mono text-foreground"
                >
                  {metric.format(d.avg)}
                </td>
              ))}
            </tr>
            {/* High */}
            <tr className="border-b border-border hover:bg-surface-hover">
              <td className="sticky left-0 bg-surface px-4 py-2.5 font-medium text-foreground">High</td>
              {chartDataWithBridge.map((d) => (
                <td
                  key={`high-${d.yearLabel}`}
                  className="px-4 py-2.5 text-right font-mono text-text-secondary"
                >
                  {metric.format(d.high)}
                </td>
              ))}
            </tr>
            {/* Low */}
            <tr className="border-b border-border hover:bg-surface-hover">
              <td className="sticky left-0 bg-surface px-4 py-2.5 font-medium text-foreground">Low</td>
              {chartDataWithBridge.map((d) => (
                <td
                  key={`low-${d.yearLabel}`}
                  className="px-4 py-2.5 text-right font-mono text-text-secondary"
                >
                  {metric.format(d.low)}
                </td>
              ))}
            </tr>
            {/* # of Analysts */}
            <tr className="hover:bg-surface-hover">
              <td className="sticky left-0 bg-surface px-4 py-2.5 font-medium text-foreground"># of Analysts</td>
              {chartDataWithBridge.map((d) => (
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
    </div>
  );
}
