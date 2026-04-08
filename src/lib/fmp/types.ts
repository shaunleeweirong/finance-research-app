export interface FMPSearchResult {
  symbol: string;
  name: string;
  currency: string;
  stockExchange: string;
  exchangeShortName: string;
}

export interface FMPProfile {
  symbol: string;
  price: number | null;
  beta: number | null;
  volAvg: number | null;
  mktCap: number | null;
  lastDiv: number | null;
  range: string;
  changes: number | null;
  companyName: string;
  currency: string;
  cik: string;
  isin: string;
  cusip: string;
  exchange: string;
  exchangeShortName: string;
  industry: string;
  website: string;
  description: string;
  ceo: string;
  sector: string;
  country: string;
  fullTimeEmployees: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  dcfDiff: number | null;
  dcf: number | null;
  image: string;
  ipoDate: string;
  defaultImage: boolean;
  isEtf: boolean;
  isActivelyTrading: boolean;
  isAdr: boolean;
  isFund: boolean;
}

export interface FMPQuote {
  symbol: string;
  name: string;
  price: number | null;
  changesPercentage: number | null;
  change: number | null;
  dayLow: number | null;
  dayHigh: number | null;
  yearHigh: number | null;
  yearLow: number | null;
  marketCap: number | null;
  priceAvg50: number | null;
  priceAvg200: number | null;
  volume: number | null;
  avgVolume: number | null;
  exchange: string;
  open: number | null;
  previousClose: number | null;
  eps: number | null;
  pe: number | null;
  earningsAnnouncement: string;
  sharesOutstanding: number | null;
  timestamp: number | null;
}

export interface FMPHistoricalPrice {
  date: string;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
  adjClose: number | null;
  volume: number | null;
  unadjustedVolume: number | null;
  change: number | null;
  changePercent: number | null;
  vwap: number | null;
  label: string;
  changeOverTime: number | null;
}

export interface FMPHistoricalPriceResponse {
  symbol: string;
  historical: FMPHistoricalPrice[];
}

export interface FMPIntradayPrice {
  date: string;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
  volume: number | null;
}

export interface FMPIncomeStatement {
  date: string;
  symbol: string;
  reportedCurrency: string;
  cik: string;
  fillingDate: string;
  acceptedDate: string;
  calendarYear: string;
  period: string;
  revenue: number | null;
  costOfRevenue: number | null;
  grossProfit: number | null;
  grossProfitRatio: number | null;
  researchAndDevelopmentExpenses: number | null;
  generalAndAdministrativeExpenses: number | null;
  sellingAndMarketingExpenses: number | null;
  sellingGeneralAndAdministrativeExpenses: number | null;
  otherExpenses: number | null;
  operatingExpenses: number | null;
  costAndExpenses: number | null;
  interestIncome: number | null;
  interestExpense: number | null;
  depreciationAndAmortization: number | null;
  ebitda: number | null;
  ebitdaratio: number | null;
  operatingIncome: number | null;
  operatingIncomeRatio: number | null;
  totalOtherIncomeExpensesNet: number | null;
  incomeBeforeTax: number | null;
  incomeBeforeTaxRatio: number | null;
  incomeTaxExpense: number | null;
  netIncome: number | null;
  netIncomeRatio: number | null;
  eps: number | null;
  epsdiluted: number | null;
  weightedAverageShsOut: number | null;
  weightedAverageShsOutDil: number | null;
  link: string;
  finalLink: string;
}

export interface FMPBalanceSheet {
  date: string;
  symbol: string;
  reportedCurrency: string;
  cik: string;
  fillingDate: string;
  acceptedDate: string;
  calendarYear: string;
  period: string;
  cashAndCashEquivalents: number | null;
  shortTermInvestments: number | null;
  cashAndShortTermInvestments: number | null;
  netReceivables: number | null;
  inventory: number | null;
  otherCurrentAssets: number | null;
  totalCurrentAssets: number | null;
  propertyPlantEquipmentNet: number | null;
  goodwill: number | null;
  intangibleAssets: number | null;
  goodwillAndIntangibleAssets: number | null;
  longTermInvestments: number | null;
  taxAssets: number | null;
  otherNonCurrentAssets: number | null;
  totalNonCurrentAssets: number | null;
  otherAssets: number | null;
  totalAssets: number | null;
  accountPayables: number | null;
  shortTermDebt: number | null;
  taxPayables: number | null;
  deferredRevenue: number | null;
  otherCurrentLiabilities: number | null;
  totalCurrentLiabilities: number | null;
  longTermDebt: number | null;
  deferredRevenueNonCurrent: number | null;
  deferredTaxLiabilitiesNonCurrent: number | null;
  otherNonCurrentLiabilities: number | null;
  totalNonCurrentLiabilities: number | null;
  otherLiabilities: number | null;
  capitalLeaseObligations: number | null;
  totalLiabilities: number | null;
  preferredStock: number | null;
  commonStock: number | null;
  retainedEarnings: number | null;
  accumulatedOtherComprehensiveIncomeLoss: number | null;
  othertotalStockholdersEquity: number | null;
  totalStockholdersEquity: number | null;
  totalEquity: number | null;
  totalLiabilitiesAndStockholdersEquity: number | null;
  minorityInterest: number | null;
  totalLiabilitiesAndTotalEquity: number | null;
  totalInvestments: number | null;
  totalDebt: number | null;
  netDebt: number | null;
  link: string;
  finalLink: string;
}

