export interface LineItemConfig {
  key: string;        // FMP response field name
  label: string;      // Display name in table
  format: 'currency' | 'percent' | 'number' | 'ratio';
  indent?: number;    // Indentation level (0=top, 1=sub-item)
}

export const INCOME_STATEMENT_ITEMS: LineItemConfig[] = [
  { key: 'revenue', label: 'Total Revenue', format: 'currency' },
  { key: 'costOfRevenue', label: 'Cost of Revenue', format: 'currency', indent: 1 },
  { key: 'grossProfit', label: 'Gross Profit', format: 'currency' },
  { key: 'grossProfitRatio', label: 'Gross Profit Margin', format: 'percent' },
  { key: 'researchAndDevelopmentExpenses', label: 'R&D Expenses', format: 'currency', indent: 1 },
  { key: 'sellingGeneralAndAdministrativeExpenses', label: 'SG&A Expenses', format: 'currency', indent: 1 },
  { key: 'operatingIncome', label: 'Operating Income', format: 'currency' },
  { key: 'operatingIncomeRatio', label: 'Operating Margin', format: 'percent' },
  { key: 'interestExpense', label: 'Interest Expense', format: 'currency', indent: 1 },
  { key: 'incomeBeforeTax', label: 'Income Before Tax', format: 'currency' },
  { key: 'incomeTaxExpense', label: 'Income Tax Expense', format: 'currency', indent: 1 },
  { key: 'netIncome', label: 'Net Income', format: 'currency' },
  { key: 'netIncomeRatio', label: 'Net Profit Margin', format: 'percent' },
  { key: 'eps', label: 'Basic EPS', format: 'ratio' },
  { key: 'epsdiluted', label: 'Diluted EPS', format: 'ratio' },
  { key: 'weightedAverageShsOutDil', label: 'Weighted Avg Shares Outstanding', format: 'number' },
];

export const BALANCE_SHEET_ITEMS: LineItemConfig[] = [
  { key: 'cashAndCashEquivalents', label: 'Cash & Cash Equivalents', format: 'currency' },
  { key: 'shortTermInvestments', label: 'Short-Term Investments', format: 'currency' },
  { key: 'totalCurrentAssets', label: 'Total Current Assets', format: 'currency' },
  { key: 'propertyPlantEquipmentNet', label: 'Property, Plant & Equipment (Net)', format: 'currency' },
  { key: 'goodwillAndIntangibleAssets', label: 'Goodwill & Intangibles', format: 'currency' },
  { key: 'totalAssets', label: 'Total Assets', format: 'currency' },
  { key: 'totalCurrentLiabilities', label: 'Total Current Liabilities', format: 'currency' },
  { key: 'longTermDebt', label: 'Long-Term Debt', format: 'currency' },
  { key: 'totalLiabilities', label: 'Total Liabilities', format: 'currency' },
  { key: 'totalStockholdersEquity', label: 'Total Shareholders\' Equity', format: 'currency' },
  { key: 'totalDebt', label: 'Total Debt', format: 'currency' },
  { key: 'netDebt', label: 'Net Debt', format: 'currency' },
];

export const CASH_FLOW_ITEMS: LineItemConfig[] = [
  { key: 'netIncome', label: 'Net Income', format: 'currency' },
  { key: 'depreciationAndAmortization', label: 'Depreciation & Amortization', format: 'currency', indent: 1 },
  { key: 'stockBasedCompensation', label: 'Stock-Based Compensation', format: 'currency', indent: 1 },
  { key: 'netCashProvidedByOperatingActivities', label: 'Cash from Operations', format: 'currency' },
  { key: 'capitalExpenditure', label: 'Capital Expenditure', format: 'currency', indent: 1 },
  { key: 'netCashUsedForInvestingActivites', label: 'Cash from Investing', format: 'currency' },
  { key: 'debtRepayment', label: 'Debt Repayment / Issuance', format: 'currency', indent: 1 },
  { key: 'dividendsPaid', label: 'Dividends Paid', format: 'currency', indent: 1 },
  { key: 'netCashUsedProvidedByFinancingActivities', label: 'Cash from Financing', format: 'currency' },
  { key: 'netChangeInCash', label: 'Net Change in Cash', format: 'currency' },
  { key: 'freeCashFlow', label: 'Free Cash Flow', format: 'currency' },
];

export const RATIO_ITEMS: LineItemConfig[] = [
  { key: 'currentRatio', label: 'Current Ratio', format: 'ratio' },
  { key: 'quickRatio', label: 'Quick Ratio', format: 'ratio' },
  { key: 'debtEquityRatio', label: 'Debt/Equity', format: 'ratio' },
  { key: 'returnOnEquity', label: 'Return on Equity (ROE)', format: 'percent' },
  { key: 'returnOnAssets', label: 'Return on Assets (ROA)', format: 'percent' },
  { key: 'returnOnCapitalEmployed', label: 'Return on Invested Capital (ROIC)', format: 'percent' },
  { key: 'grossProfitMargin', label: 'Gross Margin', format: 'percent' },
  { key: 'operatingProfitMargin', label: 'Operating Margin', format: 'percent' },
  { key: 'netProfitMargin', label: 'Net Margin', format: 'percent' },
  { key: 'freeCashFlowOperatingCashFlowRatio', label: 'Free Cash Flow Margin', format: 'percent' },
  { key: 'priceEarningsRatio', label: 'Price/Earnings', format: 'ratio' },
  { key: 'priceToSalesRatio', label: 'Price/Sales', format: 'ratio' },
  { key: 'priceToBookRatio', label: 'Price/Book', format: 'ratio' },
  { key: 'enterpriseValueMultiple', label: 'EV/EBITDA', format: 'ratio' },
];

export const STATEMENT_CONFIGS = {
  income: { label: 'Income Statement', items: INCOME_STATEMENT_ITEMS },
  balance: { label: 'Balance Sheet', items: BALANCE_SHEET_ITEMS },
  cashflow: { label: 'Cash Flow Statement', items: CASH_FLOW_ITEMS },
  ratios: { label: 'Ratios', items: RATIO_ITEMS },
} as const;

export type StatementType = keyof typeof STATEMENT_CONFIGS;
