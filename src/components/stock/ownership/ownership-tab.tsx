'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { formatNumber, formatLargeNumber } from '@/lib/utils/format';
import type { FMPInstitutionalHolder, FMPInsiderTrade } from '@/lib/fmp/types';

interface OwnershipTabProps {
  holders: FMPInstitutionalHolder[];
  insiderTrades: FMPInsiderTrade[];
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function InstitutionalTable({ holders }: { holders: FMPInstitutionalHolder[] }) {
  if (holders.length === 0) {
    return <p className="text-center text-sm text-text-muted py-8">No institutional holder data available.</p>;
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-background">
            <th className="px-4 py-3 text-left text-xs font-medium text-text-muted">Holder</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-text-muted">Shares</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-text-muted">Change</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-text-muted">Date Reported</th>
          </tr>
        </thead>
        <tbody>
          {holders.slice(0, 25).map((holder, i) => {
            const changePositive = (holder.change ?? 0) > 0;
            const changeNegative = (holder.change ?? 0) < 0;
            return (
              <tr key={`${holder.holder}-${i}`} className="border-b border-border hover:bg-surface-hover">
                <td className="px-4 py-2.5 text-foreground font-medium">{holder.holder}</td>
                <td className="px-4 py-2.5 text-right font-mono text-foreground">
                  {holder.shares !== null ? formatNumber(holder.shares) : 'N/A'}
                </td>
                <td className={`px-4 py-2.5 text-right font-mono ${changePositive ? 'text-positive' : changeNegative ? 'text-negative' : 'text-text-muted'}`}>
                  {holder.change !== null ? `${changePositive ? '+' : ''}${formatNumber(holder.change)}` : 'N/A'}
                </td>
                <td className="px-4 py-2.5 text-right text-text-secondary">{formatDate(holder.dateReported)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function InsiderTable({ trades }: { trades: FMPInsiderTrade[] }) {
  if (trades.length === 0) {
    return <p className="text-center text-sm text-text-muted py-8">No insider trading data available.</p>;
  }

  function getTransactionBadge(type: string, disposition: string) {
    // A = Acquisition (buy), D = Disposition (sell)
    if (disposition === 'A') return { label: 'Buy', className: 'bg-positive/20 text-positive' };
    if (disposition === 'D') return { label: 'Sell', className: 'bg-negative/20 text-negative' };
    return { label: type, className: 'bg-muted text-muted-foreground' };
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-background">
            <th className="px-4 py-3 text-left text-xs font-medium text-text-muted">Insider</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-text-muted">Type</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-text-muted">Shares</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-text-muted">Price</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-text-muted">Date</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((trade, i) => {
            const badge = getTransactionBadge(trade.transactionType, trade.acquistionOrDisposition);
            return (
              <tr key={`${trade.reportingName}-${trade.transactionDate}-${i}`} className="border-b border-border hover:bg-surface-hover">
                <td className="px-4 py-2.5">
                  <div className="text-foreground font-medium">{trade.reportingName}</div>
                  <div className="text-xs text-text-muted">{trade.typeOfOwner}</div>
                </td>
                <td className="px-4 py-2.5">
                  <Badge variant="secondary" className={`text-xs ${badge.className}`}>
                    {badge.label}
                  </Badge>
                </td>
                <td className="px-4 py-2.5 text-right font-mono text-foreground">
                  {trade.securitiesTransacted !== null ? formatNumber(trade.securitiesTransacted) : 'N/A'}
                </td>
                <td className="px-4 py-2.5 text-right font-mono text-foreground">
                  {trade.price !== null && trade.price > 0 ? `$${trade.price.toFixed(2)}` : '—'}
                </td>
                <td className="px-4 py-2.5 text-right text-text-secondary">{formatDate(trade.transactionDate)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function OwnershipTab({ holders, insiderTrades }: OwnershipTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<'institutional' | 'insider'>('institutional');

  return (
    <div className="space-y-4">
      {/* Sub-tabs */}
      <div className="flex gap-1">
        <button
          onClick={() => setActiveSubTab('institutional')}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            activeSubTab === 'institutional'
              ? 'bg-primary text-primary-foreground'
              : 'text-text-secondary hover:bg-surface-hover hover:text-foreground'
          }`}
        >
          Institutional Holders
        </button>
        <button
          onClick={() => setActiveSubTab('insider')}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            activeSubTab === 'insider'
              ? 'bg-primary text-primary-foreground'
              : 'text-text-secondary hover:bg-surface-hover hover:text-foreground'
          }`}
        >
          Insider Trading
        </button>
      </div>

      {/* Content */}
      {activeSubTab === 'institutional' ? (
        <InstitutionalTable holders={holders} />
      ) : (
        <InsiderTable trades={insiderTrades} />
      )}
    </div>
  );
}
