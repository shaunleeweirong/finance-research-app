import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getUserPlan } from '@/lib/auth/get-user-plan';
import { canAccess } from '@/lib/auth/plans';
import { UpgradePrompt } from '@/components/paywall/upgrade-prompt';
import { AppNav } from '@/components/app/app-nav';
import { WatchlistTable, type WatchlistRow } from '@/components/watchlist/watchlist-table';
import { getBatchProfiles, getBatchQuotes } from '@/lib/fmp';

interface WatchlistRecord {
  ticker: string;
  created_at: string;
}

export default async function WatchlistPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const userPlan = await getUserPlan(user.id);
  if (!canAccess(userPlan, 'watchlist:basic')) {
    return (
      <>
        <AppNav />
        <main className="min-h-screen px-4 py-8">
          <div className="mx-auto max-w-5xl">
            <UpgradePrompt
              feature="watchlist:basic"
              title="Watchlist is a Pro feature"
              description="Save stocks, revisit your ideas, and track names you are researching with a Pro plan."
            />
          </div>
        </main>
      </>
    );
  }

  const { data, error } = await supabase
    .from('watchlist')
    .select('ticker, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return (
      <>
        <AppNav />
        <main className="min-h-screen px-4 py-8">
          <div className="mx-auto max-w-5xl">
            <div className="rounded-xl border border-red-600/30 bg-red-600/10 px-6 py-8 text-center">
              <h2 className="text-lg font-semibold text-red-400">Unable to load watchlist</h2>
              <p className="mt-2 text-sm text-red-300">Please try refreshing the page or contact support.</p>
            </div>
          </div>
        </main>
      </>
    );
  }

  const records: WatchlistRecord[] = data ?? [];
  const tickers = records.map((r) => r.ticker);

  // Batch fetch — 2 API calls total instead of 2 per ticker
  const [profiles, quotes] = await Promise.all([
    getBatchProfiles(tickers),
    getBatchQuotes(tickers),
  ]);

  const profileMap = new Map(profiles.map((p) => [p.symbol, p]));
  const quoteMap = new Map(quotes.map((q) => [q.symbol, q]));

  const rows: WatchlistRow[] = records.map((record) => {
    const profile = profileMap.get(record.ticker);
    const quote = quoteMap.get(record.ticker);
    return {
      ticker: record.ticker,
      companyName: profile?.companyName ?? quote?.name ?? record.ticker,
      price: quote?.price ?? profile?.price ?? null,
      changePercent: quote?.changesPercentage ?? null,
      createdAt: record.created_at,
    };
  });

  return (
    <>
      <AppNav />
      <main className="min-h-screen px-4 py-8 sm:py-10">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Watchlist</h1>
              <p className="mt-1 text-sm text-text-secondary">
                Track your saved tickers and jump back into deep research.
              </p>
            </div>
            <Link
              href="/"
              className="rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-surface"
            >
              Search stocks
            </Link>
          </div>

          <WatchlistTable initialItems={rows} />
        </div>
      </main>
    </>
  );
}
