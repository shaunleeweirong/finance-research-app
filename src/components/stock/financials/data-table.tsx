'use client';

import { Checkbox } from '@/components/ui/checkbox';
import type { LineItemConfig } from '@/config/financial-line-items';
import { formatInUnit, formatPercent, formatNumber, type DataUnit } from '@/lib/utils/format';
import type { FinancialRecord } from '@/lib/fmp/types';

interface DataTableProps {
  data: FinancialRecord[];
  lineItems: LineItemConfig[];
  selectedMetrics: Set<string>;
  activeUnit: DataUnit;
  onMetricToggle: (key: string) => void;
  showChange?: boolean;
}

function formatValue(value: unknown, format: LineItemConfig['format'], unit: DataUnit): string {
  const num = typeof value === 'number' ? value : null;
  switch (format) {
    case 'currency':
      // Force the selected unit so all currency values in the table share one scale
      return formatInUnit(num, unit, true, false);
    case 'percent':
      return formatPercent(num !== null ? num * 100 : null);
    case 'ratio':
      return formatNumber(num, 2);
    case 'number':
      return formatInUnit(num, unit, false, false);
    default:
      return num !== null ? String(num) : 'N/A';
  }
}

function getPeriodLabel(item: FinancialRecord): string {
  const year = item.calendarYear;
  const period = item.period;
  if (period && period !== 'FY') {
    return `${period} ${year}`;
  }
  return year || item.date?.split('-')[0] || '';
}

function isNegative(value: unknown): boolean {
  return typeof value === 'number' && value < 0;
}

function formatYoYChange(current: unknown, previous: unknown): string {
  const cur = typeof current === 'number' ? current : null;
  const prev = typeof previous === 'number' ? previous : null;
  if (cur === null || prev === null || prev === 0) return '—';
  const change = ((cur - prev) / Math.abs(prev)) * 100;
  const sign = change > 0 ? '+' : '';
  return `${sign}${change.toFixed(1)}%`;
}

function getYoYColor(current: unknown, previous: unknown): string {
  const cur = typeof current === 'number' ? current : null;
  const prev = typeof previous === 'number' ? previous : null;
  if (cur === null || prev === null || prev === 0) return 'text-text-muted';
  const change = ((cur - prev) / Math.abs(prev)) * 100;
  if (change > 0) return 'text-positive';
  if (change < 0) return 'text-negative';
  return 'text-text-muted';
}

export function DataTable({ data, lineItems, selectedMetrics, activeUnit, onMetricToggle, showChange = false }: DataTableProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-text-muted">
        No financial data available
      </div>
    );
  }

  // Periods are columns — most recent first (data comes most-recent-first from FMP)
  const periods = data.map((d) => getPeriodLabel(d));

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-background">
            <th className="sticky left-0 z-10 bg-background px-4 py-3 text-left text-xs font-medium text-text-muted min-w-[250px]">
              Metric
            </th>
            {periods.map((period, i) => (
              <th
                key={`${period}-${i}`}
                className="px-4 py-3 text-right text-xs font-medium text-text-muted whitespace-nowrap min-w-[100px]"
              >
                {period}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {lineItems.map((item) => {
            const isSelected = selectedMetrics.has(item.key);
            return (
              <tr
                key={item.key}
                className={`border-b border-border transition-colors hover:bg-surface-hover ${
                  isSelected ? 'bg-primary/5' : ''
                }`}
              >
                <td className="sticky left-0 z-10 bg-surface px-4 py-2.5 min-w-[250px]">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => onMetricToggle(item.key)}
                      className="shrink-0"
                    />
                    <span
                      className={`text-sm ${item.indent ? 'pl-4 text-text-secondary' : 'font-medium text-foreground'}`}
                    >
                      {item.label}
                    </span>
                  </div>
                </td>
                {data.map((d, i) => {
                  const val = d[item.key];
                  const prevVal = data[i + 1]?.[item.key];
                  return (
                    <td
                      key={`${item.key}-${i}`}
                      className="px-4 py-2 text-right font-mono text-sm whitespace-nowrap"
                    >
                      <span className={isNegative(val) ? 'text-negative' : 'text-foreground'}>
                        {formatValue(val, item.format, activeUnit)}
                      </span>
                      {showChange && (
                        <span className={`block text-[11px] ${getYoYColor(val, prevVal)}`}>
                          {formatYoYChange(val, prevVal)}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
