/**
 * Discounted Cash Flow (DCF) valuation model.
 * All monetary values in millions ($mm) unless stated otherwise.
 */

export interface DCFInputs {
  currentFCF: number;        // TTM Free Cash Flow ($mm)
  sharesOutstanding: number;  // millions
  currentPrice: number;       // $ per share
  growthRates: number[];      // per-year FCF growth rates (decimals, e.g. 0.17 = 17%)
  terminalGrowthRate: number; // long-run growth (decimal)
  discountRate: number;       // WACC (decimal)
}

export interface DCFProjectionYear {
  year: number;               // 0 = current, 1..n = projected
  label: string;              // "Current", "Year 1", etc.
  fcf: number;                // $mm
  discountFactor: number | null;
  pvFCF: number | null;
}

export interface DCFResult {
  projections: DCFProjectionYear[];
  sumPVFCFs: number;
  terminalValue: number;
  pvTerminalValue: number;
  enterpriseValue: number;
  fairValuePerShare: number;
  upsideDownside: number;     // decimal (1.05 = 105% upside)
  signal: 'UNDERVALUED' | 'FAIRLY VALUED' | 'OVERVALUED';
}

/**
 * Run a full DCF valuation.
 *
 * Returns null when inputs are not valuation-meaningful — specifically when
 * the discount rate does not exceed the terminal growth rate (Gordon Growth
 * Model collapses) or when shares outstanding is non-positive. Callers are
 * expected to render a "model unavailable" state in those cases. The
 * DCFCalculator UI already guards before calling, so this is defense-in-depth.
 */
export function calculateDCF(inputs: DCFInputs): DCFResult | null {
  const { currentFCF, sharesOutstanding, currentPrice, growthRates, terminalGrowthRate, discountRate } = inputs;
  const years = growthRates.length;

  // Hard preconditions for a meaningful valuation
  if (discountRate <= terminalGrowthRate) return null;
  if (sharesOutstanding <= 0) return null;

  // Build projections
  const projections: DCFProjectionYear[] = [];

  // Year 0 = current
  projections.push({
    year: 0,
    label: 'Current',
    fcf: currentFCF,
    discountFactor: null,
    pvFCF: null,
  });

  let previousFCF = currentFCF;
  let sumPVFCFs = 0;

  for (let i = 0; i < years; i++) {
    const rate = growthRates[i];
    const fcf = previousFCF * (1 + rate);
    const discountFactor = 1 / Math.pow(1 + discountRate, i + 1);
    const pvFCF = fcf * discountFactor;
    sumPVFCFs += pvFCF;

    projections.push({
      year: i + 1,
      label: `Year ${i + 1}`,
      fcf,
      discountFactor,
      pvFCF,
    });

    previousFCF = fcf;
  }


  const lastFCF = previousFCF;
  const terminalValue = (lastFCF * (1 + terminalGrowthRate)) / (discountRate - terminalGrowthRate);
  const pvTerminalValue = terminalValue / Math.pow(1 + discountRate, years);

  const enterpriseValue = sumPVFCFs + pvTerminalValue;
  const fairValuePerShare = sharesOutstanding > 0 ? enterpriseValue / sharesOutstanding : 0;
  const upsideDownside = currentPrice > 0 ? (fairValuePerShare - currentPrice) / currentPrice : 0;

  let signal: DCFResult['signal'];
  if (upsideDownside > 0.15) {
    signal = 'UNDERVALUED';
  } else if (upsideDownside < -0.15) {
    signal = 'OVERVALUED';
  } else {
    signal = 'FAIRLY VALUED';
  }

  return {
    projections,
    sumPVFCFs,
    terminalValue,
    pvTerminalValue,
    enterpriseValue,
    fairValuePerShare,
    upsideDownside,
    signal,
  };
}

/**
 * Build a uniform growth rate array (same rate each year).
 */
export function uniformGrowthRates(rate: number, years: number): number[] {
  return Array.from({ length: years }, () => rate);
}

/**
 * Estimate a reasonable default FCF growth rate from historical data.
 * Uses CAGR of the first and last positive FCF values.
 */
export function estimateHistoricalFCFGrowth(fcfValues: (number | null)[]): number {
  // fcfValues should be ordered most-recent-first (same as FMP response)
  const indexed = fcfValues
    .map((v, i) => ({ v, i }))
    .filter((x): x is { v: number; i: number } => x.v != null && x.v > 0);
  if (indexed.length < 2) return 0.10; // Default 10%
  const latest = indexed[0].v;
  const oldest = indexed[indexed.length - 1].v;
  const years = indexed[indexed.length - 1].i - indexed[0].i;
  if (years <= 0) return 0.10;
  const cagr = Math.pow(latest / oldest, 1 / years) - 1;
  // Clamp to reasonable bounds: -20% to 50%
  return Math.max(-0.20, Math.min(0.50, cagr));
}
