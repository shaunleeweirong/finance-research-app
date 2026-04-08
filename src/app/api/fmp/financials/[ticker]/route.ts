import { NextRequest, NextResponse } from 'next/server';
import {
  getIncomeStatement,
  getBalanceSheet,
  getCashFlowStatement,
  getRatios,
  FMPError,
} from '@/lib/fmp';
import { isValidTicker } from '@/lib/utils/validation';

const VALID_STATEMENTS = ['income', 'balance', 'cashflow', 'ratios'] as const;
type StatementType = (typeof VALID_STATEMENTS)[number];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;

  if (!isValidTicker(ticker)) {
    return NextResponse.json({ error: 'Invalid ticker symbol' }, { status: 400 });
  }

  const statementParam = request.nextUrl.searchParams.get('statement') ?? 'income';
  const period = (request.nextUrl.searchParams.get('period') ?? 'annual') as 'annual' | 'quarter';
  const limitParam = request.nextUrl.searchParams.get('limit');
  const parsedLimit = limitParam ? parseInt(limitParam, 10) : NaN;
  // Clamp limit to reasonable bounds: 1-200. Default 10 if missing or invalid.
  const limit = Number.isFinite(parsedLimit) && parsedLimit > 0 && parsedLimit <= 200
    ? parsedLimit
    : 10;

  if (!VALID_STATEMENTS.includes(statementParam as StatementType)) {
    return NextResponse.json(
      { error: `Invalid statement. Must be one of: ${VALID_STATEMENTS.join(', ')}` },
      { status: 400 }
    );
  }

  const statement = statementParam as StatementType;

  try {
    let result;
    switch (statement) {
      case 'income':
        result = await getIncomeStatement(ticker, period, limit);
        break;
      case 'balance':
        result = await getBalanceSheet(ticker, period, limit);
        break;
      case 'cashflow':
        result = await getCashFlowStatement(ticker, period, limit);
        break;
      case 'ratios':
        result = await getRatios(ticker, period, limit);
        break;
    }
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof FMPError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
