import { Card } from '@/components/ui/card';
import { formatLargeNumber, formatNumber, formatPercent } from '@/lib/utils/format';
import type {
  FMPProfile,
  FMPQuote,
  FMPKeyMetrics,
  FMPRatios,
  FMPIncomeStatement,
  FMPBalanceSheet,
  FMPCashFlowStatement,
} from '@/lib/fmp/types';

interface CompanyStatisticsProps {
  profile: FMPProfile;
  quote: FMPQuote;
  keyMetrics: FMPKeyMetrics[];
  ratios: FMPRatios[];
  income: FMPIncomeStatement[];
  balance: FMPBalanceSheet[];
  cashflow: FMPCashFlowStatement[];
}

function avg(values: Array<number | null | undefined>): number | null {
  const nums = values.filter((v): v is number => typeof v === 'number' && !isNaN(v));
  if (nums.length === 0) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

// CAGR requires positive start/end; otherwise undefined.
function cagr(end: number | null, start: number | null, years: number): number | null {
  if (end == null || start == null || start <= 0 || end <= 0) return null;
  return Math.pow(end / start, 1 / years) - 1;
}

function ebitda(
  inc: FMPIncomeStatement | undefined,
  cf: FMPCashFlowStatement | undefined,
): number | null {
  if (!inc || !cf) return null;
  const op = inc.operatingIncome;
  const da = cf.depreciationAndAmortization;
  if (typeof op !== 'number' || typeof da !== 'number') return null;
  return op + da;
}

function ratio(numerator: number | null, denominator: number | null): number | null {
  if (numerator == null || denominator == null || denominator === 0) return null;
  return numerator / denominator;
}

function pct(value: number | null | undefined): string {
  if (value == null || isNaN(value)) return 'N/A';
  return formatPercent(value * 100);
}

export function CompanyStatistics({
  profile,
  quote,
  keyMetrics,
  ratios,
  income,
  balance,
  cashflow,
}: CompanyStatisticsProps) {
  const km = keyMetrics[0];
  const r = ratios[0];
  const inc = income[0];
  const bs = balance[0];
  const cf = cashflow[0];

  const ebitdaMargin = ratio(ebitda(inc, cf), inc?.revenue ?? null);
  const fcfMargin = ratio(cf?.freeCashFlow ?? null, inc?.revenue ?? null);

  const roa5Y = avg(ratios.slice(0, 5).map((x) => x.returnOnAssets));
  const roe5Y = avg(ratios.slice(0, 5).map((x) => x.returnOnEquity));
  const roic5Y = avg(keyMetrics.slice(0, 5).map((x) => x.roic));
  const roce5Y = avg(ratios.slice(0, 5).map((x) => x.returnOnCapitalEmployed));

  const evEbit = ratio(km?.enterpriseValue ?? null, inc?.operatingIncome ?? null);

  // Data is reverse-chronological: index 0 is most recent.
  const revCagr3Y = cagr(income[0]?.revenue ?? null, income[3]?.revenue ?? null, 3);
  const revCagr5Y = cagr(income[0]?.revenue ?? null, income[5]?.revenue ?? null, 5);
  const epsCagr3Y = cagr(income[0]?.epsdiluted ?? null, income[3]?.epsdiluted ?? null, 3);
  const epsCagr5Y = cagr(income[0]?.epsdiluted ?? null, income[5]?.epsdiluted ?? null, 5);
  const ebitdaCagr3Y = cagr(ebitda(income[0], cashflow[0]), ebitda(income[3], cashflow[3]), 3);
  const ebitdaCagr5Y = cagr(ebitda(income[0], cashflow[0]), ebitda(income[5], cashflow[5]), 5);
  const fcfCagr3Y = cagr(cashflow[0]?.freeCashFlow ?? null, cashflow[3]?.freeCashFlow ?? null, 3);
  const fcfCagr5Y = cagr(cashflow[0]?.freeCashFlow ?? null, cashflow[5]?.freeCashFlow ?? null, 5);

  const employees = profile.fullTimeEmployees ? Number(profile.fullTimeEmployees) : null;

  return (
    <Card className="bg-surface border-border p-6">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Company Statistics</h3>
        <span className="rounded border border-border px-2 py-0.5 text-[10px] font-medium text-text-muted">
          {profile.currency || 'USD'}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2 xl:grid-cols-3">
        <Section
          title="Profile"
          rows={[
            ['Market Cap', formatLargeNumber(km?.marketCap ?? quote.marketCap ?? null)],
            ['EV', formatLargeNumber(km?.enterpriseValue ?? null)],
            ['Shares Out', formatLargeNumber(quote.sharesOutstanding)],
            ['Revenue', formatLargeNumber(inc?.revenue ?? null)],
            ['Employees', employees != null ? employees.toLocaleString() : 'N/A'],
          ]}
        />

        <Section
          title="Margins"
          rows={[
            ['Gross', pct(r?.grossProfitMargin)],
            ['EBITDA', pct(ebitdaMargin)],
            ['Operating', pct(r?.operatingProfitMargin)],
            ['Pre-Tax', pct(r?.pretaxProfitMargin)],
            ['FCF', pct(fcfMargin)],
          ]}
        />

        <Section
          title="Returns (5Y Avg)"
          rows={[
            ['ROA', pct(roa5Y)],
            ['ROE', pct(roe5Y)],
            ['ROIC', pct(roic5Y)],
            ['ROCE', pct(roce5Y)],
          ]}
        />

        <Section
          title="Valuation (TTM)"
          rows={[
            ['P/E', formatNumber(km?.peRatio ?? null, 1)],
            ['P/S', formatNumber(km?.priceToSalesRatio ?? null, 1)],
            ['P/B', formatNumber(km?.pbRatio ?? null, 1)],
            ['EV/Sales', formatNumber(km?.evToSales ?? null, 1)],
            ['EV/EBITDA', formatNumber(km?.enterpriseValueOverEBITDA ?? null, 1)],
            ['EV/EBIT', formatNumber(evEbit, 1)],
            ['EV/FCF', formatNumber(km?.evToFreeCashFlow ?? null, 1)],
          ]}
        />

        <Section
          title="Financial Health"
          rows={[
            ['Cash', formatLargeNumber(bs?.cashAndCashEquivalents ?? null)],
            ['Debt', formatLargeNumber(bs?.totalDebt ?? null)],
            ['Net Debt', formatLargeNumber(bs?.netDebt ?? null)],
            ['Debt/Equity', formatNumber(km?.debtToEquity ?? null, 2)],
            ['EBIT/Interest', formatNumber(r?.interestCoverage ?? null, 1)],
          ]}
        />

        <Section
          title="Growth (CAGR)"
          rows={[
            ['Rev 3Y', pct(revCagr3Y)],
            ['Rev 5Y', pct(revCagr5Y)],
            ['EPS 3Y', pct(epsCagr3Y)],
            ['EPS 5Y', pct(epsCagr5Y)],
            ['EBITDA 3Y', pct(ebitdaCagr3Y)],
            ['EBITDA 5Y', pct(ebitdaCagr5Y)],
            ['FCF 3Y', pct(fcfCagr3Y)],
            ['FCF 5Y', pct(fcfCagr5Y)],
          ]}
        />

        <Section
          title="Dividends"
          rows={[
            ['Yield', pct(km?.dividendYield)],
            ['Payout', pct(km?.payoutRatio)],
          ]}
        />
      </div>
    </Card>
  );
}

function Section({ title, rows }: { title: string; rows: Array<[string, string]> }) {
  return (
    <div>
      <h4 className="mb-2 text-[11px] font-medium uppercase tracking-wider text-text-muted">
        {title}
      </h4>
      <dl className="space-y-1">
        {rows.map(([label, value]) => (
          <div
            key={label}
            className="flex items-baseline justify-between gap-2 border-b border-border/40 py-1 last:border-b-0"
          >
            <dt className="text-xs text-text-secondary">{label}</dt>
            <dd
              className={`font-mono text-xs ${
                value === 'N/A' ? 'text-text-muted' : 'text-foreground'
              }`}
            >
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
