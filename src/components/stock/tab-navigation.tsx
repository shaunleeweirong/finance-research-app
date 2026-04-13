'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Lock } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Plan } from '@/lib/auth/plans';
import { canAccess } from '@/lib/auth/plans';

const TABS = [
  { value: 'overview', label: 'Overview' },
  { value: 'financials', label: 'Financials' },
  { value: 'news', label: 'News' },
  { value: 'estimates', label: 'Estimates' },
  { value: 'ownership', label: 'Ownership' },
  { value: 'filings', label: 'Filings' },
  { value: 'valuation', label: 'Valuation' },
] as const;

export function TabNavigation({
  children,
  ticker,
  plan = 'free',
}: {
  children: React.ReactNode;
  ticker: string;
  plan?: Plan;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';

  function handleTabChange(value: string) {
    // Prevent switching to locked tabs
    if (!canAccess(plan, `tab:${value}`)) return;

    const params = new URLSearchParams(searchParams.toString());
    if (value === 'overview') {
      params.delete('tab');
    } else {
      params.set('tab', value);
    }
    const query = params.toString();
    router.push(`/stock/${ticker}${query ? `?${query}` : ''}`, { scroll: false });
  }

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange}>
      <TabsList
        variant="line"
        className="w-full justify-start bg-surface border-b border-border rounded-none h-auto p-0 gap-0"
      >
        {TABS.map((tab) => {
          const locked = !canAccess(plan, `tab:${tab.value}`);
          return (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              disabled={locked}
              className={`rounded-none border-b-2 border-transparent data-active:border-primary data-active:bg-transparent data-active:text-foreground text-text-secondary px-4 py-3 text-sm font-medium ${
                locked ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <span className="flex items-center gap-1.5">
                {tab.label}
                {locked && <Lock className="h-3 w-3" />}
              </span>
            </TabsTrigger>
          );
        })}
      </TabsList>
      <div className="mt-6">{children}</div>
    </Tabs>
  );
}
