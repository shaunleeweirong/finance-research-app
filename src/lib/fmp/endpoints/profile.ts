import { fmpFetch } from '../client';
import type { FMPProfile } from '../types';

export async function getCompanyProfile(ticker: string): Promise<FMPProfile | null> {
  const results = await fmpFetch<FMPProfile[]>(`/profile/${ticker}`, undefined, 86400); // 24h
  return results[0] ?? null;
}

export async function getBatchProfiles(tickers: string[]): Promise<FMPProfile[]> {
  if (tickers.length === 0) return [];
  const joined = tickers.join(',');
  return fmpFetch<FMPProfile[]>(`/profile/${joined}`, undefined, 86400);
}
