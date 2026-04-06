'use client';

import { Checkbox } from '@/components/ui/checkbox';
import type { LineItemConfig } from '@/config/financial-line-items';
import { formatLargeNumber, formatPercent, formatNumber } from '@/lib/utils/format';
import type { FinancialRecord } from '@/lib/fmp/types';

interface DataTableProps {
  data: FinancialRecord[];
  lineItems: LineItemConfig[];
  selectedMetrics: Set<string>;
  onMetricToggle: (key: string) => void;
}

function formatValue(value: unknown, format: LineItemConfig['format']): string {
  const num = typeof value === 'number' ? value : null;
  switch (format) {
    case 'currency':
      return formatLargeNumber(num);
    case 'percent':
      return formatPercent(num !== null ? num * 100 : null);
    case 'ratio':
      return formatNumber(num, 2);
    case 'number':
      return formatLargeNumber(num);
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

export function DataTable({ data, lineItems, selectedMetrics, onMetricToggle }: DataTableProps) {
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
                  return (
                    <td
                      key={`${item.key}-${i}`}
                      className={`px-4 py-2.5 text-right font-mono text-sm whitespace-nowrap ${
                        isNegative(val) ? 'text-negative' : 'text-foreground'
                      }`}
                    >
                      {formatValue(val, item.format)}
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
