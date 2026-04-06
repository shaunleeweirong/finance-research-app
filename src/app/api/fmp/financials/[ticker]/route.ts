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
        result = await getIncomeStatement(ticker, period);
        break;
      case 'balance':
        result = await getBalanceSheet(ticker, period);
        break;
      case 'cashflow':
        result = await getCashFlowStatement(ticker, period);
        break;
      case 'ratios':
        result = await getRatios(ticker, period);
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
