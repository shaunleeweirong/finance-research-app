'use client';

import { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { Card } from '@/components/ui/card';
import { CHART_COLORS } from '@/lib/utils/chart-helpers';
import { formatInUnit, type DataUnit } from '@/lib/utils/format';
import type { SegmentPeriod } from '@/lib/fmp/types';

type SegmentationType = 'product' | 'geographic';

interface SegmentsViewProps {
  productData: SegmentPeriod[];
  geographicData: SegmentPeriod[];
  activeUnit: DataUnit;
}

interface ChartRow {
  year: string;
  total: number;
  [segmentKey: string]: string | number;
}

function prepareData(data: SegmentPeriod[]): {
  chartData: ChartRow[];
  segmentKeys: string[];
  latestYear: SegmentPeriod | null;
} {
  if (data.length === 0) return { chartData: [], segmentKeys: [], latestYear: null };

  // Sort oldest to newest
  const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date));
  const latest = sorted[sorted.length - 1];

  // Collect all segment names across years so bars align
  const allKeys = new Set<string>();
  sorted.forEach((period) => {
    Object.keys(period.segments).forEach((k) => allKeys.add(k));
  });

  // Sort segment keys by latest year's value (descending) so biggest segments are on top of stack
  const segmentKeys = Array.from(allKeys).sort((a, b) => {
    const aVal = latest.segments[a] ?? 0;
    const bVal = latest.segments[b] ?? 0;
    return bVal - aVal;
  });

  const chartData: ChartRow[] = sorted.map((period) => {
    const row: ChartRow = { year: period.year, total: 0 };
    let total = 0;
    segmentKeys.forEach((key) => {
      const value = period.segments[key] ?? 0;
      row[key] = value;
      total += value;
    });
    row.total = total;
    return row;
  });

  return { chartData, segmentKeys, latestYear: latest };
}

