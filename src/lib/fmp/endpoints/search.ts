import { fmpFetch } from '../client';
import type { FMPSearchResult } from '../types';

export async function searchCompanies(query: string): Promise<FMPSearchResult[]> {
  // Short cache so debounced search bursts (e.g. user typing "AAPL" key-by-key)
  // dedupe across requests. Search results don't change minute-to-minute.
  return fmpFetch<FMPSearchResult[]>('/search', { query, limit: '8' }, 300);
}
