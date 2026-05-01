export type Plan = 'free' | 'pro' | 'premium';

const FEATURE_ACCESS: Record<string, Plan> = {
  // Tabs
  'tab:overview': 'free',
  'tab:financials': 'free',
  'tab:news': 'free',
  'tab:filings': 'free',
  'tab:estimates': 'pro',
  'tab:ownership': 'pro',
  'tab:valuation': 'pro',
  // Financials sub-features
  'financials:segments': 'pro',
  'financials:depth-20': 'pro',
  'financials:depth-40': 'pro',
  'financials:unlimited-metrics': 'pro',
  // Future features
  'data:export': 'pro',
  'watchlist:basic': 'pro',
  'ai:copilot': 'premium',
  'peer:comparison': 'premium',
};

const PLAN_HIERARCHY: Record<Plan, number> = {
  free: 0,
  pro: 1,
  premium: 2,
};

export function canAccess(userPlan: Plan, feature: string): boolean {
  const requiredPlan = FEATURE_ACCESS[feature] ?? 'free';
  return PLAN_HIERARCHY[userPlan] >= PLAN_HIERARCHY[requiredPlan];
}

export function getRequiredPlan(feature: string): Plan {
  return FEATURE_ACCESS[feature] ?? 'free';
}

/**
 * Runtime-validated coercion of an arbitrary value to a Plan.
 * Replaces unsafe `(value as Plan)` casts at DB-read boundaries — if the
 * database ever returns an unknown plan string (e.g. a future plan added
 * to the schema before the type is updated), we degrade safely to 'free'
 * instead of letting an invalid plan flow through the access matrix.
 */
export function toPlan(value: unknown): Plan {
  if (value === 'pro' || value === 'premium' || value === 'free') return value;
  return 'free';
}

export const FREE_MAX_CHART_METRICS = 2;
export const FREE_MAX_DEPTH = 10;
