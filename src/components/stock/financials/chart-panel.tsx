'use client';

import { useMemo, useRef, useCallback, useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LabelList,
} from 'recharts';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { CHART_COLORS } from '@/lib/utils/chart-helpers';
import { formatInUnit, type DataUnit } from '@/lib/utils/format';
import { MetricLegend } from './metric-legend';
import { toPng } from 'html-to-image';
import type { FinancialRecord } from '@/lib/fmp/types';

interface ChartPanelProps {
  data: FinancialRecord[];
  selectedMetrics: Map<string, { chartType: 'bar' | 'line' }>;
  metricLabels: Record<string, string>;
  activePeriod: 'annual' | 'quarter';
  activeUnit: DataUnit;
  onChartTypeChange: (key: string, type: 'bar' | 'line') => void;
  onRemove: (key: string) => void;
}

function getPeriodLabel(item: FinancialRecord): string {
  const year = item.calendarYear;
  const period = item.period;
  if (period && period !== 'FY') return `${period} ${year}`;
  return year || item.date?.split('-')[0] || '';
}

export function ChartPanel({
  data,
  selectedMetrics,
  metricLabels,
  activePeriod,
  activeUnit,
  onChartTypeChange,
  onRemove,
}: ChartPanelProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const entries = Array.from(selectedMetrics.entries());

  // Full chronological data: oldest first, newest last
  const fullChartData = useMemo(() => {
    return [...data].reverse().map((d) => {
      const point: Record<string, unknown> = { period: getPeriodLabel(d) };
      entries.forEach(([key]) => {
        point[key] = d[key] ?? null;
      });
      return point;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, selectedMetrics]);

  // Range selection: [startIndex, endIndex] into fullChartData
  // Defaults to the full range when data or length changes
  const maxIdx = Math.max(0, fullChartData.length - 1);
  const [range, setRange] = useState<[number, number]>([0, maxIdx]);

  // Reset range when the data length changes (period or limit toggle)
  useEffect(() => {
    setRange([0, maxIdx]);
  }, [maxIdx]);

  const [startIdx, endIdx] = range;
  const visibleChartData = useMemo(
    () => fullChartData.slice(startIdx, endIdx + 1),
    [fullChartData, startIdx, endIdx],
  );

  // Build metric data arrays for CAGR calculation (based on visible range)
  const metricData = useMemo(() => {
    const result: Record<string, number[]> = {};
    entries.forEach(([key]) => {
      result[key] = visibleChartData
        .map((d) => d[key] as number)
        .filter((v) => v != null);
    });
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleChartData, selectedMetrics]);

  const years = visibleChartData.length > 1 ? visibleChartData.length - 1 : 0;

  const handleDownload = useCallback(async () => {
    if (!chartRef.current) return;
    try {
      const dataUrl = await toPng(chartRef.current, { backgroundColor: '#111827' });
      const link = document.createElement('a');
      link.download = 'financial-chart.png';
      link.href = dataUrl;
      link.click();
    } catch {
      // Silently fail
    }
  }, []);

  if (entries.length === 0) {
    return (
      <Card className="bg-surface border-border p-8 text-center">
        <div className="text-text-muted">
          <svg className="mx-auto h-10 w-10 mb-3 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="12" width="4" height="9" rx="1" />
            <rect x="10" y="7" width="4" height="14" rx="1" />
            <rect x="17" y="3" width="4" height="18" rx="1" />
          </svg>
          <p className="text-sm">Select metrics from the table below to visualize them</p>
        </div>
      </Card>
    );
  }

  const startLabel = fullChartData[startIdx]?.period as string | undefined;
  const endLabel = fullChartData[endIdx]?.period as string | undefined;
  const isFullRange = startIdx === 0 && endIdx === maxIdx;

  return (
    <Card className="bg-surface border-border p-4">
      {/* Header: range info + download */}
      <div className="flex items-center justify-between mb-2 text-xs">
        <div className="text-text-muted">
          {startLabel && endLabel && (
            <>
              Showing <span className="text-text-secondary">{startLabel} – {endLabel}</span>
              {!isFullRange && (
                <span className="text-text-muted ml-2">
                  ({visibleChartData.length} of {fullChartData.length} periods)
                </span>
              )}
            </>
          )}
        </div>
        <button
          onClick={handleDownload}
          className="rounded-md bg-positive/10 text-positive px-3 py-1.5 text-xs font-medium hover:bg-positive/20 transition-colors flex items-center gap-1.5"
        >
          Download
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M6 1v7M3 6l3 3 3-3M2 10h8" />
          </svg>
        </button>
      </div>

      {/* Chart */}
      <div ref={chartRef} className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={visibleChartData} margin={{ top: 20, right: 10, bottom: 5, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              dataKey="period"
              tick={{ fill: '#64748b', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fill: '#64748b', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => formatInUnit(v, activeUnit, false, false)}
              width={70}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#111827',
                border: '1px solid #1e293b',
                borderRadius: '8px',
                color: '#f1f5f9',
                fontSize: '12px',
              }}
              formatter={(value: unknown, name: unknown) => [
                formatInUnit(typeof value === 'number' ? value : null, activeUnit, true, false),
                typeof name === 'string' ? (metricLabels[name] || name) : String(name),
              ]}
            />
            {entries.map(([key, { chartType }], index) => {
              const color = CHART_COLORS[index % CHART_COLORS.length];
              if (chartType === 'line') {
                return (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={color}
                    strokeWidth={2}
                    dot={{ fill: color, r: 3 }}
                    connectNulls
                  />
                );
              }
              return (
                <Bar key={key} dataKey={key} fill={color} radius={[3, 3, 0, 0]} maxBarSize={40}>
                  <LabelList
                    dataKey={key}
                    position="top"
                    formatter={(v: unknown) => formatInUnit(typeof v === 'number' ? v : null, activeUnit, false, false)}
                    style={{ fill: '#94a3b8', fontSize: 10 }}
                  />
                </Bar>
              );
            })}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Range slider */}
      {fullChartData.length > 2 && (
        <div className="mt-4 pt-3 border-t border-border">
          <div className="flex items-center justify-between mb-2 text-[11px] text-text-muted">
            <span>{fullChartData[0]?.period as string}</span>
            <span className="text-text-secondary">Drag handles to focus on a date range</span>
            <span>{fullChartData[maxIdx]?.period as string}</span>
          </div>
          <Slider
            min={0}
            max={maxIdx}
            step={1}
            value={range}
            onValueChange={(v) => {
              const arr = Array.isArray(v) ? v : [v];
              if (arr.length >= 2) {
                setRange([arr[0], arr[1]]);
              }
            }}
            className="w-full"
          />
          {!isFullRange && (
            <div className="mt-2 flex justify-center">
              <button
                onClick={() => setRange([0, maxIdx])}
                className="text-[11px] text-text-muted hover:text-foreground transition-colors"
              >
                Reset range
              </button>
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <MetricLegend
        selectedMetrics={selectedMetrics}
        metricLabels={metricLabels}
        metricData={metricData}
        years={years}
        activePeriod={activePeriod}
        activeUnit={activeUnit}
        onChartTypeChange={onChartTypeChange}
        onRemove={onRemove}
      />
    </Card>
  );
}
