import 'server-only';
import { fmpFetch } from '../client';
import type { FMPInstitutionalHolder, FMPInsiderTrade } from '../types';

export async function getInstitutionalHolders(
  ticker: string
): Promise<FMPInstitutionalHolder[]> {
  return fmpFetch<FMPInstitutionalHolder[]>(
    `/institutional-holder/${ticker}`,
    undefined,
    21600 // 6h cache
  );
}

export async function getInsiderTrading(
  ticker: string,
  limit: number = 20
): Promise<FMPInsiderTrade[]> {
  // Note: v4 endpoint, not v3
  const apiKey = process.env.FMP_API_KEY;
  const url = `https://financialmodelingprep.com/api/v4/insider-trading?symbol=${ticker}&limit=${limit}&apikey=${apiKey}`;
  const response = await fetch(url, { next: { revalidate: 21600 } });
  if (!response.ok) return [];
  return response.json() as Promise<FMPInsiderTrade[]>;
}
