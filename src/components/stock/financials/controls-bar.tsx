'use client';

import { Download, Lock } from 'lucide-react';
import type { StatementType } from '@/config/financial-line-items';
import { STATEMENT_CONFIGS } from '@/config/financial-line-items';
import type { DataUnit } from '@/lib/utils/format';
import { UNIT_LABEL_SINGULAR } from '@/lib/utils/format';
import type { Plan } from '@/lib/auth/plans';
import { canAccess } from '@/lib/auth/plans';

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
  plan?: Plan;
  showChange?: boolean;
  onShowChangeToggle?: () => void;
  onExport?: () => void;
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
  plan = 'free',
  showChange = false,
  onShowChangeToggle,
  onExport,
}: ControlsBarProps) {
  const depthSuffix = activePeriod === 'annual' ? 'Y' : 'Q';

  // Filter statement tabs — hide segments for free users
  const visibleStatements = (Object.keys(STATEMENT_CONFIGS) as StatementType[]).filter((key) => {
    if (key === 'segments') return canAccess(plan, 'financials:segments');
    return true;
  });

  return (
    <div className="flex flex-wrap items-end justify-between gap-3 sm:gap-4">
      {/* Statement sub-tabs */}
      <div className="flex gap-1 pb-0.5 overflow-x-auto scrollbar-none">
        {visibleStatements.map((key) => (
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
        {/* % Change toggle */}
        {onShowChangeToggle && (
          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-wider text-text-muted font-medium">
              Display
            </span>
            <div className="flex rounded-lg bg-background p-0.5">
              <button
                onClick={onShowChangeToggle}
                disabled={isLoading}
                title={showChange ? 'Show absolute values' : 'Show year-over-year % change'}
                className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  showChange
                    ? 'bg-surface-hover text-foreground'
                    : 'text-text-secondary hover:text-foreground'
                } disabled:opacity-50`}
              >
                % Chg
              </button>
            </div>
          </div>
        )}

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
            {DEPTH_OPTIONS.map((depth) => {
              const depthFeature = depth > 10 ? `financials:depth-${depth}` : null;
              const locked = depthFeature ? !canAccess(plan, depthFeature) : false;
              return (
                <button
                  key={depth}
                  onClick={() => !locked && onLimitChange(depth)}
                  disabled={isLoading || locked}
                  title={
                    locked
                      ? `Pro feature — ${depth} ${activePeriod === 'annual' ? 'years' : 'quarters'} of history`
                      : `Show ${depth} ${activePeriod === 'annual' ? 'years' : 'quarters'} of history`
                  }
                  className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    activeLimit === depth
                      ? 'bg-surface-hover text-foreground'
                      : locked
                        ? 'text-text-muted opacity-50 cursor-not-allowed'
                        : 'text-text-secondary hover:text-foreground'
                  } disabled:opacity-50`}
                >
                  <span className="flex items-center gap-1">
                    {depth}{depthSuffix}
                    {locked && <Lock className="h-2.5 w-2.5" />}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Export */}
        <div className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-wider text-text-muted font-medium">
            Export
          </span>
          <div className="flex rounded-lg bg-background p-0.5">
            {canAccess(plan, 'data:export') ? (
              <button
                onClick={onExport}
                disabled={isLoading}
                title="Download CSV"
                className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-text-secondary hover:text-foreground transition-colors disabled:opacity-50"
              >
                <Download className="h-3.5 w-3.5" />
                CSV
              </button>
            ) : (
              <span
                title="Pro feature — export financial data as CSV"
                className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-text-muted opacity-50 cursor-not-allowed"
              >
                <Download className="h-3.5 w-3.5" />
                CSV
                <Lock className="h-2.5 w-2.5" />
              </span>
            )}
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
