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
  calculatePSValuation,
  estimateHistoricalRevenueGrowth,
  type PSValuationInputs,
  type PSValuationResult,
} from '@/lib/utils/ps-valuation';
import { uniformGrowthRates } from '@/lib/utils/dcf';
import type { FMPProfile, FMPQuote, FMPIncomeStatement } from '@/lib/fmp/types';

interface PSCalculatorProps {
  profile: FMPProfile;
  quote: FMPQuote;
  income: FMPIncomeStatement[];
}

type GrowthMode = 'uniform' | 'custom';

const MIN_YEARS = 3;
const MAX_YEARS = 10;
const DEFAULT_YEARS = 5;
const DEFAULT_DISCOUNT = 12;

export function PSCalculator({ profile, quote, income }: PSCalculatorProps) {
  // Derive defaults from data
  const currentRevenue = income[0]?.revenue ?? 0;
  const sharesOutstanding = quote.sharesOutstanding ?? (
    profile.mktCap != null && profile.price ? profile.mktCap / profile.price : 0
  );
  const currentPrice = quote.price ?? profile.price ?? 0;
  const revenuePerShare = sharesOutstanding > 0 ? currentRevenue / sharesOutstanding : 0;
  const currentPS = revenuePerShare > 0 ? currentPrice / revenuePerShare : 0;
  const historicalGrowth = estimateHistoricalRevenueGrowth(income.map((i) => i.revenue));

  // State
  const [years, setYears] = useState(DEFAULT_YEARS);
  const [growthMode, setGrowthMode] = useState<GrowthMode>('uniform');
  const [uniformRate, setUniformRate] = useState(Math.round(historicalGrowth * 100));
  const [customRates, setCustomRates] = useState<number[]>(() =>
    Array.from({ length: MAX_YEARS }, () => Math.round(historicalGrowth * 100)),
  );
  const [terminalPS, setTerminalPS] = useState(Math.round(Math.min(30, Math.max(currentPS, 1))));
  const [discountRate, setDiscountRate] = useState(DEFAULT_DISCOUNT);

  const handleCustomRateChange = useCallback((index: number, value: string) => {
    const num = parseFloat(value);
    if (isNaN(num)) return;
    setCustomRates((prev) => {
      const next = [...prev];
      next[index] = Math.max(-50, Math.min(100, num));
      return next;
    });
  }, []);

  // Calculate P/S valuation
  const result: PSValuationResult | null = useMemo(() => {
    if (currentRevenue <= 0 || sharesOutstanding <= 0) return null;

    const growthRates =
      growthMode === 'uniform'
        ? uniformGrowthRates(uniformRate / 100, years)
        : customRates.slice(0, years).map((r) => r / 100);

    const inputs: PSValuationInputs = {
      currentRevenue,
      sharesOutstanding,
      currentPrice,
      growthRates,
      terminalPS,
      discountRate: discountRate / 100,
    };

    return calculatePSValuation(inputs);
  }, [currentRevenue, sharesOutstanding, currentPrice, growthMode, uniformRate, customRates, years, terminalPS, discountRate]);

  // Chart data
  const chartData = useMemo(() => {
    if (!result) return [];
    return result.projections.map((p) => ({
      name: p.label,
      revenue: p.revenue,
      yoyGrowth: p.yoyGrowth != null ? p.yoyGrowth * 100 : null,
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

  if (currentRevenue <= 0) {
    return (
      <Card className="bg-surface border-border">
        <CardContent className="py-12 text-center text-text-muted">
          <p className="text-lg font-medium">P/S valuation model unavailable</p>
          <p className="text-sm mt-1">This company has no reported revenue, so a price-to-sales valuation is not meaningful.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-foreground">P/S Valuation Model</h2>
        <p className="text-sm text-text-muted">Revenue-Based Approach — suited for pre-profit & high-growth companies</p>
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
            <FactItem label="TTM Revenue" value={formatLargeNumber(currentRevenue)} />
            <FactItem label="P/S Ratio (TTM)" value={`${formatNumber(currentPS, 2)}x`} />
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

            {/* Terminal P/S Multiple */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-secondary">Terminal P/S Multiple</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={1}
                  max={30}
                  step={0.5}
                  value={terminalPS}
                  onChange={(e) => setTerminalPS(Number(e.target.value))}
                  className="flex-1 accent-primary h-1.5"
                />
                <span className="text-sm font-mono text-foreground w-12 text-right">{terminalPS}x</span>
              </div>
              <p className="text-[10px] text-text-muted">Current P/S: {formatNumber(currentPS, 1)}x</p>
            </div>

            {/* Discount Rate */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-secondary">Desired Annual Return</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={5}
                  max={25}
                  step={0.5}
                  value={discountRate}
                  onChange={(e) => setDiscountRate(Number(e.target.value))}
                  className="flex-1 accent-primary h-1.5"
                />
                <span className="text-sm font-mono text-foreground w-12 text-right">{discountRate.toFixed(1)}%</span>
              </div>
            </div>

            {/* Growth Mode */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-secondary">Revenue Growth Mode</label>
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
                <label className="text-xs font-medium text-text-secondary">Annual Revenue Growth Rate</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={-30}
                    max={100}
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
        </CardContent>
      </Card>

      {/* Chart — Revenue projection bars + YoY growth line */}
      {result && chartData.length > 0 && (
        <Card className="bg-surface border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm uppercase tracking-wider text-text-muted">
              {years}-Year Revenue Projection
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
                    yAxisId="revenue"
                    tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) => formatCompact(v)}
                  />
                  <YAxis
                    yAxisId="growth"
                    orientation="right"
                    tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) => `${v.toFixed(0)}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(value, name) => {
                      const v = Number(value);
                      if (name === 'revenue') return [formatLargeNumber(v), 'Revenue'];
                      return [`${formatNumber(v, 1)}%`, 'YoY Growth'];
                    }}
                    labelStyle={{ color: 'var(--text-secondary)' }}
                  />
                  <Bar dataKey="revenue" name="revenue" yAxisId="revenue" radius={[4, 4, 0, 0]} barSize={40}>
                    {chartData.map((_, index) => (
                      <Cell
                        key={index}
                        fill={index === 0 ? CHART_COLORS[5] : CHART_COLORS[0]}
                        opacity={index === 0 ? 0.6 : 0.85}
                      />
                    ))}
                  </Bar>
                  <Line
                    dataKey="yoyGrowth"
                    name="yoyGrowth"
                    yAxisId="growth"
                    stroke={CHART_COLORS[1]}
                    strokeWidth={2}
                    dot={{ fill: CHART_COLORS[1], r: 4 }}
                    connectNulls
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center gap-6 mt-3 text-xs text-text-muted">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-3 w-3 rounded-sm" style={{ backgroundColor: CHART_COLORS[0] }} />
                Projected Revenue
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: CHART_COLORS[1] }} />
                YoY Growth %
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
              Revenue Projection Detail
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
                    <td className="px-3 py-2 font-medium text-text-secondary">Revenue</td>
                    {result.projections.map((p) => (
                      <td key={p.year} className="px-3 py-2 text-right font-mono text-foreground">
                        {formatLargeNumber(p.revenue)}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="px-3 py-2 font-medium text-text-secondary">Rev / Share</td>
                    {result.projections.map((p) => (
                      <td key={p.year} className="px-3 py-2 text-right font-mono text-foreground">
                        ${formatNumber(p.revenuePerShare, 2)}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-medium text-text-secondary">YoY Growth</td>
                    {result.projections.map((p) => (
                      <td key={p.year} className="px-3 py-2 text-right font-mono text-text-secondary">
                        {p.yoyGrowth != null ? formatPercent(p.yoyGrowth * 100, 1) : '—'}
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
              <ValuationItem label={`Year ${years} Revenue`} value={formatLargeNumber(result.terminalRevenue)} />
              <ValuationItem label="Rev / Share" value={`$${formatNumber(result.terminalRevenuePerShare, 2)}`} />
              <ValuationItem label="Terminal P/S Multiple" value={`${formatNumber(result.terminalPS, 1)}x`} />
              <ValuationItem label={`Projected Price (Year ${years})`} value={`$${formatNumber(result.projectedPrice, 2)}`} highlight />
              <ValuationItem label="Discount Rate" value={`${discountRate.toFixed(1)}%`} />
              <ValuationItem label="Discount Factor" value={formatNumber(result.discountFactor, 4)} />
            </div>

            <div className="mt-6 pt-4 border-t border-border flex flex-wrap items-center gap-6">
              <div className="space-y-0.5">
                <span className="text-xs text-text-muted">Fair Value Today</span>
                <p className="text-lg font-semibold text-foreground font-mono">${formatNumber(result.fairValue, 2)}</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-xs text-text-muted">Current Price</span>
                <p className="text-lg font-semibold text-foreground font-mono">${formatNumber(currentPrice, 2)}</p>
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

function formatCompact(v: number): string {
  const abs = Math.abs(v);
  const sign = v < 0 ? '-' : '';
  if (abs >= 1e12) return `${sign}${(abs / 1e12).toFixed(1)}T`;
  if (abs >= 1e9) return `${sign}${(abs / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `${sign}${(abs / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `${sign}${(abs / 1e3).toFixed(1)}K`;
  return v.toFixed(0);
}

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
