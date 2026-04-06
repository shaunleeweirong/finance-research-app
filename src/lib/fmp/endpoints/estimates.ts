import { fmpFetch } from '../client';
import type { FMPAnalystEstimate } from '../types';

export async function getAnalystEstimates(
  ticker: string,
  period: 'annual' | 'quarter' = 'annual',
  limit: number = 10
): Promise<FMPAnalystEstimate[]> {
  return fmpFetch<FMPAnalystEstimate[]>(
    `/analyst-estimates/${ticker}`,
    { period, limit: String(limit) },
    21600 // 6h cache
  );
}
