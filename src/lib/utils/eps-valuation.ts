/**
 * EPS-based valuation model.
 * Projects earnings per share forward, applies a terminal PE multiple,
 * then discounts back to today for a fair value estimate.
 */

export interface EPSValuationInputs {
  currentEPS: number;         // TTM diluted EPS ($)
  currentPrice: number;       // current stock price ($)
  growthRates: number[];      // per-year EPS growth rates (decimals, e.g. 0.25 = 25%)
  terminalPE: number;         // target P/E multiple at end of projection
  discountRate: number;       // desired annual return (decimal, e.g. 0.12 = 12%)
}

export interface EPSProjectionYear {
  year: number;               // 0 = current, 1..n = projected
  label: string;
  eps: number;
  yoyGrowth: number | null;   // decimal — null for year 0
}

export interface EPSValuationResult {
  projections: EPSProjectionYear[];
  terminalEPS: number;        // projected EPS in final year
  terminalPE: number;
  projectedPrice: number;     // terminalEPS * terminalPE
  discountFactor: number;     // (1 + r)^n
  fairValue: number;          // projectedPrice / discountFactor
  upsideDownside: number;     // decimal
  signal: 'UNDERVALUED' | 'FAIRLY VALUED' | 'OVERVALUED';
}

/**
 * Run a full EPS-based valuation.
 *
 * Returns null for companies with non-positive current EPS — applying a
 * positive growth rate to a negative EPS produces a more-negative projection
 * each year, yielding a meaningless negative fair value and a forced
 * OVERVALUED signal. The EPSCalculator UI already guards before calling,
 * so this is defense-in-depth. Use the P/S model for unprofitable companies.
 */
export function calculateEPSValuation(inputs: EPSValuationInputs): EPSValuationResult | null {
  const { currentEPS, currentPrice, growthRates, terminalPE, discountRate } = inputs;

  // EPS-based valuation is not meaningful for companies with non-positive earnings.
  if (currentEPS <= 0) return null;

  const years = growthRates.length;

  const projections: EPSProjectionYear[] = [];

  // Year 0 = current
  projections.push({
    year: 0,
    label: 'Current',
    eps: currentEPS,
    yoyGrowth: null,
  });

  let previousEPS = currentEPS;

  for (let i = 0; i < years; i++) {
    const rate = growthRates[i];
    const eps = previousEPS * (1 + rate);

    projections.push({
      year: i + 1,
      label: `Year ${i + 1}`,
      eps,
      yoyGrowth: rate,
    });

    previousEPS = eps;
  }

  const terminalEPS = previousEPS;
  const projectedPrice = terminalEPS * terminalPE;
  const discountFactor = Math.pow(1 + discountRate, years);
  const fairValue = discountFactor > 0 ? projectedPrice / discountFactor : 0;
  const upsideDownside = currentPrice > 0 ? (fairValue - currentPrice) / currentPrice : 0;

  let signal: EPSValuationResult['signal'];
  if (upsideDownside > 0.15) {
    signal = 'UNDERVALUED';
  } else if (upsideDownside < -0.15) {
    signal = 'OVERVALUED';
  } else {
    signal = 'FAIRLY VALUED';
  }

  return {
    projections,
    terminalEPS,
    terminalPE,
    projectedPrice,
    discountFactor,
    fairValue,
    upsideDownside,
    signal,
  };
}

/**
 * Estimate historical EPS growth rate via CAGR.
 * Input: array of diluted EPS values, most-recent-first (same as FMP response).
 */
export function estimateHistoricalEPSGrowth(epsValues: (number | null)[]): number {
  const indexed = epsValues
    .map((v, i) => ({ v, i }))
    .filter((x): x is { v: number; i: number } => x.v != null && x.v > 0);
  if (indexed.length < 2) return 0.10; // default 10%
  const latest = indexed[0].v;
  const oldest = indexed[indexed.length - 1].v;
  const years = indexed[indexed.length - 1].i - indexed[0].i;
  if (years <= 0) return 0.10;
  const cagr = Math.pow(latest / oldest, 1 / years) - 1;
  // Clamp to reasonable bounds
  return Math.max(-0.30, Math.min(0.50, cagr));
}
