import { Card } from '@/components/ui/card';
import { formatCurrency, formatPercent, formatLargeNumber, formatNumber } from '@/lib/utils/format';
import type { FMPQuote, FMPKeyMetrics, FMPProfile } from '@/lib/fmp/types';

interface KeyMetricsProps {
  quote: FMPQuote;
  keyMetrics: FMPKeyMetrics | null;
  profile: FMPProfile;
}

interface MetricItem {
  label: string;
  value: string;
}

export function KeyMetrics({ quote, keyMetrics, profile }: KeyMetricsProps) {
  const metrics: MetricItem[] = [
    { label: 'P/E Ratio', value: formatNumber(quote.pe, 2) },
    { label: 'EPS (Diluted)', value: formatCurrency(quote.eps) },
    { label: 'Market Cap', value: formatLargeNumber(quote.marketCap) },
    {
      label: 'Dividend Yield',
      value: formatPercent(
        keyMetrics?.dividendYield != null ? keyMetrics.dividendYield * 100 : null
      ),
    },
    { label: 'Beta', value: formatNumber(profile.beta, 2) },
    {
      label: '52-Week Range',
      value: `${formatCurrency(quote.yearLow)} — ${formatCurrency(quote.yearHigh)}`,
    },
    {
      label: 'Revenue (TTM)',
      value: formatLargeNumber(
        keyMetrics?.revenuePerShare != null && quote.sharesOutstanding != null
          ? keyMetrics.revenuePerShare * quote.sharesOutstanding
          : null
      ),
    },
    {
      label: 'Net Income (TTM)',
      value: formatLargeNumber(
        keyMetrics?.netIncomePerShare != null && quote.sharesOutstanding != null
          ? keyMetrics.netIncomePerShare * quote.sharesOutstanding
          : null
      ),
    },
    {
      label: 'Profit Margin',
      value: formatPercent(
        keyMetrics?.netIncomePerShare != null && keyMetrics?.revenuePerShare != null && keyMetrics.revenuePerShare !== 0
          ? (keyMetrics.netIncomePerShare / keyMetrics.revenuePerShare) * 100
          : null
      ),
    },
    {
      label: 'ROE',
      value: formatPercent(keyMetrics?.roe != null ? keyMetrics.roe * 100 : null),
    },
    { label: 'Debt/Equity', value: formatNumber(keyMetrics?.debtToEquity ?? null, 2) },
    {
      label: 'Free Cash Flow',
      value: formatLargeNumber(
        keyMetrics?.freeCashFlowPerShare != null && quote.sharesOutstanding != null
          ? keyMetrics.freeCashFlowPerShare * quote.sharesOutstanding
          : null
      ),
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {metrics.map((metric) => (
        <Card key={metric.label} className="bg-surface border-border px-4 py-3">
          <p className="text-xs text-text-muted">{metric.label}</p>
          <p
            className={`mt-1 font-mono text-lg font-semibold ${
              metric.value === 'N/A' ? 'text-text-muted' : 'text-foreground'
            }`}
          >
            {metric.value}
          </p>
        </Card>
      ))}
    </div>
  );
}
