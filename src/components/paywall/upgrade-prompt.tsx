'use client';

import { Lock } from 'lucide-react';
import Link from 'next/link';
import type { Plan } from '@/lib/auth/plans';
import { getRequiredPlan } from '@/lib/auth/plans';

interface UpgradePromptProps {
  feature: string;
  title?: string;
  description?: string;
}

const PLAN_LABELS: Record<Plan, string> = {
  free: 'Free',
  pro: 'Pro',
  premium: 'Premium',
};

export function UpgradePrompt({ feature, title, description }: UpgradePromptProps) {
  const requiredPlan = getRequiredPlan(feature);
  const planLabel = PLAN_LABELS[requiredPlan];

  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-surface px-8 py-16 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600/10">
        <Lock className="h-6 w-6 text-blue-500" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-foreground">
        {title ?? `${planLabel} Feature`}
      </h3>
      <p className="mb-6 max-w-md text-sm text-text-secondary">
        {description ??
          `This feature is available on the ${planLabel} plan. Upgrade to unlock full access to advanced financial data and analysis tools.`}
      </p>
      <Link
        href="/pricing"
        className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-500 transition-colors"
      >
        Upgrade to {planLabel}
      </Link>
    </div>
  );
}
