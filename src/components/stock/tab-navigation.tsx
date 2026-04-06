'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const TABS = [
  { value: 'overview', label: 'Overview' },
  { value: 'financials', label: 'Financials' },
  { value: 'news', label: 'News' },
  { value: 'estimates', label: 'Estimates' },
  { value: 'ownership', label: 'Ownership' },
  { value: 'filings', label: 'Filings' },
] as const;

export function TabNavigation({ children, ticker }: { children: React.ReactNode; ticker: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';

  function handleTabChange(value: string) {
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
        {TABS.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className="rounded-none border-b-2 border-transparent data-active:border-primary data-active:bg-transparent data-active:text-foreground text-text-secondary px-4 py-3 text-sm font-medium"
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      <div className="mt-6">{children}</div>
    </Tabs>
  );
}
