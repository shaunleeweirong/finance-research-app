import { fmpFetch } from '../client';
import type { FMPQuote } from '../types';

export async function getQuote(ticker: string): Promise<FMPQuote | null> {
  const results = await fmpFetch<FMPQuote[]>(`/quote/${ticker}`, undefined, 900); // 15min
  return results[0] ?? null;
}
