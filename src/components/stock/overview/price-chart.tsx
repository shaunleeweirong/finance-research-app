'use client';

import { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { Card } from '@/components/ui/card';
import { getDateRangeForPeriod, type TimeRange } from '@/lib/utils/chart-helpers';
import type { FMPHistoricalPrice } from '@/lib/fmp/types';

const TIME_RANGES: TimeRange[] = ['1D', '1W', '1M', '3M', '6M', '1Y', '5Y', 'ALL'];

interface PriceChartProps {
  ticker: string;
  initialData: FMPHistoricalPrice[];
}

export function PriceChart({ ticker, initialData }: PriceChartProps) {
  const [activeRange, setActiveRange] = useState<TimeRange>('1Y');
  const [data, setData] = useState<FMPHistoricalPrice[]>(initialData);
  const [isLoading, setIsLoading] = useState(false);

  const chartData = useMemo(() => {
    return [...data].reverse().map((d) => ({
      date: d.date,
      price: d.close,
      volume: d.volume,
    }));
  }, [data]);

  const isPositive = chartData.length >= 2 && (chartData[chartData.length - 1].price ?? 0) >= (chartData[0].price ?? 0);
  const chartColor = isPositive ? '#22c55e' : '#ef4444';

  async function handleRangeChange(range: TimeRange) {
    setActiveRange(range);
    setIsLoading(true);
    try {
      if (range === '1D') {
        const res = await fetch(`/api/fmp/intraday/${ticker}`);
        if (res.ok) {
          const intraday = await res.json();
          setData(
            intraday.map((d: { date: string; close: number; volume: number; open: number; high: number; low: number }) => ({
              date: d.date,
              close: d.close,
              volume: d.volume,
              open: d.open,
              high: d.high,
              low: d.low,
            }))
          );
        }
      } else {
        const { from, to } = getDateRangeForPeriod(range);
        const res = await fetch(`/api/fmp/historical/${ticker}?from=${from}&to=${to}`);
        if (res.ok) {
          const json = await res.json();
          setData(json.historical || []);
        }
      }
    } catch {
      // Keep existing data on error
    } finally {
      setIsLoading(false);
    }
  }

  function formatXLabel(date: string) {
    const d = new Date(date);
    if (activeRange === '1D') return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    if (activeRange === '1W' || activeRange === '1M') return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (activeRange === '1Y' || activeRange === '3M' || activeRange === '6M') return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    return d.getFullYear().toString();
  }

  return (
    <Card className="bg-surface border-border p-4">
      {/* Time range buttons */}
      <div className="mb-4 flex gap-1">
        {TIME_RANGES.map((range) => (
          <button
            key={range}
            onClick={() => handleRangeChange(range)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              activeRange === range
                ? 'bg-primary text-primary-foreground'
                : 'text-text-secondary hover:bg-surface-hover hover:text-foreground'
            }`}
          >
            {range}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className={`h-72 ${isLoading ? 'opacity-50' : ''}`}>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
              <defs>
                <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={chartColor} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={chartColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey="date"
                tickFormatter={formatXLabel}
                tick={{ fill: '#cbd5e1', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                minTickGap={50}
              />
              <YAxis
                domain={['auto', 'auto']}
                tick={{ fill: '#cbd5e1', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => `$${v.toFixed(0)}`}
                width={60}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#111827',
                  border: '1px solid #1e293b',
                  borderRadius: '8px',
                  color: '#f8fafc',
                  fontSize: '13px',
                }}
                labelFormatter={(label) =>
                  new Date(label as string).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })
                }
                formatter={(value) => [`$${(value as number).toFixed(2)}`, 'Price']}
              />
              <Area
                type="monotone"
                dataKey="price"
                stroke={chartColor}
                strokeWidth={2}
                fill="url(#priceGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-text-muted">
            No price data available
          </div>
        )}
      </div>
    </Card>
  );
}
