import { fmpFetch } from '../client';
import type { FMPSecFiling } from '../types';

export async function getSecFilings(
  ticker: string,
  type?: string,
  limit: number = 40
): Promise<FMPSecFiling[]> {
  const params: Record<string, string> = { limit: String(limit) };
  if (type) params.type = type;
  return fmpFetch<FMPSecFiling[]>(
    `/sec_filings/${ticker}`,
    params,
    21600 // 6h cache
  );
}
