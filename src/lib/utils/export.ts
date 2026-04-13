import type { LineItemConfig } from '@/config/financial-line-items';
import type { FinancialRecord } from '@/lib/fmp/types';

/**
 * Generate a CSV string from financial data and line item definitions.
 * Columns: Metric, then one column per period (most recent first).
 */
export function financialsToCSV(
  data: FinancialRecord[],
  lineItems: LineItemConfig[],
): string {
  if (data.length === 0 || lineItems.length === 0) return '';

  // Period headers — most recent first (same order as the data table)
  const periods = data.map((row) => {
    const d = row as Record<string, unknown>;
    if (d.period && d.calendarYear) return `${d.period} ${d.calendarYear}`;
    if (d.calendarYear) return String(d.calendarYear);
    if (d.date) return String(d.date).slice(0, 10);
    return '';
  });

  const rows: string[] = [];

  // Header row
  rows.push(['Metric', ...periods].map(escapeCSV).join(','));

  // Data rows
  for (const item of lineItems) {
    const values = data.map((row) => {
      const v = (row as Record<string, unknown>)[item.key];
      if (v == null) return '';
      return String(v);
    });
    rows.push([item.label, ...values].map(escapeCSV).join(','));
  }

  return rows.join('\n');
}

function escapeCSV(value: string): string {
  let safe = value;
  // Defence-in-depth: neutralise formula-trigger characters for spreadsheet apps
  if (/^[=+\-@|\t\r]/.test(safe)) {
    safe = `\t${safe}`;
  }
  if (safe.includes(',') || safe.includes('"') || safe.includes('\n') || safe.includes('\r')) {
    return `"${safe.replace(/"/g, '""')}"`;
  }
  return safe;
}

/**
 * Trigger a browser download of a CSV string.
 */
export function downloadCSV(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
