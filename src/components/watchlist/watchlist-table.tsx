'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatPercent } from '@/lib/utils/format';

export type WatchlistSort = 'recent' | 'ticker-asc' | 'change-desc';

export interface WatchlistRow {
  ticker: string;
  companyName: string;
  price: number | null;
  changePercent: number | null;
  createdAt: string;
}

interface WatchlistTableProps {
  initialItems: WatchlistRow[];
}

export function WatchlistTable({ initialItems }: WatchlistTableProps) {
  const [items, setItems] = useState(initialItems);
  const [sort, setSort] = useState<WatchlistSort>('recent');
  const [query, setQuery] = useState('');
  const [pendingTicker, setPendingTicker] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    const visible = !normalizedQuery
      ? items
      : items.filter((item) =>
          item.ticker.toLowerCase().includes(normalizedQuery) ||
          item.companyName.toLowerCase().includes(normalizedQuery)
        );

    const sorted = [...visible];
    switch (sort) {
      case 'ticker-asc':
        sorted.sort((a, b) => a.ticker.localeCompare(b.ticker));
        break;
      case 'change-desc':
        sorted.sort((a, b) => (b.changePercent ?? Number.NEGATIVE_INFINITY) - (a.changePercent ?? Number.NEGATIVE_INFINITY));
        break;
      case 'recent':
      default:
        sorted.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
    }

    return sorted;
  }, [items, query, sort]);

  async function removeTicker(ticker: string) {
    setPendingTicker(ticker);
    setError(null);
    try {
      const response = await fetch('/api/watchlist/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? 'Failed to remove from watchlist');
        return;
      }

      setItems((current) => current.filter((item) => item.ticker !== ticker));
      setError(null);
    } catch (err) {
      setError('An error occurred');
    } finally {
      setPendingTicker(null);
    }
  }

  if (!items.length) {
    return (
      <div className="rounded-xl border border-border bg-surface p-8 text-center">
        <h2 className="text-lg font-semibold text-foreground">Your watchlist is empty</h2>
        <p className="mt-2 text-sm text-text-secondary">
          Visit a stock page and click Save to start building your list.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error ? (
        <div className="rounded-lg border border-negative/30 bg-negative/10 px-4 py-3 text-sm text-negative">
          {error}
        </div>
      ) : null}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Filter by ticker or company"
          className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring sm:max-w-xs"
        />
        <select
          value={sort}
          onChange={(event) => setSort(event.target.value as WatchlistSort)}
          className="h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="recent">Recently added</option>
          <option value="ticker-asc">Ticker A-Z</option>
          <option value="change-desc">Daily change (high to low)</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full min-w-[600px] text-sm">
          <thead className="bg-surface-hover text-left text-xs uppercase tracking-wide text-text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Ticker</th>
              <th className="px-4 py-3 font-medium">Company</th>
              <th className="px-4 py-3 font-medium text-right">Price</th>
              <th className="px-4 py-3 font-medium text-right">Daily %</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item) => {
              const positive = (item.changePercent ?? 0) >= 0;

              return (
                <tr key={item.ticker} className="border-t border-border">
                  <td className="px-4 py-3 font-semibold text-foreground">{item.ticker}</td>
                  <td className="px-4 py-3 text-text-secondary">{item.companyName}</td>
                  <td className="px-4 py-3 text-right font-mono text-foreground">
                    {formatCurrency(item.price)}
                  </td>
                  <td className={`px-4 py-3 text-right font-mono ${positive ? 'text-positive' : 'text-negative'}`}>
                    {formatPercent(item.changePercent, 2)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/stock/${item.ticker}`}>
                        <Button size="sm" variant="outline">
                          <ArrowUpRight className="h-3.5 w-3.5" />
                          Open
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={pendingTicker === item.ticker}
                        onClick={() => removeTicker(item.ticker)}
                      >
                        <X className="h-3.5 w-3.5" />
                        Remove
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
