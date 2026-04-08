'use client';

import type { StatementType } from '@/config/financial-line-items';
import { STATEMENT_CONFIGS } from '@/config/financial-line-items';
import type { DataUnit } from '@/lib/utils/format';
import { UNIT_LABEL_SINGULAR } from '@/lib/utils/format';

export type DepthLimit = 10 | 20 | 40;

interface ControlsBarProps {
  activeStatement: StatementType;
  activePeriod: 'annual' | 'quarter';
  activeLimit: DepthLimit;
  activeUnit: DataUnit;
  onStatementChange: (statement: StatementType) => void;
  onPeriodChange: (period: 'annual' | 'quarter') => void;
  onLimitChange: (limit: DepthLimit) => void;
  onUnitChange: (unit: DataUnit) => void;
  isLoading: boolean;
}

const PERIODS = [
  { value: 'annual' as const, label: 'Annual' },
  { value: 'quarter' as const, label: 'Quarterly' },
];

const DEPTH_OPTIONS: DepthLimit[] = [10, 20, 40];

const UNIT_OPTIONS: DataUnit[] = ['K', 'M', 'B'];

export function ControlsBar({
  activeStatement,
  activePeriod,
  activeLimit,
  activeUnit,
  onStatementChange,
  onPeriodChange,
  onLimitChange,
  onUnitChange,
  isLoading,
}: ControlsBarProps) {
  const depthSuffix = activePeriod === 'annual' ? 'Y' : 'Q';

  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      {/* Statement sub-tabs */}
      <div className="flex gap-1 pb-0.5">
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

      <div className="flex flex-wrap items-end gap-4">
        {/* Unit toggle — K / M / B */}
        <div className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-wider text-text-muted font-medium">
            Units
          </span>
          <div className="flex rounded-lg bg-background p-0.5">
            {UNIT_OPTIONS.map((unit) => (
              <button
                key={unit}
                onClick={() => onUnitChange(unit)}
                disabled={isLoading}
                title={UNIT_LABEL_SINGULAR[unit]}
                className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  activeUnit === unit
                    ? 'bg-surface-hover text-foreground'
                    : 'text-text-secondary hover:text-foreground'
                } disabled:opacity-50`}
              >
                {unit}
              </button>
            ))}
          </div>
        </div>

        {/* Depth toggle */}
        <div className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-wider text-text-muted font-medium">
            History
          </span>
          <div className="flex rounded-lg bg-background p-0.5">
            {DEPTH_OPTIONS.map((depth) => (
              <button
                key={depth}
                onClick={() => onLimitChange(depth)}
                disabled={isLoading}
                title={`Show ${depth} ${activePeriod === 'annual' ? 'years' : 'quarters'} of history`}
                className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  activeLimit === depth
                    ? 'bg-surface-hover text-foreground'
                    : 'text-text-secondary hover:text-foreground'
                } disabled:opacity-50`}
              >
                {depth}{depthSuffix}
              </button>
            ))}
          </div>
        </div>

        {/* Period toggle */}
        <div className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-wider text-text-muted font-medium">
            Period
          </span>
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
      </div>
    </div>
  );
}