function DonutChart({
  latestYear,
  segmentKeys,
  activeUnit,
}: {
  latestYear: SegmentPeriod;
  segmentKeys: string[];
  activeUnit: DataUnit;
}) {
  const total = segmentKeys.reduce((sum, k) => sum + (latestYear.segments[k] ?? 0), 0);
  const pieData = segmentKeys
    .map((key) => ({
      name: key,
      value: latestYear.segments[key] ?? 0,
      percent: total > 0 ? ((latestYear.segments[key] ?? 0) / total) * 100 : 0,
    }))
    .filter((d) => d.value > 0);

  return (
    <div>
      <h4 className="mb-2 text-sm font-medium text-text-secondary">
        {latestYear.year} Breakdown
      </h4>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={95}
              paddingAngle={2}
              isAnimationActive={false}
              label={({ percent }: { percent?: number }) =>
                percent != null && percent >= 5 ? `${percent.toFixed(0)}%` : ''
              }
              labelLine={false}
            >
              {pieData.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={CHART_COLORS[index % CHART_COLORS.length]}
                  stroke="#0a0f1a"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || payload.length === 0) return null;
                const data = payload[0]?.payload as { name: string; value: number; percent: number } | undefined;
                if (!data) return null;
                return (
                  <div className="rounded-lg border border-border bg-card p-3 text-xs shadow-xl">
                    <div className="font-semibold text-foreground">{data.name}</div>
                    <div className="mt-1 font-mono text-foreground">{formatInUnit(data.value, activeUnit, true, false)}</div>
                    <div className="text-text-muted">{data.percent.toFixed(1)}% of total</div>
                  </div>
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      {/* Legend */}
      <div className="mt-3 space-y-1.5">
        {pieData.map((d, i) => (
          <div key={d.name} className="flex items-center gap-2 text-xs">
            <div
              className="h-2.5 w-2.5 rounded-sm shrink-0"
              style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
            />
            <span className="flex-1 truncate text-text-secondary">{d.name}</span>
            <span className="font-mono text-foreground">{d.percent.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StackedBarChart({
  chartData,
  segmentKeys,
  activeUnit,
}: {
  chartData: ChartRow[];
  segmentKeys: string[];
  activeUnit: DataUnit;
}) {
  return (
    <div>
      <h4 className="mb-2 text-sm font-medium text-text-secondary">Historical Mix</h4>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, bottom: 5, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              dataKey="year"
              tick={{ fill: '#cbd5e1', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fill: '#cbd5e1', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => formatInUnit(v, activeUnit, false, false)}
              width={70}
            />
            <Tooltip
              cursor={{ fill: 'rgba(59, 130, 246, 0.08)' }}
              content={({ active, payload, label }) => {
                if (!active || !payload || payload.length === 0) return null;
                const total = payload.reduce((sum, p) => sum + (typeof p.value === 'number' ? p.value : 0), 0);
                return (
                  <div className="rounded-lg border border-border bg-card p-3 text-xs shadow-xl">
                    <div className="mb-2 font-semibold text-foreground">{label}</div>
                    <div className="space-y-0.5">
                      {payload.map((p) => {
                        const val = typeof p.value === 'number' ? p.value : 0;
                        const pct = total > 0 ? (val / total) * 100 : 0;
                        return (
                          <div key={p.dataKey as string} className="flex justify-between gap-4">
                            <span className="flex items-center gap-1.5">
                              <div className="h-2 w-2 rounded-sm" style={{ backgroundColor: p.color }} />
                              <span className="text-text-secondary">{p.name as string}</span>
                            </span>
                            <span className="font-mono text-foreground">
                              {formatInUnit(val, activeUnit, true, false)}{' '}
                              <span className="text-text-muted">({pct.toFixed(0)}%)</span>
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-2 border-t border-border pt-1 flex justify-between gap-4">
                      <span className="text-text-muted">Total</span>
                      <span className="font-mono text-foreground">
                        {formatInUnit(total, activeUnit, true, false)}
                      </span>
                    </div>
                  </div>
                );
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: '11px' }}
              iconSize={10}
              iconType="square"
            />
            {segmentKeys.map((key, i) => (
              <Bar
                key={key}
                dataKey={key}
                stackId="segments"
                fill={CHART_COLORS[i % CHART_COLORS.length]}
                radius={i === segmentKeys.length - 1 ? [3, 3, 0, 0] : 0}
                isAnimationActive={false}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function SegmentsTable({
  chartData,
  segmentKeys,
  activeUnit,
}: {
  chartData: ChartRow[];
  segmentKeys: string[];
  activeUnit: DataUnit;
}) {
  // Calculate YoY growth for each segment (latest vs previous year)
  const latest = chartData[chartData.length - 1];
  const previous = chartData[chartData.length - 2];

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-background">
            <th className="sticky left-0 bg-background px-4 py-3 text-left text-xs font-medium text-text-muted min-w-[200px]">
              Segment
            </th>
            {[...chartData].reverse().map((row) => (
              <th
                key={row.year}
                className="px-4 py-3 text-right text-xs font-medium text-text-muted whitespace-nowrap min-w-[110px]"
              >
                {row.year}
              </th>
            ))}
            {previous && latest && (
              <th className="px-4 py-3 text-right text-xs font-medium text-text-muted whitespace-nowrap min-w-[90px]">
                YoY %
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {segmentKeys.map((key, i) => {
            const latestVal = latest ? Number(latest[key] ?? 0) : 0;
            const prevVal = previous ? Number(previous[key] ?? 0) : 0;
            const yoy = prevVal > 0 ? ((latestVal - prevVal) / prevVal) * 100 : null;

            return (
              <tr key={key} className="border-b border-border hover:bg-surface-hover">
                <td className="sticky left-0 bg-surface px-4 py-2.5 flex items-center gap-2 min-w-[200px]">
                  <div
                    className="h-2.5 w-2.5 rounded-sm shrink-0"
                    style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                  />
                  <span className="text-foreground font-medium">{key}</span>
                </td>
                {[...chartData].reverse().map((row) => (
                  <td
                    key={`${key}-${row.year}`}
                    className="px-4 py-2.5 text-right font-mono text-foreground"
                  >
                    {formatInUnit(Number(row[key] ?? 0), activeUnit, true, false)}
                  </td>
                ))}
                {previous && latest && (
                  <td
                    className={`px-4 py-2.5 text-right font-mono ${
                      yoy != null ? (yoy >= 0 ? 'text-positive' : 'text-negative') : 'text-text-muted'
                    }`}
                  >
                    {yoy != null ? `${yoy >= 0 ? '+' : ''}${yoy.toFixed(1)}%` : '—'}
                  </td>
                )}
              </tr>
            );
          })}
          {/* Total row */}
          <tr className="border-b border-border bg-background/30">
            <td className="sticky left-0 bg-background/80 px-4 py-2.5 font-semibold text-foreground">
              Total
            </td>
            {[...chartData].reverse().map((row) => (
              <td
                key={`total-${row.year}`}
                className="px-4 py-2.5 text-right font-mono font-semibold text-foreground"
              >
                {formatInUnit(row.total, activeUnit, true, false)}
              </td>
            ))}
            {previous && latest && (
              <td
                className={`px-4 py-2.5 text-right font-mono font-semibold ${
                  previous.total > 0
                    ? (latest.total - previous.total) / previous.total >= 0
                      ? 'text-positive'
                      : 'text-negative'
                    : 'text-text-muted'
                }`}
              >
                {previous.total > 0
                  ? `${((latest.total - previous.total) / previous.total) * 100 >= 0 ? '+' : ''}${(((latest.total - previous.total) / previous.total) * 100).toFixed(1)}%`
                  : '—'}
              </td>
            )}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export function SegmentsView({ productData, geographicData, activeUnit }: SegmentsViewProps) {
  const [activeType, setActiveType] = useState<SegmentationType>('product');

  const hasProductData = productData.length > 0;
  const hasGeoData = geographicData.length > 0;

  // Auto-select whichever type has data
  const effectiveType = activeType === 'product' && !hasProductData && hasGeoData ? 'geographic' : activeType;

  const currentData = effectiveType === 'product' ? productData : geographicData;
  const { chartData, segmentKeys, latestYear } = useMemo(() => prepareData(currentData), [currentData]);

  if (!hasProductData && !hasGeoData) {
    return (
      <Card className="bg-surface border-border p-12 text-center">
        <p className="text-text-muted">
          No revenue segmentation data available for this company. This typically
          requires a company to report segment breakdowns in their SEC filings.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Sub-type toggle: Product vs Geographic */}
      <div className="flex flex-col gap-1">
        <span className="text-[10px] uppercase tracking-wider text-text-muted font-medium">
          Segmentation Type
        </span>
        <div className="inline-flex rounded-lg bg-background p-0.5 w-fit">
          <button
            onClick={() => setActiveType('product')}
            disabled={!hasProductData}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              effectiveType === 'product'
                ? 'bg-surface-hover text-foreground'
                : 'text-text-secondary hover:text-foreground'
            } disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            Product
          </button>
          <button
            onClick={() => setActiveType('geographic')}
            disabled={!hasGeoData}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              effectiveType === 'geographic'
                ? 'bg-surface-hover text-foreground'
                : 'text-text-secondary hover:text-foreground'
            } disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            Geographic
          </button>
        </div>
      </div>

      {chartData.length === 0 ? (
        <Card className="bg-surface border-border p-12 text-center">
          <p className="text-text-muted">No {effectiveType} segmentation data for this company.</p>
        </Card>
      ) : (
        <>
          {/* Chart row: Donut + Stacked Bar */}
          <Card className="bg-surface border-border p-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {latestYear && (
                <DonutChart
                  latestYear={latestYear}
                  segmentKeys={segmentKeys}
                  activeUnit={activeUnit}
                />
              )}
              <StackedBarChart
                chartData={chartData}
                segmentKeys={segmentKeys}
                activeUnit={activeUnit}
              />
            </div>
          </Card>

          {/* Data table */}
          <SegmentsTable
            chartData={chartData}
            segmentKeys={segmentKeys}
            activeUnit={activeUnit}
          />
        </>
      )}
    </div>
  );
}
