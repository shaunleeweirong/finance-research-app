'use client';

import type { StatementType } from '@/config/financial-line-items';
import { STATEMENT_CONFIGS } from '@/config/financial-line-items';

interface ControlsBarProps {
  activeStatement: StatementType;
  activePeriod: 'annual' | 'quarter';
  onStatementChange: (statement: StatementType) => void;
  onPeriodChange: (period: 'annual' | 'quarter') => void;
  isLoading: boolean;
}

const PERIODS = [
  { value: 'annual' as const, label: 'Annual' },
  { value: 'quarter' as const, label: 'Quarterly' },
];

export function ControlsBar({
  activeStatement,
  activePeriod,
  onStatementChange,
  onPeriodChange,
  isLoading,
}: ControlsBarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      {/* Statement sub-tabs */}
      <div className="flex gap-1">
        {(Object.keys(STATEMENT_CONFIGS) as StatementType[]).map((key) => (
          <button
            key={key}
            onClick={() => onStatementChange(key)}
            disabled={isLoading}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              activeStatement === key
                ? 'bg-primary text-primary-foreground'
                : 'text-text-secondary hover:bg-surface-hover hover:text-foreground'
            } disabled:opacity-50`}
          >
            {STATEMENT_CONFIGS[key].label}
          </button>
        ))}
      </div>

      {/* Period toggle */}
      <div className="flex rounded-lg bg-background p-0.5">
        {PERIODS.map((period) => (
          <button
            key={period.value}
            onClick={() => onPeriodChange(period.value)}
            disabled={isLoading}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              activePeriod === period.value
                ? 'bg-surface-hover text-foreground'
                : 'text-text-secondary hover:text-foreground'
            } disabled:opacity-50`}
          >
            {period.label}
          </button>
        ))}
      </div>
    </div>
  );
}
