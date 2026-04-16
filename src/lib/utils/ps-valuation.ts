/**
 * Price-to-Sales (P/S) valuation model.
 * Designed for companies with negative cash flow or negative EPS.
 * Projects revenue forward, applies a terminal P/S multiple,
 * then discounts back to today for a fair value estimate.
 */

export interface PSValuationInputs {
  currentRevenue: number;        // TTM total revenue ($)
  sharesOutstanding: number;     // diluted shares outstanding
  currentPrice: number;          // current stock price ($)
  growthRates: number[];         // per-year revenue growth rates (decimals, e.g. 0.25 = 25%)
  terminalPS: number;            // target P/S multiple at end of projection
  discountRate: number;          // desired annual return (decimal, e.g. 0.12 = 12%)
}

export interface PSProjectionYear {
  year: number;                  // 0 = current, 1..n = projected
  label: string;
  revenue: number;               // total revenue
  revenuePerShare: number;
  yoyGrowth: number | null;      // decimal — null for year 0
}

export interface PSValuationResult {
  projections: PSProjectionYear[];
  terminalRevenue: number;       // projected revenue in final year
  terminalRevenuePerShare: number;
  terminalPS: number;
  projectedPrice: number;        // terminalRevenuePerShare * terminalPS
  discountFactor: number;        // (1 + r)^n
  fairValue: number;             // projectedPrice / discountFactor
  upsideDownside: number;        // decimal
  signal: 'UNDERVALUED' | 'FAIRLY VALUED' | 'OVERVALUED';
}

/**
 * Run a full P/S-based valuation.
 */
export function calculatePSValuation(inputs: PSValuationInputs): PSValuationResult {
  const { currentRevenue, sharesOutstanding, currentPrice, growthRates, terminalPS, discountRate } = inputs;
  const years = growthRates.length;

  const projections: PSProjectionYear[] = [];

  projections.push({
    year: 0,
    label: 'Current',
    revenue: currentRevenue,
    revenuePerShare: sharesOutstanding > 0 ? currentRevenue / sharesOutstanding : 0,
    yoyGrowth: null,
  });

  let previousRevenue = currentRevenue;

  for (let i = 0; i < years; i++) {
    const rate = growthRates[i];
    const revenue = previousRevenue * (1 + rate);

    projections.push({
      year: i + 1,
      label: `Year ${i + 1}`,
      revenue,
      revenuePerShare: sharesOutstanding > 0 ? revenue / sharesOutstanding : 0,
      yoyGrowth: rate,
    });

    previousRevenue = revenue;
  }

  const terminalRevenue = previousRevenue;
  const terminalRevenuePerShare = sharesOutstanding > 0 ? terminalRevenue / sharesOutstanding : 0;
  const projectedPrice = terminalRevenuePerShare * terminalPS;
  const discountFactor = Math.pow(1 + discountRate, years);
  const fairValue = discountFactor > 0 ? projectedPrice / discountFactor : 0;
  const upsideDownside = currentPrice > 0 ? (fairValue - currentPrice) / currentPrice : 0;

  let signal: PSValuationResult['signal'];
  if (upsideDownside > 0.15) {
    signal = 'UNDERVALUED';
  } else if (upsideDownside < -0.15) {
    signal = 'OVERVALUED';
  } else {
    signal = 'FAIRLY VALUED';
  }

  return {
    projections,
    terminalRevenue,
    terminalRevenuePerShare,
    terminalPS,
    projectedPrice,
    discountFactor,
    fairValue,
    upsideDownside,
    signal,
  };
}

/**
 * Estimate historical revenue growth rate via CAGR.
 * Input: array of revenue values, most-recent-first (same as FMP response).
 */
export function estimateHistoricalRevenueGrowth(revenues: (number | null)[]): number {
  const indexed = revenues
    .map((v, i) => ({ v, i }))
    .filter((x): x is { v: number; i: number } => x.v != null && x.v > 0);

  if (indexed.length < 2) return 0.1; // default 10%

  const newest = indexed[0];
  const oldest = indexed[indexed.length - 1];
  const periods = oldest.i - newest.i; // FMP is most-recent-first so oldest has higher index

  if (periods <= 0 || oldest.v <= 0) return 0.1;

  const cagr = Math.pow(newest.v / oldest.v, 1 / periods) - 1;

  // Clamp to sensible range
  return Math.max(-0.3, Math.min(1, cagr));
}
