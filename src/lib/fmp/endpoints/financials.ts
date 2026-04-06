import { fmpFetch } from '../client';
import type { FMPIncomeStatement, FMPBalanceSheet, FMPCashFlowStatement } from '../types';

type Period = 'annual' | 'quarter';

export async function getIncomeStatement(
  ticker: string,
  period: Period = 'annual',
  limit: number = 10
): Promise<FMPIncomeStatement[]> {
  return fmpFetch<FMPIncomeStatement[]>(
    `/income-statement/${ticker}`,
    { period, limit: String(limit) },
    21600 // 6h
  );
}

export async function getBalanceSheet(
  ticker: string,
  period: Period = 'annual',
  limit: number = 10
): Promise<FMPBalanceSheet[]> {
  return fmpFetch<FMPBalanceSheet[]>(
    `/balance-sheet-statement/${ticker}`,
    { period, limit: String(limit) },
    21600
  );
}

export async function getCashFlowStatement(
  ticker: string,
  period: Period = 'annual',
  limit: number = 10
): Promise<FMPCashFlowStatement[]> {
  return fmpFetch<FMPCashFlowStatement[]>(
    `/cash-flow-statement/${ticker}`,
    { period, limit: String(limit) },
    21600
  );
}
