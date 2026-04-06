'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import type { FMPSecFiling } from '@/lib/fmp/types';

interface FilingsTabProps {
  filings: FMPSecFiling[];
}

const FILING_TYPES = ['All', '10-K', '10-Q', '8-K'] as const;

function getTypeBadgeColor(type: string): string {
  if (type === '10-K') return 'bg-chart-1/20 text-chart-1';
  if (type === '10-Q') return 'bg-chart-3/20 text-chart-3';
  if (type === '8-K') return 'bg-chart-2/20 text-chart-2';
  return 'bg-muted text-muted-foreground';
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function FilingsTab({ filings }: FilingsTabProps) {
  const [activeFilter, setActiveFilter] = useState<string>('All');

  const filtered = activeFilter === 'All'
    ? filings
    : filings.filter((f) => f.type === activeFilter);

  if (filings.length === 0) {
    return (
      <Card className="bg-surface border-border p-12 text-center">
        <p className="text-text-muted">No SEC filings available for this company.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter buttons */}
      <div className="flex gap-1">
        {FILING_TYPES.map((type) => (
          <button
            key={type}
            onClick={() => setActiveFilter(type)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              activeFilter === type
                ? 'bg-primary text-primary-foreground'
                : 'text-text-secondary hover:bg-surface-hover hover:text-foreground'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-background">
              <th className="px-4 py-3 text-left text-xs font-medium text-text-muted">Type</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-muted">Filing Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-muted">Accepted Date</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-text-muted">Link</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((filing, index) => (
              <tr
                key={`${filing.type}-${filing.fillingDate}-${index}`}
                className="border-b border-border transition-colors hover:bg-surface-hover"
              >
                <td className="px-4 py-3">
                  <Badge variant="secondary" className={`text-xs ${getTypeBadgeColor(filing.type)}`}>
                    {filing.type}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-foreground">{formatDate(filing.fillingDate)}</td>
                <td className="px-4 py-3 text-text-secondary">{formatDate(filing.acceptedDate)}</td>
                <td className="px-4 py-3 text-right">
                  <a
                    href={filing.finalLink || filing.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >
                    View
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M3.5 8.5l5-5M4 3.5h4.5V8" />
                    </svg>
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-sm text-text-muted py-8">
          No {activeFilter} filings found.
        </p>
      )}
    </div>
  );
}
