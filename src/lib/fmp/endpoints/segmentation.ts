import 'server-only';
import type { FMPRevenueSegmentationRaw, SegmentPeriod } from '../types';

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

// Normalize FMP's shape [{ "2025-09-27": { Mac: 33708000000 } }]
// into [{ date: "2025-09-27", year: "2025", segments: { Mac: 33708000000 } }]
function normalize(raw: FMPRevenueSegmentationRaw): SegmentPeriod[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry) => {
      const keys = Object.keys(entry);
      if (keys.length === 0) return null;
      const date = keys[0];
      const segments = entry[date];
      if (!segments || typeof segments !== 'object') return null;
      return {
        date,
        year: date.split('-')[0],
        segments,
      };
    })
    .filter((v): v is SegmentPeriod => v !== null);
}

export async function getRevenueProductSegmentation(
  ticker: string,
  period: 'annual' | 'quarter' = 'annual',
): Promise<SegmentPeriod[]> {
  const raw = await fetchV4<FMPRevenueSegmentationRaw>(
    `/revenue-product-segmentation?symbol=${ticker}&structure=flat&period=${period}`,
    21600, // 6h
    [],
  );
  return normalize(raw);
}

export async function getRevenueGeographicSegmentation(
  ticker: string,
  period: 'annual' | 'quarter' = 'annual',
): Promise<SegmentPeriod[]> {
  const raw = await fetchV4<FMPRevenueSegmentationRaw>(
    `/revenue-geographic-segmentation?symbol=${ticker}&structure=flat&period=${period}`,
    21600,
    [],
  );
  return normalize(raw);
}
