import { fmpFetch } from '../client';
import type { FMPRatios, FMPKeyMetrics } from '../types';

type Period = 'annual' | 'quarter';

export async function getRatios(
  ticker: string,
  period: Period = 'annual',
  limit: number = 10
): Promise<FMPRatios[]> {
  return fmpFetch<FMPRatios[]>(
    `/ratios/${ticker}`,
    { period, limit: String(limit) },
    21600
  );
}

export async function getKeyMetrics(ticker: string): Promise<FMPKeyMetrics[]> {
  return fmpFetch<FMPKeyMetrics[]>(
    `/key-metrics/${ticker}`,
    { period: 'annual', limit: '1' },
    21600
  );
}
