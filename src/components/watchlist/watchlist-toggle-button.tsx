'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WatchlistToggleButtonProps {
  ticker: string;
  initiallyWatchlisted: boolean;
}

export function WatchlistToggleButton({
  ticker,
  initiallyWatchlisted,
}: WatchlistToggleButtonProps) {
  const [isWatchlisted, setIsWatchlisted] = useState(initiallyWatchlisted);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggleWatchlist() {
    if (isSaving) return;

    setIsSaving(true);
    setError(null);

    try {
      const endpoint = isWatchlisted
        ? '/api/watchlist/remove'
        : '/api/watchlist/add';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? 'Unable to update watchlist');
      }

      setIsWatchlisted((current) => !current);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to update watchlist';
      setError(message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        onClick={toggleWatchlist}
        variant={isWatchlisted ? 'secondary' : 'outline'}
        size="sm"
        disabled={isSaving}
        aria-label={isWatchlisted ? 'Remove from watchlist' : 'Add to watchlist'}
      >
        <Star
          className={`h-4 w-4 ${isWatchlisted ? 'fill-current' : ''}`}
        />
        {isWatchlisted ? 'Saved' : 'Save'}
      </Button>
      {error ? (
        <p className="text-xs text-negative">{error}</p>
      ) : null}
    </div>
  );
}
