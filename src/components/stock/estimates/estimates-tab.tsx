'use client';

import { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { Card } from '@/components/ui/card';
import { formatLargeNumber, formatCompactNumber } from '@/lib/utils/format';
import type { FMPAnalystEstimate } from '@/lib/fmp/types';

interface EstimatesTabProps {
  estimates: FMPAnalystEstimate[];
}

export function EstimatesTab({ estimates }: EstimatesTabProps) {
  // Reverse so oldest is first (left side of chart)
  const chartData = useMemo(() => {
    return [...estimates].reverse().map((e) => ({
      year: e.date.split('-')[0],
      revLow: e.estimatedRevenueLow,
      revAvg: e.estimatedRevenueAvg,
      revHigh: e.estimatedRevenueHigh,
      ebitdaLow: e.estimatedEbitdaLow,
      ebitdaAvg: e.estimatedEbitdaAvg,
      ebitdaHigh: e.estimatedEbitdaHigh,
      epsLow: e.estimatedEpsLow,
      epsAvg: e.estimatedEpsAvg,
      epsHigh: e.estimatedEpsHigh,
    }));
  }, [estimates]);

  if (estimates.length === 0) {
    return (
      <Card className="bg-surface border-border p-12 text-center">
        <p className="text-text-muted">No analyst estimates available for this company.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Revenue Estimates Chart */}
      <Card className="bg-surface border-border p-4">
        <h3 className="mb-4 text-sm font-medium text-text-secondary">Revenue Estimates</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey="year"
                tick={{ fill: '#64748b', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fill: '#64748b', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => formatCompactNumber(v)}
                width={70}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#111827',
                  border: '1px solid #1e293b',
                  borderRadius: '8px',
                  color: '#f1f5f9',
                  fontSize: '12px',
                }}
                formatter={(value) => [typeof value === 'number' ? formatLargeNumber(value) : String(value ?? '')]}
              />
              <Legend
                wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }}
              />
              <Bar dataKey="revLow" name="Low" fill="#3b82f6" opacity={0.4} radius={[2, 2, 0, 0]} />
              <Bar dataKey="revAvg" name="Average" fill="#3b82f6" radius={[2, 2, 0, 0]} />
              <Bar dataKey="revHigh" name="High" fill="#3b82f6" opacity={0.6} radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Estimates Table */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-background">
              <th className="sticky left-0 bg-background px-4 py-3 text-left text-xs font-medium text-text-muted">Year</th>
              <th className="px-3 py-3 text-right text-xs font-medium text-text-muted" colSpan={3}>Revenue</th>
              <th className="px-3 py-3 text-right text-xs font-medium text-text-muted" colSpan={3}>EBITDA</th>
              <th className="px-3 py-3 text-right text-xs font-medium text-text-muted" colSpan={3}>EPS</th>
            </tr>
            <tr className="border-b border-border bg-background">
              <th className="sticky left-0 bg-background px-4 py-1.5"></th>
              <th className="px-3 py-1.5 text-right text-xs text-text-muted font-normal">Low</th>
              <th className="px-3 py-1.5 text-right text-xs text-text-muted font-normal">Avg</th>
              <th className="px-3 py-1.5 text-right text-xs text-text-muted font-normal">High</th>
              <th className="px-3 py-1.5 text-right text-xs text-text-muted font-normal">Low</th>
              <th className="px-3 py-1.5 text-right text-xs text-text-muted font-normal">Avg</th>
              <th className="px-3 py-1.5 text-right text-xs text-text-muted font-normal">High</th>
              <th className="px-3 py-1.5 text-right text-xs text-text-muted font-normal">Low</th>
              <th className="px-3 py-1.5 text-right text-xs text-text-muted font-normal">Avg</th>
              <th className="px-3 py-1.5 text-right text-xs text-text-muted font-normal">High</th>
            </tr>
          </thead>
          <tbody>
            {estimates.map((est) => (
              <tr key={est.date} className="border-b border-border hover:bg-surface-hover">
                <td className="sticky left-0 bg-surface px-4 py-2.5 font-medium text-foreground">
                  {est.date.split('-')[0]}
                </td>
                <td className="px-3 py-2.5 text-right font-mono text-text-secondary">{formatLargeNumber(est.estimatedRevenueLow)}</td>
                <td className="px-3 py-2.5 text-right font-mono text-foreground">{formatLargeNumber(est.estimatedRevenueAvg)}</td>
                <td className="px-3 py-2.5 text-right font-mono text-text-secondary">{formatLargeNumber(est.estimatedRevenueHigh)}</td>
                <td className="px-3 py-2.5 text-right font-mono text-text-secondary">{formatLargeNumber(est.estimatedEbitdaLow)}</td>
                <td className="px-3 py-2.5 text-right font-mono text-foreground">{formatLargeNumber(est.estimatedEbitdaAvg)}</td>
                <td className="px-3 py-2.5 text-right font-mono text-text-secondary">{formatLargeNumber(est.estimatedEbitdaHigh)}</td>
                <td className="px-3 py-2.5 text-right font-mono text-text-secondary">{est.estimatedEpsLow?.toFixed(2) ?? 'N/A'}</td>
                <td className="px-3 py-2.5 text-right font-mono text-foreground">{est.estimatedEpsAvg?.toFixed(2) ?? 'N/A'}</td>
                <td className="px-3 py-2.5 text-right font-mono text-text-secondary">{est.estimatedEpsHigh?.toFixed(2) ?? 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