export interface FMPCashFlowStatement {
  date: string;
  symbol: string;
  reportedCurrency: string;
  cik: string;
  fillingDate: string;
  acceptedDate: string;
  calendarYear: string;
  period: string;
  netIncome: number | null;
  depreciationAndAmortization: number | null;
  deferredIncomeTax: number | null;
  stockBasedCompensation: number | null;
  changeInWorkingCapital: number | null;
  accountsReceivables: number | null;
  inventory: number | null;
  accountsPayables: number | null;
  otherWorkingCapital: number | null;
  otherNonCashItems: number | null;
  netCashProvidedByOperatingActivities: number | null;
  investmentsInPropertyPlantAndEquipment: number | null;
  acquisitionsNet: number | null;
  purchasesOfInvestments: number | null;
  salesMaturitiesOfInvestments: number | null;
  otherInvestingActivites: number | null;
  netCashUsedForInvestingActivites: number | null;
  debtRepayment: number | null;
  commonStockIssued: number | null;
  commonStockRepurchased: number | null;
  dividendsPaid: number | null;
  otherFinancingActivites: number | null;
  netCashUsedProvidedByFinancingActivities: number | null;
  effectOfForexChangesOnCash: number | null;
  netChangeInCash: number | null;
  cashAtEndOfPeriod: number | null;
  cashAtBeginningOfPeriod: number | null;
  operatingCashFlow: number | null;
  capitalExpenditure: number | null;
  freeCashFlow: number | null;
  link: string;
  finalLink: string;
}

export interface FMPRatios {
  symbol: string;
  date: string;
  calendarYear: string;
  period: string;
  currentRatio: number | null;
  quickRatio: number | null;
  cashRatio: number | null;
  daysOfSalesOutstanding: number | null;
  daysOfInventoryOutstanding: number | null;
  operatingCycle: number | null;
  daysOfPayablesOutstanding: number | null;
  cashConversionCycle: number | null;
  grossProfitMargin: number | null;
  operatingProfitMargin: number | null;
  pretaxProfitMargin: number | null;
  netProfitMargin: number | null;
  effectiveTaxRate: number | null;
  returnOnAssets: number | null;
  returnOnEquity: number | null;
  returnOnCapitalEmployed: number | null;
  netIncomePerEBT: number | null;
  ebtPerEbit: number | null;
  ebitPerRevenue: number | null;
  debtRatio: number | null;
  debtEquityRatio: number | null;
  longTermDebtToCapitalization: number | null;
  totalDebtToCapitalization: number | null;
  interestCoverage: number | null;
  cashFlowToDebtRatio: number | null;
  companyEquityMultiplier: number | null;
  receivablesTurnover: number | null;
  payablesTurnover: number | null;
  inventoryTurnover: number | null;
  fixedAssetTurnover: number | null;
  assetTurnover: number | null;
  operatingCashFlowPerShare: number | null;
  freeCashFlowPerShare: number | null;
  cashPerShare: number | null;
  payoutRatio: number | null;
  operatingCashFlowSalesRatio: number | null;
  freeCashFlowOperatingCashFlowRatio: number | null;
  cashFlowCoverageRatios: number | null;
  shortTermCoverageRatios: number | null;
  capitalExpenditureCoverageRatio: number | null;
  dividendPaidAndCapexCoverageRatio: number | null;
  dividendPayoutRatio: number | null;
  priceBookValueRatio: number | null;
  priceToBookRatio: number | null;
  priceToSalesRatio: number | null;
  priceEarningsRatio: number | null;
  priceToFreeCashFlowsRatio: number | null;
  priceToOperatingCashFlowsRatio: number | null;
  priceCashFlowRatio: number | null;
  priceEarningsToGrowthRatio: number | null;
  priceSalesRatio: number | null;
  dividendYield: number | null;
  enterpriseValueMultiple: number | null;
  priceFairValue: number | null;
}

