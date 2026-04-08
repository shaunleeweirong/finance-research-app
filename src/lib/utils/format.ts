export function formatCurrency(value: number | null, decimals: number = 2): string {
  if (value === null || value === undefined || isNaN(value)) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatPercent(value: number | null, decimals: number = 2): string {
  if (value === null || value === undefined || isNaN(value)) return 'N/A';
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`;
}

export function formatLargeNumber(value: number | null): string {
  if (value === null || value === undefined || isNaN(value)) return 'N/A';
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs >= 1e12) return `${sign}$${(abs / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${sign}$${(abs / 1e3).toFixed(2)}K`;
  return formatCurrency(value);
}

export function formatNumber(value: number | null, decimals: number = 0): string {
  if (value === null || value === undefined || isNaN(value)) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatCompactNumber(value: number | null): string {
  if (value === null || value === undefined || isNaN(value)) return 'N/A';
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs >= 1e12) return `${sign}${(abs / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `${sign}${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${sign}${(abs / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${sign}${(abs / 1e3).toFixed(1)}K`;
  return formatNumber(value, 2);
}

export function formatParenthetical(value: number | null): string {
  if (value === null || value === undefined || isNaN(value)) return 'N/A';
  if (value < 0) return `(${formatNumber(Math.abs(value))})`;
  return formatNumber(value);
}

export type DataUnit = 'K' | 'M' | 'B';

// Format a value in a specific unit (forced, no auto-scaling).
// Used when the user wants all column values in the same unit for visual consistency.
export function formatInUnit(value: number | null, unit: DataUnit, withCurrency: boolean = true): string {
  if (value === null || value === undefined || isNaN(value)) return 'N/A';
  const divisor = unit === 'B' ? 1e9 : unit === 'M' ? 1e6 : 1e3;
  const divided = value / divisor;
  const sign = divided < 0 ? '-' : '';
  const abs = Math.abs(divided);
  // Use more decimals for smaller displayed numbers
  const decimals = abs < 10 ? 2 : abs < 100 ? 2 : abs < 1000 ? 2 : 1;
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(abs);
  return `${sign}${withCurrency ? '$' : ''}${formatted}${unit}`;
}

// Auto-detect the best unit for a given dataset based on the maximum absolute value.
export function detectBestUnit(values: (number | null | undefined)[]): DataUnit {
  const absMax = values.reduce<number>((max, v) => {
    if (v == null || isNaN(v)) return max;
    return Math.max(max, Math.abs(v));
  }, 0);
  if (absMax >= 1e9) return 'B';
  if (absMax >= 1e6) return 'M';
  return 'K';
}
