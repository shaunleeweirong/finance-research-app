import { fmpFetch } from '../client';
import type { FMPSearchResult } from '../types';

export async function searchCompanies(query: string): Promise<FMPSearchResult[]> {
  return fmpFetch<FMPSearchResult[]>('/search', { query, limit: '8' });
}
