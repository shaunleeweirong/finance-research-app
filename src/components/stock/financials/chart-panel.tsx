'use client';

import { useMemo, useRef, useCallback } from 'react';
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
import { CHART_COLORS } from '@/lib/utils/chart-helpers';
import { formatCompactNumber } from '@/lib/utils/format';
import { MetricLegend } from './metric-legend';
import { toPng } from 'html-to-image';
import type { FinancialRecord } from '@/lib/fmp/types';

interface ChartPanelProps {
  data: FinancialRecord[];
  selectedMetrics: Map<string, { chartType: 'bar' | 'line' }>;
  metricLabels: Record<string, string>;
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
  onChartTypeChange,
  onRemove,
}: ChartPanelProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const entries = Array.from(selectedMetrics.entries());

  // Transform data for chart (reverse so oldest is first = left side of chart)
  const chartData = useMemo(() => {
    return [...data].reverse().map((d) => {
      const point: Record<string, unknown> = { period: getPeriodLabel(d) };
      entries.forEach(([key]) => {
        point[key] = d[key] ?? null;
      });
      return point;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, selectedMetrics]);

  // Build metric data arrays for CAGR calculation
  const metricData = useMemo(() => {
    const result: Record<string, number[]> = {};
    entries.forEach(([key]) => {
      result[key] = chartData
        .map((d) => d[key] as number)
        .filter((v) => v != null);
    });
    return result;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chartData, selectedMetrics]);

  const years = chartData.length > 1 ? chartData.length - 1 : 0;

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

  return (
    <Card className="bg-surface border-border p-4">
      {/* Download button */}
      <div className="flex justify-end mb-2">
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
          <ComposedChart data={chartData} margin={{ top: 20, right: 10, bottom: 5, left: 10 }}>
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
              tickFormatter={(v: number) => formatCompactNumber(v)}
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
                formatCompactNumber(typeof value === 'number' ? value : null),
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
                    formatter={(v: unknown) => formatCompactNumber(typeof v === 'number' ? v : null)}
                    style={{ fill: '#94a3b8', fontSize: 10 }}
                  />
                </Bar>
              );
            })}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <MetricLegend
        selectedMetrics={selectedMetrics}
        metricLabels={metricLabels}
        metricData={metricData}
        years={years}
        onChartTypeChange={onChartTypeChange}
        onRemove={onRemove}
      />
    </Card>
  );
}
