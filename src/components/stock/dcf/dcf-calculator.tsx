'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CHART_COLORS } from '@/lib/utils/chart-helpers';
import { formatLargeNumber, formatPercent, formatNumber } from '@/lib/utils/format';
import {
  calculateDCF,
  uniformGrowthRates,
  estimateHistoricalFCFGrowth,
  type DCFInputs,
  type DCFResult,
} from '@/lib/utils/dcf';
import type { FMPProfile, FMPQuote, FMPCashFlowStatement } from '@/lib/fmp/types';

interface DCFCalculatorProps {
  profile: FMPProfile;
  quote: FMPQuote;
  cashflow: FMPCashFlowStatement[];
}

type GrowthMode = 'uniform' | 'custom';

const MIN_YEARS = 3;
const MAX_YEARS = 10;
const DEFAULT_YEARS = 5;
const DEFAULT_TERMINAL = 0.02;
const DEFAULT_WACC = 0.10;

export function DCFCalculator({ profile, quote, cashflow }: DCFCalculatorProps) {
  // Derive defaults from data
  const ttmFCF = cashflow[0]?.freeCashFlow ?? 0;
  const sharesOutstanding = (
    quote.sharesOutstanding ??
    (profile.mktCap != null && profile.price ? profile.mktCap / profile.price : 0)
  ) / 1e6; // in millions
  const currentPrice = quote.price ?? profile.price ?? 0;
  const historicalGrowth = estimateHistoricalFCFGrowth(cashflow.map((c) => c.freeCashFlow));

  // State
  const [years, setYears] = useState(DEFAULT_YEARS);
  const [growthMode, setGrowthMode] = useState<GrowthMode>('uniform');
  const [uniformRate, setUniformRate] = useState(Math.round(historicalGrowth * 100)); // as percentage integer
  const [customRates, setCustomRates] = useState<number[]>(() =>
    Array.from({ length: MAX_YEARS }, () => Math.round(historicalGrowth * 100)),
  );
  const [terminalRate, setTerminalRate] = useState(DEFAULT_TERMINAL * 100);
  const [wacc, setWacc] = useState(DEFAULT_WACC * 100);

  const handleCustomRateChange = useCallback((index: number, value: string) => {
    const num = parseFloat(value);
    if (isNaN(num)) return;
    setCustomRates((prev) => {
      const next = [...prev];
      next[index] = Math.max(-50, Math.min(100, num));
      return next;
    });
  }, []);

  // Calculate DCF
  const result: DCFResult | null = useMemo(() => {
    if (ttmFCF <= 0 || sharesOutstanding <= 0) return null;

    const growthRates =
      growthMode === 'uniform'
        ? uniformGrowthRates(uniformRate / 100, years)
        : customRates.slice(0, years).map((r) => r / 100);

    const waccDecimal = wacc / 100;
    const terminalDecimal = terminalRate / 100;

    // Guard: WACC must exceed terminal growth
    if (waccDecimal <= terminalDecimal) return null;

    const inputs: DCFInputs = {
      currentFCF: ttmFCF / 1e6, // convert to $mm
      sharesOutstanding,
      currentPrice,
      growthRates,
      terminalGrowthRate: terminalDecimal,
      discountRate: waccDecimal,
    };

    return calculateDCF(inputs);
  }, [ttmFCF, sharesOutstanding, currentPrice, growthMode, uniformRate, customRates, years, wacc, terminalRate]);

  // Chart data
  const chartData = useMemo(() => {
    if (!result) return [];
    return result.projections.map((p) => ({
      name: p.label,
      fcf: p.fcf,
      pvFCF: p.pvFCF,
    }));
  }, [result]);

  const signalColor = !result
    ? 'text-text-muted'
    : result.signal === 'UNDERVALUED'
      ? 'text-green-400'
      : result.signal === 'OVERVALUED'
        ? 'text-red-400'
        : 'text-yellow-400';

  const signalText = !result
    ? 'Insufficient Data'
    : result.signal === 'UNDERVALUED'
      ? 'UNDERVALUED — Consider Buying'
      : result.signal === 'OVERVALUED'
        ? 'OVERVALUED — Consider Caution'
        : 'FAIRLY VALUED';

  if (ttmFCF <= 0) {
    return (
      <Card className="bg-surface border-border">
        <CardContent className="py-12 text-center text-text-muted">
          <p className="text-lg font-medium">DCF model unavailable</p>
          <p className="text-sm mt-1">This company has negative or zero free cash flow, so a DCF valuation is not meaningful.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-foreground">DCF Valuation Model</h2>
        <p className="text-sm text-text-muted">Free Cash Flow (FCF) Based Approach</p>
      </div>

      {/* Assumptions Panel */}
      <Card className="bg-surface border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm uppercase tracking-wider text-text-muted">Assumptions</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Read-only facts row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <FactItem label="Ticker" value={profile.symbol} />
            <FactItem label="Current Price" value={`$${formatNumber(currentPrice, 2)}`} />
            <FactItem label="Shares Outstanding" value={`${formatNumber(sharesOutstanding, 0)}M`} />
            <FactItem label="FCF (TTM)" value={formatLargeNumber(ttmFCF)} />
          </div>

          {/* Editable inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Projection Period */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-secondary">Projection Period</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={MIN_YEARS}
                  max={MAX_YEARS}
                  value={years}
                  onChange={(e) => setYears(Number(e.target.value))}
                  className="flex-1 accent-primary h-1.5"
                />
                <span className="text-sm font-mono text-foreground w-12 text-right">{years} yrs</span>
              </div>
            </div>

            {/* Terminal Growth Rate */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-secondary">Terminal Growth Rate</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={0}
                  max={5}
                  step={0.5}
                  value={terminalRate}
                  onChange={(e) => setTerminalRate(Number(e.target.value))}
                  className="flex-1 accent-primary h-1.5"
                />
                <span className="text-sm font-mono text-foreground w-12 text-right">{terminalRate.toFixed(1)}%</span>
              </div>
              <p className="text-[10px] text-text-muted">Long-run GDP growth ~2-3%</p>
            </div>

            {/* Discount Rate (WACC) */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-secondary">Discount Rate (WACC)</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={5}
                  max={20}
                  step={0.5}
                  value={wacc}
                  onChange={(e) => setWacc(Number(e.target.value))}
                  className="flex-1 accent-primary h-1.5"
                />
                <span className="text-sm font-mono text-foreground w-12 text-right">{wacc.toFixed(1)}%</span>
              </div>
            </div>

            {/* Growth Mode */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-secondary">FCF Growth Mode</label>
              <div className="flex rounded-lg bg-background p-0.5">
                <button
                  onClick={() => setGrowthMode('uniform')}
                  className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    growthMode === 'uniform'
                      ? 'bg-surface-hover text-foreground'
                      : 'text-text-secondary hover:text-foreground'
                  }`}
                >
                  Uniform
                </button>
                <button
                  onClick={() => setGrowthMode('custom')}
                  className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    growthMode === 'custom'
                      ? 'bg-surface-hover text-foreground'
                      : 'text-text-secondary hover:text-foreground'
                  }`}
                >
                  Custom
                </button>
              </div>
            </div>
          </div>

          {/* Growth Rate Input(s) */}
          <div className="mt-4">
            {growthMode === 'uniform' ? (
              <div className="space-y-1.5 max-w-sm">
                <label className="text-xs font-medium text-text-secondary">Annual FCF Growth Rate</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={-20}
                    max={50}
                    step={1}
                    value={uniformRate}
                    onChange={(e) => setUniformRate(Number(e.target.value))}
                    className="flex-1 accent-primary h-1.5"
                  />
                  <span className="text-sm font-mono text-foreground w-12 text-right">{uniformRate}%</span>
                </div>
                <p className="text-[10px] text-text-muted">
                  Historical CAGR: {formatPercent(historicalGrowth * 100, 1)}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-xs font-medium text-text-secondary">Custom Annual Growth Rates</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {Array.from({ length: years }, (_, i) => (
                    <div key={i} className="space-y-1">
                      <span className="text-[10px] text-text-muted">Year {i + 1}</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={customRates[i]}
                          onChange={(e) => handleCustomRateChange(i, e.target.value)}
                          className="w-full rounded-md bg-background border border-border px-2 py-1.5 text-xs font-mono text-foreground focus:border-primary focus:outline-none"
                          step={1}
                          min={-50}
                          max={100}
                        />
                        <span className="text-xs text-text-muted">%</span>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-text-muted">
                  Historical CAGR: {formatPercent(historicalGrowth * 100, 1)} — adjust each year individually
                </p>
              </div>
            )}
          </div>

          {/* WACC > Terminal guard */}
          {wacc / 100 <= terminalRate / 100 && (
            <p className="mt-3 text-xs text-red-400">
              Discount rate must exceed terminal growth rate for the model to be valid.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Chart */}
      {result && chartData.length > 0 && (
        <Card className="bg-surface border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm uppercase tracking-wider text-text-muted">
              {years}-Year FCF Projection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                    axisLine={{ stroke: 'var(--border)' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) => `$${formatNumber(v, 0)}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(value, name) => [
                      `$${formatNumber(Number(value), 0)}M`,
                      name === 'fcf' ? 'Projected FCF' : 'PV of FCF',
                    ]}
                    labelStyle={{ color: 'var(--text-secondary)' }}
                  />
                  <Bar dataKey="fcf" name="Projected FCF" radius={[4, 4, 0, 0]} barSize={40}>
                    {chartData.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={index === 0 ? CHART_COLORS[5] : CHART_COLORS[0]}
                        opacity={index === 0 ? 0.6 : 0.85}
                      />
                    ))}
                  </Bar>
                  <Line
                    dataKey="pvFCF"
                    name="PV of FCF"
                    stroke={CHART_COLORS[2]}
                    strokeWidth={2}
                    dot={{ fill: CHART_COLORS[2], r: 4 }}
                    connectNulls
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center gap-6 mt-3 text-xs text-text-muted">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-3 w-3 rounded-sm" style={{ backgroundColor: CHART_COLORS[0] }} />
                Projected FCF
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: CHART_COLORS[2] }} />
                Present Value of FCF
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-3 w-3 rounded-sm" style={{ backgroundColor: CHART_COLORS[5], opacity: 0.6 }} />
                Current (TTM)
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Projection Table */}
      {result && (
        <Card className="bg-surface border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm uppercase tracking-wider text-text-muted">
              FCF Projection Detail ($mm)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-3 py-2 text-left text-text-muted font-medium" />
                    {result.projections.map((p) => (
                      <th key={p.year} className="px-3 py-2 text-right text-text-muted font-medium whitespace-nowrap">
                        {p.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border/50">
                    <td className="px-3 py-2 font-medium text-text-secondary">Free Cash Flow</td>
                    {result.projections.map((p) => (
                      <td key={p.year} className="px-3 py-2 text-right font-mono text-foreground">
                        ${formatNumber(p.fcf, 0)}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="px-3 py-2 font-medium text-text-secondary">Discount Factor</td>
                    {result.projections.map((p) => (
                      <td key={p.year} className="px-3 py-2 text-right font-mono text-text-secondary">
                        {p.discountFactor != null ? p.discountFactor.toFixed(4) : '—'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-medium text-text-secondary">PV of FCF</td>
                    {result.projections.map((p) => (
                      <td key={p.year} className="px-3 py-2 text-right font-mono text-foreground">
                        {p.pvFCF != null ? `$${formatNumber(p.pvFCF, 0)}` : '—'}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Valuation Summary */}
      {result && (
        <Card className="bg-surface border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm uppercase tracking-wider text-text-muted">Valuation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-4">
              <ValuationItem label="Sum of PV of FCFs" value={`$${formatNumber(result.sumPVFCFs, 0)}M`} />
              <ValuationItem label="Terminal Value" value={`$${formatNumber(result.terminalValue, 0)}M`} />
              <ValuationItem label="PV of Terminal Value" value={`$${formatNumber(result.pvTerminalValue, 0)}M`} />
              <ValuationItem label="Enterprise Value" value={`$${formatNumber(result.enterpriseValue, 0)}M`} highlight />
              <ValuationItem label="Shares Outstanding" value={`${formatNumber(sharesOutstanding, 0)}M`} />
              <ValuationItem label="Fair Value / Share" value={`$${formatNumber(result.fairValuePerShare, 2)}`} highlight />
            </div>

            <div className="mt-6 pt-4 border-t border-border flex flex-wrap items-center gap-6">
              <div className="space-y-0.5">
                <span className="text-xs text-text-muted">Current Price</span>
                <p className="text-lg font-semibold text-foreground font-mono">${formatNumber(currentPrice, 2)}</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-xs text-text-muted">Fair Value</span>
                <p className="text-lg font-semibold text-foreground font-mono">${formatNumber(result.fairValuePerShare, 2)}</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-xs text-text-muted">Upside / Downside</span>
                <p className={`text-lg font-semibold font-mono ${result.upsideDownside >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatPercent(result.upsideDownside * 100, 1)}
                </p>
              </div>
              <div className="space-y-0.5">
                <span className="text-xs text-text-muted">Signal</span>
                <p className={`text-sm font-semibold ${signalColor}`}>{signalText}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ---------- small helper sub-components ---------- */

function FactItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-0.5">
      <span className="text-[10px] uppercase tracking-wider text-text-muted font-medium">{label}</span>
      <p className="text-sm font-mono text-foreground">{value}</p>
    </div>
  );
}

function ValuationItem({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="space-y-0.5">
      <span className="text-xs text-text-muted">{label}</span>
      <p className={`text-sm font-mono ${highlight ? 'text-foreground font-semibold' : 'text-text-secondary'}`}>
        {value}
      </p>
    </div>
  );
}