export interface FMPKeyMetrics {
  symbol: string;
  date: string;
  calendarYear: string;
  period: string;
  revenuePerShare: number | null;
  netIncomePerShare: number | null;
  operatingCashFlowPerShare: number | null;
  freeCashFlowPerShare: number | null;
  cashPerShare: number | null;
  bookValuePerShare: number | null;
  tangibleBookValuePerShare: number | null;
  shareholdersEquityPerShare: number | null;
  interestDebtPerShare: number | null;
  marketCap: number | null;
  enterpriseValue: number | null;
  peRatio: number | null;
  priceToSalesRatio: number | null;
  pocfratio: number | null;
  pfcfRatio: number | null;
  pbRatio: number | null;
  ptbRatio: number | null;
  evToSales: number | null;
  enterpriseValueOverEBITDA: number | null;
  evToOperatingCashFlow: number | null;
  evToFreeCashFlow: number | null;
  earningsYield: number | null;
  freeCashFlowYield: number | null;
  debtToEquity: number | null;
  debtToAssets: number | null;
  netDebtToEBITDA: number | null;
  currentRatio: number | null;
  interestCoverage: number | null;
  incomeQuality: number | null;
  dividendYield: number | null;
  payoutRatio: number | null;
  salesGeneralAndAdministrativeToRevenue: number | null;
  researchAndDdevelopementToRevenue: number | null;
  intangiblesToTotalAssets: number | null;
  capexToOperatingCashFlow: number | null;
  capexToRevenue: number | null;
  capexToDepreciation: number | null;
  stockBasedCompensationToRevenue: number | null;
  grahamNumber: number | null;
  roic: number | null;
  returnOnTangibleAssets: number | null;
  grahamNetNet: number | null;
  workingCapital: number | null;
  tangibleAssetValue: number | null;
  netCurrentAssetValue: number | null;
  investedCapital: number | null;
  averageReceivables: number | null;
  averagePayables: number | null;
  averageInventory: number | null;
  daysSalesOutstanding: number | null;
  daysPayablesOutstanding: number | null;
  daysOfInventoryOnHand: number | null;
  receivablesTurnover: number | null;
  payablesTurnover: number | null;
  inventoryTurnover: number | null;
  roe: number | null;
  capexPerShare: number | null;
}

export type FMPFinancialStatement =
  | FMPIncomeStatement
  | FMPBalanceSheet
  | FMPCashFlowStatement;

export interface FMPStockNews {
  symbol: string;
  publishedDate: string;
  title: string;
  image: string | null;
  site: string;
  text: string;
  url: string;
}

export interface FMPSecFiling {
  symbol: string;
  fillingDate: string;
  acceptedDate: string;
  cik: string;
  type: string;
  link: string;
  finalLink: string;
}

export interface FMPAnalystEstimate {
  symbol: string;
  date: string;
  estimatedRevenueLow: number | null;
  estimatedRevenueHigh: number | null;
  estimatedRevenueAvg: number | null;
  estimatedEbitdaLow: number | null;
  estimatedEbitdaHigh: number | null;
  estimatedEbitdaAvg: number | null;
  estimatedNetIncomeLow: number | null;
  estimatedNetIncomeHigh: number | null;
  estimatedNetIncomeAvg: number | null;
  estimatedEpsAvg: number | null;
  estimatedEpsHigh: number | null;
  estimatedEpsLow: number | null;
  numberAnalystEstimatedRevenue: number | null;
  numberAnalystsEstimatedEps: number | null;
}

// Raw FMP shape: [{ "2025-09-27": { Mac: 33708000000, iPhone: ... } }, ...]
export type FMPRevenueSegmentationRaw = Array<Record<string, Record<string, number>>>;

// Normalized shape for our components
export interface SegmentPeriod {
  date: string;
  year: string;
  segments: Record<string, number>;
}

export interface FMPPriceTargetConsensus {
  symbol: string;
  targetHigh: number | null;
  targetLow: number | null;
  targetConsensus: number | null;
  targetMedian: number | null;
}

export interface FMPPriceTargetSummary {
  symbol: string;
  lastMonth: number | null;
  lastMonthAvgPriceTarget: number | null;
  lastQuarter: number | null;
  lastQuarterAvgPriceTarget: number | null;
  lastYear: number | null;
  lastYearAvgPriceTarget: number | null;
  allTime: number | null;
  allTimeAvgPriceTarget: number | null;
  publishers: string;
}

export interface FMPPriceTarget {
  symbol: string;
  publishedDate: string;
  newsURL: string;
  newsTitle: string;
  analystName: string | null;
  priceTarget: number | null;
  adjPriceTarget: number | null;
  priceWhenPosted: number | null;
  newsPublisher: string;
  newsBaseURL: string;
  analystCompany: string | null;
}

export interface FMPInstitutionalHolder {
  holder: string;
  shares: number | null;
  dateReported: string;
  change: number | null;
}

export interface FMPInsiderTrade {
  symbol: string;
  filingDate: string;
  transactionDate: string;
  reportingCik: string;
  transactionType: string;
  securitiesOwned: number | null;
  companyCik: string;
  reportingName: string;
  typeOfOwner: string;
  acquistionOrDisposition: string;
  formType: string;
  securitiesTransacted: number | null;
  price: number | null;
  link: string;
}

export interface FinancialRecord {
  date: string;
  symbol: string;
  calendarYear: string;
  period: string;
  [key: string]: string | number | null;
}
