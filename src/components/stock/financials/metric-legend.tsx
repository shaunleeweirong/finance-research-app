'use client';

import { CHART_COLORS, calculateCAGR, calculateTotalChange } from '@/lib/utils/chart-helpers';
import { UNIT_LABEL_PLURAL, type DataUnit } from '@/lib/utils/format';

interface MetricLegendProps {
  selectedMetrics: Map<string, { chartType: 'bar' | 'line' }>;
  metricLabels: Record<string, string>;
  metricData: Record<string, number[]>;
  years: number;
  activePeriod: 'annual' | 'quarter';
  activeUnit: DataUnit;
  onChartTypeChange: (key: string, type: 'bar' | 'line') => void;
  onRemove: (key: string) => void;
}

export function MetricLegend({
  selectedMetrics,
  metricLabels,
  metricData,
  years,
  activePeriod,
  activeUnit,
  onChartTypeChange,
  onRemove,
}: MetricLegendProps) {
  const entries = Array.from(selectedMetrics.entries());
  if (entries.length === 0) return null;

  const periodLabel = activePeriod === 'annual' ? 'Annual' : 'Quarterly';
  const magnitudeLabel = UNIT_LABEL_PLURAL[activeUnit];

  return (
    <div className="space-y-2 pt-3">
      {entries.map(([key, { chartType }], index) => {
        const color = CHART_COLORS[index % CHART_COLORS.length];
        const values = metricData[key] || [];
        const first = values[0];
        const last = values[values.length - 1];
        const totalChange = first != null && last != null ? calculateTotalChange(first, last) : null;
        const cagr = first != null && last != null && years > 0 ? calculateCAGR(first, last, years) : null;

        return (
          <div key={key} className="flex items-center gap-2 text-xs flex-wrap">
            {/* Color swatch */}
            <div className="h-3 w-3 rounded-sm shrink-0" style={{ backgroundColor: color }} />

            {/* Metric name + qualifiers (Fiscal.ai style) */}
            <span className="text-text-secondary font-medium min-w-0">
              {metricLabels[key] || key}{' '}
              <span className="text-text-muted font-normal">({periodLabel})</span>
              <span className="text-text-muted font-normal"> ({magnitudeLabel})</span>
            </span>

            {/* Total Change */}
            {totalChange !== null && (
              <span className="text-text-muted font-normal">
                (Total Change:{' '}
                <span className={`font-mono ${totalChange >= 0 ? 'text-positive' : 'text-negative'}`}>
                  {totalChange >= 0 ? '+' : ''}{totalChange.toFixed(2)}%
                </span>
                )
              </span>
            )}

            {/* CAGR */}
            {cagr !== null && (
              <span className="text-text-muted font-normal">
                (CAGR:{' '}
                <span className="font-mono text-text-secondary">
                  {cagr.toFixed(2)}%
                </span>
                )
              </span>
            )}

            {/* Chart type toggles */}
            <div className="ml-auto flex gap-1">
              <button
                onClick={() => onChartTypeChange(key, 'bar')}
                className={`rounded px-1.5 py-0.5 ${
                  chartType === 'bar' ? 'bg-surface-hover text-foreground' : 'text-text-muted hover:text-foreground'
                }`}
                title="Bar chart"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                  <rect x="1" y="6" width="3" height="7" rx="0.5" />
                  <rect x="5.5" y="3" width="3" height="10" rx="0.5" />
                  <rect x="10" y="1" width="3" height="12" rx="0.5" />
                </svg>
              </button>
              <button
                onClick={() => onChartTypeChange(key, 'line')}
                className={`rounded px-1.5 py-0.5 ${
                  chartType === 'line' ? 'bg-surface-hover text-foreground' : 'text-text-muted hover:text-foreground'
                }`}
                title="Line chart"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <polyline points="1,11 4,7 8,9 13,2" />
                </svg>
              </button>

              {/* Remove button */}
              <button
                onClick={() => onRemove(key)}
                className="rounded px-1.5 py-0.5 text-text-muted hover:text-negative"
                title="Remove metric"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M3 3l8 8M11 3l-8 8" />
                </svg>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
