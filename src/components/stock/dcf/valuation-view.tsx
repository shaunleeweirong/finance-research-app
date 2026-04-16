'use client';

import { useState } from 'react';
import { DCFCalculator } from './dcf-calculator';
import { EPSCalculator } from './eps-calculator';
import { PSCalculator } from './ps-calculator';
import type { FMPProfile, FMPQuote, FMPCashFlowStatement, FMPIncomeStatement } from '@/lib/fmp/types';

export type ValuationModel = 'dcf' | 'eps' | 'ps';

interface ValuationViewProps {
  profile: FMPProfile;
  quote: FMPQuote;
  cashflow: FMPCashFlowStatement[];
  income: FMPIncomeStatement[];
}

export function ValuationView({ profile, quote, cashflow, income }: ValuationViewProps) {
  const [activeModel, setActiveModel] = useState<ValuationModel>('dcf');

  return (
    <div className="space-y-6">
      {/* Model Selector */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-medium text-text-muted uppercase tracking-wider">Model</span>
        <div className="flex rounded-lg bg-surface border border-border p-0.5">
          <button
            onClick={() => setActiveModel('dcf')}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeModel === 'dcf'
                ? 'bg-primary text-primary-foreground'
                : 'text-text-secondary hover:text-foreground'
            }`}
          >
            DCF (Free Cash Flow)
          </button>
          <button
            onClick={() => setActiveModel('eps')}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeModel === 'eps'
                ? 'bg-primary text-primary-foreground'
                : 'text-text-secondary hover:text-foreground'
            }`}
          >
            EPS (Earnings)
          </button>
          <button
            onClick={() => setActiveModel('ps')}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeModel === 'ps'
                ? 'bg-primary text-primary-foreground'
                : 'text-text-secondary hover:text-foreground'
            }`}
          >
            P/S (Revenue)
          </button>
        </div>
      </div>

      {/* Active Model */}
      {activeModel === 'dcf' ? (
        <DCFCalculator profile={profile} quote={quote} cashflow={cashflow} />
      ) : activeModel === 'eps' ? (
        <EPSCalculator profile={profile} quote={quote} income={income} />
      ) : (
        <PSCalculator profile={profile} quote={quote} income={income} />
      )}
    </div>
  );
}
