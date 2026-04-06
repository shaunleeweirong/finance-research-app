export function calculateCAGR(startValue: number, endValue: number, years: number): number {
  if (startValue <= 0 || endValue <= 0 || years <= 0) return 0;
  return (Math.pow(endValue / startValue, 1 / years) - 1) * 100;
}

export function calculateTotalChange(startValue: number, endValue: number): number {
  if (startValue === 0) return 0;
  return ((endValue - startValue) / Math.abs(startValue)) * 100;
}

export function getDateRangeForPeriod(period: '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | '5Y' | 'ALL'): { from: string; to: string } {
  const to = new Date();
  const from = new Date();

  switch (period) {
    case '1D':
      from.setDate(from.getDate() - 1);
      break;
    case '1W':
      from.setDate(from.getDate() - 7);
      break;
    case '1M':
      from.setMonth(from.getMonth() - 1);
      break;
    case '3M':
      from.setMonth(from.getMonth() - 3);
      break;
    case '6M':
      from.setMonth(from.getMonth() - 6);
      break;
    case '1Y':
      from.setFullYear(from.getFullYear() - 1);
      break;
    case '5Y':
      from.setFullYear(from.getFullYear() - 5);
      break;
    case 'ALL':
      from.setFullYear(1970);
      break;
  }

  return {
    from: from.toISOString().split('T')[0],
    to: to.toISOString().split('T')[0],
  };
}

export const CHART_COLORS = [
  '#3b82f6', // blue
  '#f97316', // orange
  '#22c55e', // green
  '#a855f7', // purple
  '#eab308', // yellow
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f43f5e', // rose
] as const;

export type TimeRange = '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | '5Y' | 'ALL';
