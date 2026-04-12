import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getUserPlan } from '@/lib/auth/get-user-plan';
import { canAccess } from '@/lib/auth/plans';
import { UpgradePrompt } from '@/components/paywall/upgrade-prompt';
import { SearchBar } from '@/components/search/search-bar';
import { UserMenu } from '@/components/auth/user-menu';
import { WatchlistTable, type WatchlistRow } from '@/components/watchlist/watchlist-table';
import { getCompanyProfile, getQuote } from '@/lib/fmp';

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
      <main className="min-h-screen px-4 py-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 flex items-center justify-between">
            <Link href="/" className="text-lg font-bold text-foreground">
              FinanceResearch
            </Link>
            <UserMenu />
          </div>
          <UpgradePrompt
            feature="watchlist:basic"
            title="Watchlist is a Pro feature"
            description="Save stocks, revisit your ideas, and track names you are researching with a Pro plan."
          />
        </div>
      </main>
    );
  }

  const { data, error } = await supabase
    .from('watchlist')
    .select('ticker, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return (
      <main className="min-h-screen px-4 py-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 flex items-center justify-between">
            <Link href="/" className="text-lg font-bold text-foreground">
              FinanceResearch
            </Link>
            <UserMenu />
          </div>
          <div className="rounded-xl border border-red-600/30 bg-red-600/10 px-6 py-8 text-center">
            <h2 className="text-lg font-semibold text-red-400">Unable to load watchlist</h2>
            <p className="mt-2 text-sm text-red-300">Please try refreshing the page or contact support.</p>
          </div>
        </div>
      </main>
    );
  }

  const records: WatchlistRecord[] = data ?? [];

  const rows = await Promise.all(
    records.map(async (record): Promise<WatchlistRow> => {
      const [profile, quote] = await Promise.all([
        getCompanyProfile(record.ticker),
        getQuote(record.ticker),
      ]);

      return {
        ticker: record.ticker,
        companyName: profile?.companyName ?? quote?.name ?? record.ticker,
        price: quote?.price ?? profile?.price ?? null,
        changePercent: quote?.changesPercentage ?? null,
        createdAt: record.created_at,
      };
    })
  );

  return (
    <main className="min-h-screen px-4 py-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="max-w-md flex-1">
            <SearchBar />
          </div>
          <div className="ml-6 shrink-0">
            <UserMenu />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Watchlist</h1>
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
  );
}
