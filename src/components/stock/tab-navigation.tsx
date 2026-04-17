'use client';

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
  activeTab = 'overview',
  onTabChange,
}: {
  children: React.ReactNode;
  ticker: string;
  plan?: Plan;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}) {
  function handleTabChange(value: string) {
    if (!canAccess(plan, `tab:${value}`)) return;
    onTabChange?.(value);
  }

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange}>
      <TabsList
        variant="line"
        className="w-full justify-start bg-surface border-b border-border rounded-none h-auto p-0 gap-0 overflow-x-auto scrollbar-none"
      >
        {TABS.map((tab) => {
          const locked = !canAccess(plan, `tab:${tab.value}`);
          return (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              disabled={locked}
              className={`rounded-none border-b-2 border-transparent data-active:border-primary data-active:bg-transparent data-active:text-foreground text-text-secondary px-3 sm:px-4 py-3 text-sm font-medium whitespace-nowrap ${
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
