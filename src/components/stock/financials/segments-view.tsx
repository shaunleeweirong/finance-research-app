'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
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

// Color indexing uses the ORIGINAL segment ordering so a segment keeps
// its color even when some are toggled off.
function SegmentSelector({
  allSegmentKeys,
  selectedKeys,
  latestYear,
  activeUnit,
  onToggle,
  onSelectAll,
  onClear,
}: {
  allSegmentKeys: string[];
  selectedKeys: Set<string>;
  latestYear: SegmentPeriod;
  activeUnit: DataUnit;
  onToggle: (key: string) => void;
  onSelectAll: () => void;
  onClear: () => void;
}) {
  const total = allSegmentKeys.reduce((sum, k) => sum + (latestYear.segments[k] ?? 0), 0);
  const selectedCount = selectedKeys.size;

  return (
    <Card className="bg-surface border-border p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-text-secondary">
          Segments — {latestYear.year}
        </h4>
        <div className="flex gap-1 text-[11px]">
          <button
            onClick={onSelectAll}
            disabled={selectedCount === allSegmentKeys.length}
            className="rounded px-2 py-1 text-text-secondary hover:bg-surface-hover hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Select all
          </button>
          <button
            onClick={onClear}
            disabled={selectedCount === 0}
            className="rounded px-2 py-1 text-text-secondary hover:bg-surface-hover hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Clear
          </button>
        </div>
      </div>
      <div className="space-y-1.5">
        {allSegmentKeys.map((key, i) => {
          const value = latestYear.segments[key] ?? 0;
          const percent = total > 0 ? (value / total) * 100 : 0;
          const isSelected = selectedKeys.has(key);
          const color = CHART_COLORS[i % CHART_COLORS.length];
          return (
            <label
              key={key}
              className={`flex items-center gap-3 rounded-md px-2 py-1.5 cursor-pointer transition-colors ${
                isSelected ? 'hover:bg-surface-hover' : 'opacity-50 hover:opacity-80 hover:bg-surface-hover'
              }`}
            >
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => onToggle(key)}
                className="shrink-0"
              />
              <div
                className="h-2.5 w-2.5 rounded-sm shrink-0"
                style={{ backgroundColor: color }}
              />
              <span className="flex-1 truncate text-xs text-foreground">{key}</span>
              <span className="text-xs font-mono text-text-secondary tabular-nums">
                {formatInUnit(value, activeUnit, true, false)}
              </span>
              <span className="text-xs font-mono text-text-muted tabular-nums w-12 text-right">
                {percent.toFixed(1)}%
              </span>
            </label>
          );
        })}
      </div>
    </Card>
  );
}

