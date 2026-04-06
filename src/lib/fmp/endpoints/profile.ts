import { fmpFetch } from '../client';
import type { FMPProfile } from '../types';

export async function getCompanyProfile(ticker: string): Promise<FMPProfile | null> {
  const results = await fmpFetch<FMPProfile[]>(`/profile/${ticker}`, undefined, 86400); // 24h
  return results[0] ?? null;
}
