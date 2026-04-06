import { fmpFetch } from '../client';
import type { FMPStockNews } from '../types';

export async function getStockNews(
  ticker: string,
  limit: number = 20
): Promise<FMPStockNews[]> {
  return fmpFetch<FMPStockNews[]>(
    '/stock_news',
    { tickers: ticker, limit: String(limit) },
    900 // 15min cache
  );
}