function StackedBarChart({
  chartData,
  allSegmentKeys,
  visibleKeys,
  activeUnit,
  yearRange,
  onYearRangeChange,
}: {
  chartData: ChartRow[];
  allSegmentKeys: string[];
  visibleKeys: string[];
  activeUnit: DataUnit;
  yearRange: [number, number];
  onYearRangeChange: (range: [number, number]) => void;
}) {
  // Color map: segments keep their color even if some are hidden
  const colorByKey = useMemo(() => {
    const map: Record<string, string> = {};
    allSegmentKeys.forEach((key, i) => {
      map[key] = CHART_COLORS[i % CHART_COLORS.length];
    });
    return map;
  }, [allSegmentKeys]);

  const [startIdx, endIdx] = yearRange;
  const visibleChartData = chartData.slice(startIdx, endIdx + 1);
  const maxIdx = Math.max(0, chartData.length - 1);
  const isFullRange = startIdx === 0 && endIdx === maxIdx;
  const startLabel = chartData[startIdx]?.year;
  const endLabel = chartData[endIdx]?.year;

  return (
    <Card className="bg-surface border-border p-4 h-full">
      <div className="mb-3 flex items-baseline justify-between flex-wrap gap-2">
        <h4 className="text-sm font-medium text-text-secondary">
          Historical Mix
          {visibleKeys.length < allSegmentKeys.length && visibleKeys.length > 0 && (
            <span className="ml-2 text-xs text-text-muted font-normal">
              (showing {visibleKeys.length} of {allSegmentKeys.length} segments)
            </span>
          )}
        </h4>
        {startLabel && endLabel && (
          <span className="text-xs text-text-muted">
            {startLabel} – {endLabel}
          </span>
        )}
      </div>
      <div className="h-96">
        {visibleKeys.length === 0 ? (
          <div className="flex h-full items-center justify-center text-text-muted text-sm">
            Select at least one segment to visualize
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={visibleChartData} margin={{ top: 10, right: 10, bottom: 5, left: 10 }}>
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
                  const total = payload.reduce(
                    (sum, p) => sum + (typeof p.value === 'number' ? p.value : 0),
                    0,
                  );
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
                                <div
                                  className="h-2 w-2 rounded-sm"
                                  style={{ backgroundColor: p.color }}
                                />
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
              {visibleKeys.map((key, i) => (
                <Bar
                  key={key}
                  dataKey={key}
                  stackId="segments"
                  fill={colorByKey[key]}
                  radius={i === visibleKeys.length - 1 ? [3, 3, 0, 0] : 0}
                  isAnimationActive={false}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Year range slider */}
      {chartData.length > 2 && visibleKeys.length > 0 && (
        <div className="mt-4 pt-3 border-t border-border">
          <div className="flex items-center justify-between mb-2 text-[11px] text-text-muted">
            <span>{chartData[0]?.year}</span>
            <span className="text-text-secondary">Drag to adjust year range</span>
            <span>{chartData[maxIdx]?.year}</span>
          </div>
          <Slider
            min={0}
            max={maxIdx}
            step={1}
            value={yearRange}
            onValueChange={(v) => {
              const arr = Array.isArray(v) ? v : [v];
              if (arr.length >= 2) {
                onYearRangeChange([arr[0], arr[1]]);
              }
            }}
            className="w-full"
          />
          {!isFullRange && (
            <div className="mt-2 flex justify-center">
              <button
                onClick={() => onYearRangeChange([0, maxIdx])}
                className="text-[11px] text-text-muted hover:text-foreground transition-colors"
              >
                Reset range
              </button>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

function SegmentsTable({
  chartData,
  segmentKeys,
  visibleKeys,
  activeUnit,
}: {
  chartData: ChartRow[];
  segmentKeys: string[]; // original ordering for color indexing
  visibleKeys: string[]; // filtered by user selection
  activeUnit: DataUnit;
}) {
  // Calculate YoY growth for each segment (latest vs previous year)
  const latest = chartData[chartData.length - 1];
  const previous = chartData[chartData.length - 2];

  // Compute totals across only visible segments
  const visibleTotal = (row: ChartRow): number =>
    visibleKeys.reduce((sum, k) => sum + Number(row[k] ?? 0), 0);

  const latestVisibleTotal = latest ? visibleTotal(latest) : 0;
  const prevVisibleTotal = previous ? visibleTotal(previous) : 0;

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
          {visibleKeys.map((key) => {
            const originalIdx = segmentKeys.indexOf(key);
            const latestVal = latest ? Number(latest[key] ?? 0) : 0;
            const prevVal = previous ? Number(previous[key] ?? 0) : 0;
            const yoy = prevVal > 0 ? ((latestVal - prevVal) / prevVal) * 100 : null;

            return (
              <tr key={key} className="border-b border-border hover:bg-surface-hover">
                <td className="sticky left-0 bg-surface px-4 py-2.5 min-w-[200px]">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-2.5 w-2.5 rounded-sm shrink-0"
                      style={{ backgroundColor: CHART_COLORS[originalIdx % CHART_COLORS.length] }}
                    />
                    <span className="text-foreground font-medium">{key}</span>
                  </div>
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
          {/* Total row — only across visible segments */}
          {visibleKeys.length > 0 && (
            <tr className="border-b border-border bg-background/30">
              <td className="sticky left-0 bg-background/80 px-4 py-2.5 font-semibold text-foreground">
                {visibleKeys.length === segmentKeys.length ? 'Total' : 'Selected Total'}
              </td>
              {[...chartData].reverse().map((row) => (
                <td
                  key={`total-${row.year}`}
                  className="px-4 py-2.5 text-right font-mono font-semibold text-foreground"
                >
                  {formatInUnit(visibleTotal(row), activeUnit, true, false)}
                </td>
              ))}
              {previous && latest && (
                <td
                  className={`px-4 py-2.5 text-right font-mono font-semibold ${
                    prevVisibleTotal > 0
                      ? (latestVisibleTotal - prevVisibleTotal) / prevVisibleTotal >= 0
                        ? 'text-positive'
                        : 'text-negative'
                      : 'text-text-muted'
                  }`}
                >
                  {prevVisibleTotal > 0
                    ? `${((latestVisibleTotal - prevVisibleTotal) / prevVisibleTotal) * 100 >= 0 ? '+' : ''}${(
                        ((latestVisibleTotal - prevVisibleTotal) / prevVisibleTotal) *
                        100
                      ).toFixed(1)}%`
                    : '—'}
                </td>
              )}
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export function SegmentsView({ productData, geographicData, activeUnit }: SegmentsViewProps) {
  const [activeType, setActiveType] = useState<SegmentationType>('product');
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [yearRange, setYearRange] = useState<[number, number]>([0, 0]);

  const hasProductData = productData.length > 0;
  const hasGeoData = geographicData.length > 0;

  // Auto-select whichever type has data
  const effectiveType =
    activeType === 'product' && !hasProductData && hasGeoData ? 'geographic' : activeType;

  const currentData = effectiveType === 'product' ? productData : geographicData;
  const { chartData, segmentKeys, latestYear } = useMemo(
    () => prepareData(currentData),
    [currentData],
  );

  // Initialize selection to all segments whenever the data changes (segmentation type, etc.)
  useEffect(() => {
    setSelectedKeys(new Set(segmentKeys));
  }, [segmentKeys]);

  // Reset year range to full when data length changes (switching Product/Geographic)
  useEffect(() => {
    const maxIdx = Math.max(0, chartData.length - 1);
    setYearRange([0, maxIdx]);
  }, [chartData.length]);

  // Filter chart and table data based on selection, keep original ordering for colors
  const visibleSegmentKeys = useMemo(
    () => segmentKeys.filter((k) => selectedKeys.has(k)),
    [segmentKeys, selectedKeys],
  );

  function handleToggle(key: string) {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function handleSelectAll() {
    setSelectedKeys(new Set(segmentKeys));
  }

  function handleClear() {
    setSelectedKeys(new Set());
  }

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
          {/* Selector + Chart layout */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(280px,340px)_1fr]">
            {latestYear && (
              <SegmentSelector
                allSegmentKeys={segmentKeys}
                selectedKeys={selectedKeys}
                latestYear={latestYear}
                activeUnit={activeUnit}
                onToggle={handleToggle}
                onSelectAll={handleSelectAll}
                onClear={handleClear}
              />
            )}
            <StackedBarChart
              chartData={chartData}
              allSegmentKeys={segmentKeys}
              visibleKeys={visibleSegmentKeys}
              activeUnit={activeUnit}
              yearRange={yearRange}
              onYearRangeChange={setYearRange}
            />
          </div>

          {/* Data table — shows only selected segments within selected year range */}
          <SegmentsTable
            chartData={chartData.slice(yearRange[0], yearRange[1] + 1)}
            segmentKeys={segmentKeys}
            visibleKeys={visibleSegmentKeys}
            activeUnit={activeUnit}
          />
        </>
      )}
    </div>
  );
}
