import { fmpFetch } from '../client';
import type { FMPQuote } from '../types';

export async function getQuote(ticker: string): Promise<FMPQuote | null> {
  const results = await fmpFetch<FMPQuote[]>(`/quote/${ticker}`, undefined, 900); // 15min
  return results[0] ?? null;
}

export async function getBatchQuotes(tickers: string[]): Promise<FMPQuote[]> {
  if (tickers.length === 0) return [];
  const joined = tickers.join(',');
  return fmpFetch<FMPQuote[]>(`/quote/${joined}`, undefined, 900);
}
