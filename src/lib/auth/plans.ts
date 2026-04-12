export type Plan = 'free' | 'pro' | 'premium';

const FEATURE_ACCESS: Record<string, Plan> = {
  // Tabs
  'tab:overview': 'free',
  'tab:financials': 'free',
  'tab:news': 'free',
  'tab:filings': 'free',
  'tab:estimates': 'pro',
  'tab:ownership': 'pro',
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

export const FREE_MAX_CHART_METRICS = 2;
export const FREE_MAX_DEPTH = 10;
