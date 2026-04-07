import 'server-only';
import type {
  FMPPriceTargetConsensus,
  FMPPriceTargetSummary,
  FMPPriceTarget,
} from '../types';

const API_BASE_V4 = 'https://financialmodelingprep.com/api/v4';

async function fetchV4<T>(path: string, revalidate: number, fallback: T): Promise<T> {
  const apiKey = process.env.FMP_API_KEY;
  if (!apiKey) return fallback;
  const sep = path.includes('?') ? '&' : '?';
  const url = `${API_BASE_V4}${path}${sep}apikey=${apiKey}`;
  try {
    const response = await fetch(url, { next: { revalidate } });
    if (!response.ok) return fallback;
    return (await response.json()) as T;
  } catch {
    return fallback;
  }
}

export async function getPriceTargetConsensus(
  ticker: string,
): Promise<FMPPriceTargetConsensus | null> {
  const results = await fetchV4<FMPPriceTargetConsensus[]>(
    `/price-target-consensus?symbol=${ticker}`,
    21600, // 6h
    [],
  );
  return results[0] ?? null;
}

export async function getPriceTargetSummary(
  ticker: string,
): Promise<FMPPriceTargetSummary | null> {
  const results = await fetchV4<FMPPriceTargetSummary[]>(
    `/price-target-summary?symbol=${ticker}`,
    21600, // 6h
    [],
  );
  return results[0] ?? null;
}

export async function getPriceTargets(
  ticker: string,
  limit: number = 20,
): Promise<FMPPriceTarget[]> {
  const results = await fetchV4<FMPPriceTarget[]>(
    `/price-target?symbol=${ticker}`,
    21600, // 6h
    [],
  );
  return results.slice(0, limit);
}
