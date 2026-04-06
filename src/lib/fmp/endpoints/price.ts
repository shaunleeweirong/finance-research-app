import { fmpFetch } from '../client';
import type { FMPHistoricalPriceResponse, FMPIntradayPrice } from '../types';

export async function getHistoricalPrices(
  ticker: string,
  from?: string,
  to?: string
): Promise<FMPHistoricalPriceResponse> {
  const params: Record<string, string> = {};
  if (from) params.from = from;
  if (to) params.to = to;
  return fmpFetch<FMPHistoricalPriceResponse>(`/historical-price-full/${ticker}`, params, 900); // 15min
}

export async function getIntradayPrices(ticker: string): Promise<FMPIntradayPrice[]> {
  return fmpFetch<FMPIntradayPrice[]>(`/historical-chart/1min/${ticker}`, undefined, 900); // 15min
}
