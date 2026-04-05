# Finance Research App — MVP Implementation Plan

## Phase Overview

| Phase | Name | Tasks | Can Parallelize With |
|-------|------|-------|---------------------|
| A | Project Scaffolding | 1-3 | — (must go first) |
| B | Foundation Layer | 4-7 | All B tasks parallel |
| C | Route Handlers & Layout | 8-11 | All C tasks parallel (depends on B) |
| D | Home Page & Company Shell | 12-14 | 12+14 parallel; 13 after 12 (depends on C) |
| E | Overview Tab | 15-17 | All E tasks parallel (depends on D) |
| F | Financials Tab | 18-22 | 18→19→20→21→22 sequential (depends on D) |
| G | Polish & Error Handling | 23-25 | All G tasks parallel (depends on E, F) |

**Total tasks:** 25
**Estimated critical path:** A → B → C → D → F (longest chain)

---

## Phase A — Project Scaffolding

### Task 1: Initialize Next.js 15 Project
- **Complexity:** Simple
- **Depends on:** None
- **Parallel group:** A1
- **Files:**
  - `package.json` — project manifest with Next.js 15, React 19, TypeScript
  - `tsconfig.json` — strict mode TypeScript config
  - `next.config.ts` — Next.js configuration (images remote patterns for FMP logos)
  - `.env.local` — FMP_API_KEY placeholder
  - `.env.example` — documented env var template (no secrets)
  - `.gitignore` — standard Next.js gitignore
- **Details:**
  - Run `npx create-next-app@latest` with App Router, TypeScript, Tailwind, ESLint, src/ directory
  - Enable `strict: true` in tsconfig.json
  - Configure `next.config.ts` with `images.remotePatterns` for `financialmodelingprep.com` (company logos)
  - Add `FMP_API_KEY` to `.env.local` and `.env.example`

### Task 2: Configure Tailwind Dark Theme & Fonts
- **Complexity:** Medium
- **Depends on:** Task 1
- **Parallel group:** A2
- **Files:**
  - `src/app/globals.css` — Tailwind directives, CSS custom properties for dark theme colors
  - `tailwind.config.ts` — extend theme with custom colors (navy bg, surface cards, accent, positive/negative)
  - `src/lib/fonts.ts` — Geist Sans + Geist Mono font configuration via `next/font`
  - `src/app/layout.tsx` — root layout applying fonts, dark class, metadata
- **Details:**
  - Define CSS variables: `--background: #0a0f1a`, `--surface: #111827`, `--text-primary: #f1f5f9`, `--text-secondary: #94a3b8`, `--accent: #3b82f6`, `--positive: #22c55e`, `--negative: #ef4444`
  - Configure `darkMode: 'class'` in tailwind (shadcn/ui convention)
  - Import Geist Sans (headings/body) and Geist Mono (numbers/tables) from `next/font/google` or local
  - Root layout: `<html lang="en" className="dark">`, apply font variables, set metadata title/description

### Task 3: Install & Configure shadcn/ui
- **Complexity:** Simple
- **Depends on:** Task 2
- **Parallel group:** A3
- **Files:**
  - `components.json` — shadcn/ui configuration (dark theme, CSS variables)
  - `src/components/ui/button.tsx` — button component
  - `src/components/ui/card.tsx` — card component
  - `src/components/ui/input.tsx` — input component
  - `src/components/ui/tabs.tsx` — tabs component
  - `src/components/ui/badge.tsx` — badge component
  - `src/components/ui/checkbox.tsx` — checkbox component
  - `src/components/ui/tooltip.tsx` — tooltip component
  - `src/components/ui/skeleton.tsx` — skeleton loading component
  - `src/lib/utils.ts` — `cn()` utility from shadcn/ui
- **Details:**
  - Run `npx shadcn@latest init` with "new-york" style, dark theme
  - Install components: button, card, input, tabs, badge, checkbox, tooltip, skeleton
  - These cover all UI primitives needed across the app

---

## Phase B — Foundation Layer

### Task 4: FMP API Types
- **Complexity:** Medium
- **Depends on:** Task 1
- **Parallel group:** B
- **Files:**
  - `src/lib/fmp/types.ts` — all TypeScript interfaces for FMP API responses
- **Details:**
  - Define interfaces for every FMP response shape used:
    - `FMPSearchResult` — `{ symbol, name, currency, stockExchange, exchangeShortName }`
    - `FMPProfile` — `{ symbol, price, beta, volAvg, mktCap, lastDiv, range, changes, companyName, currency, cik, isin, cusip, exchange, exchangeShortName, industry, website, description, ceo, sector, country, fullTimeEmployees, phone, address, city, state, zip, dcfDiff, dcf, image, ipoDate, defaultImage, isEtf, isActivelyTrading, isAdr, isFund }`
    - `FMPQuote` — `{ symbol, name, price, changesPercentage, change, dayLow, dayHigh, yearHigh, yearLow, marketCap, priceAvg50, priceAvg200, volume, avgVolume, exchange, open, previousClose, eps, pe, earningsAnnouncement, sharesOutstanding, timestamp }`
    - `FMPHistoricalPrice` — `{ date, open, high, low, close, adjClose, volume, unadjustedVolume, change, changePercent, vwap, label, changeOverTime }`
    - `FMPHistoricalPriceResponse` — `{ symbol, historical: FMPHistoricalPrice[] }`
    - `FMPIntradayPrice` — `{ date, open, high, low, close, volume }`
    - `FMPIncomeStatement` — all 40+ fields from FMP income statement endpoint
    - `FMPBalanceSheet` — all fields from FMP balance sheet endpoint
    - `FMPCashFlowStatement` — all fields from FMP cash flow endpoint
    - `FMPRatios` — all fields from FMP financial ratios endpoint
    - `FMPKeyMetrics` — all fields from FMP key metrics endpoint
  - Export a union type `FMPFinancialStatement = FMPIncomeStatement | FMPBalanceSheet | FMPCashFlowStatement`
  - All number fields typed as `number | null` to handle missing data

### Task 5: FMP API Client
- **Complexity:** Medium
- **Depends on:** Task 4
- **Parallel group:** B
- **Files:**
  - `src/lib/fmp/client.ts` — base FMP API client with error handling
- **Details:**
  - Create `fmpFetch<T>(endpoint: string, params?: Record<string, string>): Promise<T>` function
  - Base URL: `https://financialmodelingprep.com/api/v3`
  - Automatically append `apikey` from `process.env.FMP_API_KEY`
  - Error handling: check response status, handle 429 (rate limit) with exponential backoff (3 retries, 1s/2s/4s delays), handle non-200 responses
  - Throw typed `FMPError` class with `status`, `message`, `endpoint` fields
  - Server-only: add `import 'server-only'` guard so this never leaks to client bundle

### Task 6: FMP Endpoint Functions
- **Complexity:** Medium
- **Depends on:** Task 5
- **Parallel group:** B
- **Files:**
  - `src/lib/fmp/endpoints/search.ts` — `searchCompanies(query: string): Promise<FMPSearchResult[]>`
  - `src/lib/fmp/endpoints/profile.ts` — `getCompanyProfile(ticker: string): Promise<FMPProfile>`
  - `src/lib/fmp/endpoints/quote.ts` — `getQuote(ticker: string): Promise<FMPQuote>`
  - `src/lib/fmp/endpoints/price.ts` — `getHistoricalPrices(ticker, from?, to?)`, `getIntradayPrices(ticker)`
  - `src/lib/fmp/endpoints/financials.ts` — `getIncomeStatement(ticker, period, limit)`, `getBalanceSheet(...)`, `getCashFlowStatement(...)`
  - `src/lib/fmp/endpoints/ratios.ts` — `getRatios(ticker, period, limit)`, `getKeyMetrics(ticker)`
  - `src/lib/fmp/index.ts` — barrel export for all endpoint functions
- **Details:**
  - Each function is a thin wrapper around `fmpFetch` with the correct endpoint path and return type
  - `period` parameter accepts `'annual' | 'quarter'`
  - `limit` defaults: annual=10, quarterly=12
  - Historical prices accept optional `from`/`to` date strings (YYYY-MM-DD)
  - Intraday prices use `/historical-chart/1min/{ticker}` endpoint

### Task 7: Utility Functions
- **Complexity:** Simple
- **Depends on:** Task 1
- **Parallel group:** B
- **Files:**
  - `src/lib/utils/format.ts` — number/currency/percent formatting utilities
  - `src/lib/utils/chart-helpers.ts` — CAGR calculation, chart data transformation
- **Details:**
  - `format.ts`:
    - `formatCurrency(value: number | null, decimals?: number): string` — "$1,234.56", handles null → "N/A"
    - `formatPercent(value: number | null, decimals?: number): string` — "12.34%", handles null → "N/A"
    - `formatLargeNumber(value: number | null): string` — "1.23B", "456.7M", "12.3K"
    - `formatNumber(value: number | null, decimals?: number): string` — "1,234,567"
    - `formatParenthetical(value: number | null): string` — negative numbers as "(1,234)"
  - `chart-helpers.ts`:
    - `calculateCAGR(startValue: number, endValue: number, years: number): number` — compound annual growth rate
    - `calculateTotalChange(startValue: number, endValue: number): number` — percentage change
    - `getDateRangeForPeriod(period: '1D'|'1W'|'1M'|'3M'|'6M'|'1Y'|'5Y'|'ALL'): { from: string, to: string }` — date range calculator
    - `CHART_COLORS: string[]` — array of distinct accessible colors for multi-metric charts: blue, orange, green, purple, etc.

---

## Phase C — Route Handlers & Layout Shell

### Task 8: FMP Search Route Handler
- **Complexity:** Simple
- **Depends on:** Task 6
- **Parallel group:** C
- **Files:**
  - `src/app/api/fmp/search/route.ts` — GET handler for company search
- **Details:**
  - `GET /api/fmp/search?q={query}` — proxies to FMP search endpoint
  - Validate `q` param exists and has length >= 1
  - No caching (per spec: search must be real-time)
  - Return `NextResponse.json(results)` with appropriate error handling
  - Return 400 if no query, 502 if FMP fails

### Task 9: FMP Data Route Handlers
- **Complexity:** Medium
- **Depends on:** Task 6
- **Parallel group:** C
- **Files:**
  - `src/app/api/fmp/historical/[ticker]/route.ts` — historical prices for client-side time range switching
  - `src/app/api/fmp/intraday/[ticker]/route.ts` — intraday prices for 1D chart view
  - `src/app/api/fmp/financials/[ticker]/route.ts` — financial statements for client-side period/statement switching
- **Details:**
  - Route handlers are only needed for client-initiated fetches. Server Components fetch profile, quote, key metrics, and default (annual) financial data directly using `fmpFetch` with `next.revalidate`.
  - Route handlers needed:
    - `/api/fmp/financials/[ticker]` — accepts `?statement=income|balance|cashflow|ratios&period=annual|quarter`
    - `/api/fmp/historical/[ticker]` — accepts `?from=YYYY-MM-DD&to=YYYY-MM-DD`
    - `/api/fmp/intraday/[ticker]` — returns 1-minute interval data for 1D view
  - Search route handler is in Task 8 (separate)
  - Each handler: validate params, call FMP endpoint, return JSON with error handling

### Task 10: Stock Page Layout & Tab Navigation
- **Complexity:** Medium
- **Depends on:** Task 3
- **Parallel group:** C
- **Files:**
  - `src/app/stock/[ticker]/layout.tsx` — stock page layout (Server Component shell)
  - `src/components/stock/tab-navigation.tsx` — tab bar component (client component)
- **Details:**
  - `layout.tsx`: receives `params.ticker`, provides the structural wrapper for the company page. Contains the company header slot and tab content area. Uses `Suspense` boundary around children.
  - `tab-navigation.tsx`: client component using shadcn Tabs. Tab items: Overview, Financials, News, Estimates, Ownership, Filings. Uses URL search params or local state to track active tab. Inactive tabs (News, Estimates, Ownership, Filings) render placeholder content.
  - Tab navigation should be sticky below the company header on scroll
  - **Use URL search params** (`?tab=financials`) to track active tab — enables deep linking, back-button navigation, and shareable URLs

### Task 11: Financial Line Items Configuration
- **Complexity:** Medium
- **Depends on:** Task 4
- **Parallel group:** C
- **Files:**
  - `src/config/financial-line-items.ts` — defines all statement line items, display names, formatting, ordering
- **Details:**
  - Export typed configuration objects for each statement type:
    - `INCOME_STATEMENT_ITEMS: LineItemConfig[]`
    - `BALANCE_SHEET_ITEMS: LineItemConfig[]`
    - `CASH_FLOW_ITEMS: LineItemConfig[]`
    - `RATIO_ITEMS: LineItemConfig[]`
  - `LineItemConfig` type: `{ key: string (FMP field name), label: string (display name), format: 'currency' | 'percent' | 'number' | 'ratio', indent?: number }`
  - Maps exact FMP response field names to human-readable labels
  - Controls row ordering in the data table (matches spec ordering)
  - Income statement: 16 items (Revenue through Weighted Avg Shares)
  - Balance sheet: 12 items (Cash through Net Debt)
  - Cash flow: 11 items (Net Income through Free Cash Flow)
  - Ratios: 14 items (Current Ratio through EV/EBITDA)

---

## Phase D — Home Page & Company Page Shell

### Task 12: Search Bar Component
- **Complexity:** Medium
- **Depends on:** Task 8
- **Parallel group:** D
- **Files:**
  - `src/components/search/search-bar.tsx` — search input with debounced autocomplete (client component)
  - `src/components/search/search-results.tsx` — dropdown results list (client component)
- **Details:**
  - `search-bar.tsx`: `'use client'` component
    - shadcn Input with search icon
    - `useState` for query text, results, loading, open state
    - Debounce input by 300ms before fetching `/api/fmp/search?q=...`
    - On result select: call `router.push(\`/stock/${ticker}\`)`
    - Keyboard navigation: arrow keys to move through results, Enter to select, Escape to close
    - Show loading spinner during fetch
  - `search-results.tsx`: renders dropdown list of `FMPSearchResult` items
    - Each item shows: ticker (bold) + company name + exchange badge
    - Highlight matching text in results
    - Max 8 results displayed

### Task 13: Home Page
- **Complexity:** Simple
- **Depends on:** Task 12
- **Parallel group:** D
- **Files:**
  - `src/app/page.tsx` — home page with centered search
- **Details:**
  - Centered layout (flex column, justify-center, min-h-screen)
  - App logo/brand name at top (text-based for MVP, e.g., "FinanceResearch" in Geist Sans)
  - Subtitle: "Research any public company" or similar
  - Large SearchBar component below
  - Dark background matching theme
  - No other content for MVP (per spec: keep minimal)

### Task 14: Company Header Component
- **Complexity:** Medium
- **Depends on:** Task 6, Task 7
- **Parallel group:** D
- **Files:**
  - `src/components/stock/company-header.tsx` — persistent company header (Server Component)
- **Details:**
  - Receives `profile: FMPProfile` and `quote: FMPQuote` as props
  - Displays:
    - Company logo via `next/image` (src from `profile.image`, with fallback)
    - Ticker symbol (large, bold) + full company name
    - Current price from quote, formatted as currency
    - Daily change: absolute $ amount + percentage, colored green/red
    - Second line: exchange, sector, industry, formatted market cap — separated by dots or pipes
  - Responsive: logo + ticker on one line, meta info wraps on mobile
  - Uses Geist Mono for price numbers

---

## Phase E — Overview Tab

### Task 15: Price Chart Component
- **Complexity:** Complex
- **Depends on:** Task 9, Task 7
- **Parallel group:** E
- **Files:**
  - `src/components/stock/overview/price-chart.tsx` — interactive price line chart (client component)
- **Details:**
  - `'use client'` component, receives initial 1Y historical data as prop
  - **Time range buttons:** 1D | 1W | 1M | 3M | 6M | 1Y | 5Y | ALL — styled as pill/toggle group
  - Default: 1Y selected on load (data passed from server)
  - Clicking a range: client-side fetch to `/api/fmp/historical/[ticker]?from=...&to=...` (or `/api/fmp/intraday/[ticker]` for 1D)
  - Uses `getDateRangeForPeriod()` from chart-helpers
  - **Recharts implementation:**
    - `ResponsiveContainer` wrapping `AreaChart` (line + gradient fill)
    - `XAxis` with date labels (formatted based on range: "Mon" for 1D, "Jan 25" for 1Y, "2020" for 5Y)
    - `YAxis` with price, hidden or minimal
    - `Tooltip` showing: date, price, volume on hover
    - `Area` with gradient: green fill if current > previous close, red if down
  - **Gradient fill:** `<defs><linearGradient>` from accent color at top to transparent at bottom
  - Color determination: compare first and last data point to decide green vs red
  - Loading state: skeleton placeholder while fetching new range
  - Install `recharts` as dependency

### Task 16: Key Metrics Grid
- **Complexity:** Medium
- **Depends on:** Task 6, Task 7
- **Parallel group:** E
- **Files:**
  - `src/components/stock/overview/key-metrics.tsx` — metrics card grid (Server Component)
- **Details:**
  - Receives `keyMetrics: FMPKeyMetrics`, `quote: FMPQuote`, `profile: FMPProfile` as props
  - Responsive grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`
  - Each metric rendered as a shadcn Card with:
    - Label (text-secondary, small)
    - Value (text-primary, large, Geist Mono)
  - 12 metrics from spec:
    - P/E Ratio — from quote.pe, `formatNumber(_, 2)`
    - EPS (Diluted) — from quote.eps, `formatCurrency`
    - Market Cap — from quote.marketCap, `formatLargeNumber`
    - Dividend Yield — from keyMetrics, `formatPercent`
    - Beta — from profile.beta, `formatNumber(_, 2)`
    - 52-Week High/Low — from quote.yearHigh/yearLow, `formatCurrency` (show as "High / Low" in one card)
    - Revenue (TTM) — from keyMetrics, `formatLargeNumber`
    - Net Income (TTM) — from keyMetrics, `formatLargeNumber`
    - Profit Margin — from keyMetrics, `formatPercent`
    - ROE — from keyMetrics, `formatPercent`
    - Debt-to-Equity — from keyMetrics, `formatNumber(_, 2)`
    - Free Cash Flow (TTM) — from keyMetrics, `formatLargeNumber`
  - Handle null values → display "N/A" with muted styling

### Task 17: Company Profile Card
- **Complexity:** Simple
- **Depends on:** Task 6
- **Parallel group:** E
- **Files:**
  - `src/components/stock/overview/company-profile.tsx` — description + facts card (Server Component)
- **Details:**
  - Receives `profile: FMPProfile` as prop
  - shadcn Card containing:
    - **Description section:** `profile.description` text, truncated to ~3 lines with "Show more" toggle (client interaction via `useState` — make this a small client sub-component or use CSS `line-clamp` with details/summary)
    - **Key facts grid** (2 columns):
      - CEO: `profile.ceo`
      - Employees: `profile.fullTimeEmployees`, formatted with commas
      - Headquarters: `profile.city, profile.state`
      - Website: `profile.website` as clickable link (`target="_blank"`)
      - IPO Date: `profile.ipoDate`
    - Handle missing fields gracefully (some small caps lack CEO, employees, etc.)

---

## Phase F — Financials Tab

### Task 18: Financials View Container
- **Complexity:** Medium
- **Depends on:** Task 9, Task 11
- **Parallel group:** F1
- **Files:**
  - `src/components/stock/financials/financials-view.tsx` — top-level financials container (client component)
- **Details:**
  - `'use client'` — this is the stateful orchestrator for the entire Financials tab
  - **State management:**
    - `activeStatement: 'income' | 'balance' | 'cashflow' | 'ratios'` (default: 'income')
    - `activePeriod: 'annual' | 'quarter'` (default: 'annual')
    - `selectedMetrics: Map<string, { chartType: 'bar' | 'line' }>` — tracks checked metrics and their chart type
    - `statementData: Record<string, FMPFinancialStatement[]>` — cache fetched data by key
  - Receives ALL annual financial data as props (income, balance, cashflow, ratios — all fetched server-side in Task 23). Only client-fetches when switching to quarterly period.
  - When period or statement changes: fetch from `/api/fmp/financials/[ticker]?statement=...&period=...`
  - Cache fetched data in state to avoid re-fetching on tab switches
  - Passes data and callbacks down to child components
  - Clears `selectedMetrics` when `activeStatement` changes (per spec)

### Task 19: Controls Bar
- **Complexity:** Simple
- **Depends on:** Task 18
- **Parallel group:** F2
- **Files:**
  - `src/components/stock/financials/controls-bar.tsx` — period toggle + statement sub-tabs
- **Details:**
  - Receives `activePeriod`, `activeStatement`, `onPeriodChange`, `onStatementChange` as props
  - **Period toggle:** Two buttons "Annual" | "Quarterly" — styled as segmented control / toggle group
  - **Statement sub-tabs:** "Income Statement" | "Balance Sheet" | "Cash Flow Statement" | "Ratios" — styled as underline tabs or pills
  - Compact horizontal layout, responsive (wraps on mobile)
  - Loading indicator when data is being fetched

### Task 20: Data Table
- **Complexity:** Complex
- **Depends on:** Task 18, Task 11, Task 7
- **Parallel group:** F3
- **Files:**
  - `src/components/stock/financials/data-table.tsx` — financial statement table with checkboxes
- **Details:**
  - Receives: `data: FMPFinancialStatement[]`, `lineItems: LineItemConfig[]`, `selectedMetrics: Map`, `onMetricToggle: (key) => void`
  - **Table structure:**
    - First column (sticky left): checkbox + metric label
    - Subsequent columns: one per period (most recent on left)
    - Column headers: year (annual: "2024", "2023"...) or quarter ("Q3 2024", "Q2 2024"...)
  - **Row rendering:**
    - Iterate `lineItems` config to determine row order and which FMP field to read
    - Checkbox (shadcn Checkbox) on the left of each row
    - Metric label from config
    - Values right-aligned, formatted per `lineItem.format`:
      - `currency` → `formatLargeNumber` (these are in millions/billions)
      - `percent` → `formatPercent`
      - `number` → `formatNumber`
      - `ratio` → `formatNumber(_, 2)`
    - Negative values: show in parentheses AND red text
  - **Selected row highlighting:** rows with checked metrics get `bg-accent/10` background
  - **Horizontal scroll:** table wrapper with `overflow-x-auto`, first column sticky
  - Use Geist Mono for all numeric cells
  - Annual: up to 10 columns; Quarterly: up to 12 columns

### Task 21: Chart Panel
- **Complexity:** Complex
- **Depends on:** Task 18, Task 7
- **Parallel group:** F4
- **Files:**
  - `src/components/stock/financials/chart-panel.tsx` — selected metrics visualization
  - `src/components/stock/financials/metric-legend.tsx` — chart legend with CAGR and controls
- **Details:**
  - `chart-panel.tsx`:
    - **Empty state:** When no metrics selected, show card with message: "Select metrics from the table below to visualize them" + icon
    - **Chart rendering** (when metrics selected):
      - Recharts `ResponsiveContainer` + `ComposedChart` (supports mixing Bar and Line)
      - X-axis: period labels (years or quarters)
      - Y-axis: auto-scaled, formatted with `formatLargeNumber`
      - For each selected metric: render as `Bar` or `Line` based on `chartType` in selectedMetrics
      - Colors from `CHART_COLORS` array, assigned by selection order
      - `Tooltip` showing all selected metric values for hovered period
      - Value labels on bars/data points (Recharts `label` prop)
    - **Download button:** Top-right of chart panel, exports chart as PNG
      - Use a ref on the chart container + `html-to-image` or canvas approach
  - `metric-legend.tsx`:
    - Rendered below the chart
    - For each selected metric, show:
      - Color swatch (matching chart color)
      - Metric display name
      - Total Change %: `calculateTotalChange(first, last)` formatted as percent
      - CAGR: `calculateCAGR(first, last, years)` formatted as percent
      - Bar/Line toggle: two small icon buttons to switch chart type for this metric
      - Remove (X) button to uncheck the metric
    - Calls `onChartTypeChange(key, type)` and `onMetricToggle(key)` callbacks

### Task 22: Wire Up Financials Tab
- **Complexity:** Medium
- **Depends on:** Task 18, Task 19, Task 20, Task 21
- **Parallel group:** F5
- **Files:**
  - `src/components/stock/financials/financials-view.tsx` — update with full wiring (same file as Task 18, second pass)
- **Details:**
  - Integrate all child components into the financials-view layout:
    - `<ChartPanel>` at the top
    - `<ControlsBar>` below chart
    - `<DataTable>` below controls
  - Wire all callbacks:
    - Checkbox toggle in DataTable → updates selectedMetrics state → ChartPanel re-renders
    - Period/statement change in ControlsBar → fetches new data → clears selected metrics → re-renders table
    - Chart type toggle in MetricLegend → updates selectedMetrics chartType → ChartPanel re-renders
    - Remove button in MetricLegend → removes from selectedMetrics
  - Add loading states with Skeleton components during data fetches
  - Handle edge cases: empty data arrays, all-null values for a metric

---

## Phase G — Polish, Placeholders & Error Handling

### Task 23: Placeholder Tabs & Stock Page Assembly
- **Complexity:** Simple
- **Depends on:** Task 10, Task 14
- **Parallel group:** G
- **Files:**
  - `src/components/placeholder-tab.tsx` — reusable "Coming Soon" placeholder
  - `src/app/stock/[ticker]/page.tsx` — main stock page Server Component (data fetching + assembly)
- **Details:**
  - `placeholder-tab.tsx`:
    - shadcn Card, centered content
    - Icon (clock or construction), "Coming Soon" heading, descriptive subtitle
    - Accepts `tabName: string` prop for contextual message ("News is coming soon")
  - `page.tsx`:
    - Server Component that receives `params.ticker`
    - Fetches all initial data in parallel via `Promise.all`:
      1. `getCompanyProfile(ticker)`
      2. `getQuote(ticker)`
      3. `getHistoricalPrices(ticker, from1YAgo, today)`
      4. `getKeyMetrics(ticker)`
      5. `getIncomeStatement(ticker, 'annual', 10)`
      6. `getBalanceSheet(ticker, 'annual', 10)`
      7. `getCashFlowStatement(ticker, 'annual', 10)`
      8. `getRatios(ticker, 'annual', 10)`
    - Validate ticker: if profile returns empty/error, show not-found page
    - Render `CompanyHeader` with profile + quote
    - Render `TabNavigation` with tab content:
      - Overview: `PriceChart` + `KeyMetrics` + `CompanyProfile`
      - Financials: `FinancialsView` with initial income statement data
      - Others: `PlaceholderTab`
    - Wrap sections in `Suspense` boundaries with `Skeleton` fallbacks
  - `layout.tsx` update: fetch profile + quote here so header is always visible while tab content streams

### Task 24: Error Handling & Edge Cases
- **Complexity:** Medium
- **Depends on:** Task 23
- **Parallel group:** G
- **Files:**
  - `src/app/stock/[ticker]/not-found.tsx` — invalid ticker page
  - `src/app/stock/[ticker]/error.tsx` — error boundary for stock page
  - `src/app/error.tsx` — global error boundary
  - `src/app/not-found.tsx` — global 404 page
  - `src/components/error-state.tsx` — reusable error state component
- **Details:**
  - `not-found.tsx` (stock): "Company not found" message with search bar to try another ticker
  - `error.tsx` (stock): `'use client'` error boundary, shows error message + "Try Again" button (calls `reset()`)
  - `error-state.tsx`: reusable component for section-level errors ("Unable to load financial data"), accepts `message` and optional `onRetry` callback
  - Global `not-found.tsx`: generic 404 with link back to home
  - Global `error.tsx`: catches unhandled errors, shows friendly message
  - In `page.tsx`: use `notFound()` from `next/navigation` when profile fetch returns empty array
  - FMP client: ensure `FMPError` is thrown with actionable messages

### Task 25: Responsive Polish & Final Styling
- **Complexity:** Medium
- **Depends on:** Task 15, Task 16, Task 17, Task 20, Task 21
- **Parallel group:** G
- **Files:**
  - All component files — responsive refinements (no new files)
- **Details:**
  - **Desktop (1280px+):** Verify full layout renders correctly
  - **Tablet (768-1279px):**
    - Key metrics grid: 2 columns
    - Financial data table: horizontal scroll with sticky first column
    - Chart panel: full width, reduced padding
  - **Mobile (<768px):**
    - Key metrics: single column
    - Data table: horizontal scroll, compact font size
    - Price chart: simplified (fewer x-axis labels)
    - Tab navigation: horizontal scroll if tabs overflow
    - Company header: stack logo/name vertically, price below
    - Search bar on home: full width with padding
  - **General polish:**
    - Consistent spacing (use Tailwind spacing scale)
    - Hover states on all interactive elements
    - Focus states for keyboard accessibility
    - Smooth transitions on tab switches (fade or slide)
    - Loading skeletons match component dimensions
    - Ensure all numbers use Geist Mono font family
    - Verify dark theme contrast ratios meet WCAG AA

---

## Dependency Graph

```
Task 1 (Init)
  ├── Task 2 (Tailwind/Fonts)
  │     └── Task 3 (shadcn/ui)
  │           └── Task 10 (Layout/Tabs) ──┐
  ├── Task 4 (FMP Types)                  │
  │     └── Task 5 (FMP Client)           │
  │           └── Task 6 (Endpoints) ─────┤
  │                 ├── Task 8 (Search API)│
  │                 ├── Task 9 (Data APIs) │
  │                 ├── Task 14 (Header)   │
  │                 ├── Task 16 (Metrics)  │
  │                 └── Task 17 (Profile)  │
  ├── Task 7 (Utils) ────────────────────┤
  │     ├── Task 15 (Price Chart)         │
  │     ├── Task 20 (Data Table)          │
  │     └── Task 21 (Chart Panel)         │
  └── Task 11 (Line Items Config) ───────┤
        ├── Task 20 (Data Table)          │
        └── Task 18 (Financials View) ────┤
              ├── Task 19 (Controls Bar)  │
              ├── Task 20 (Data Table)    │
              ├── Task 21 (Chart Panel)   │
              └── Task 22 (Wire Up) ──────┤
                                          │
  Task 12 (Search Bar) ← Task 8          │
  Task 13 (Home Page) ← Task 12          │
                                          │
  Task 23 (Assembly) ← ALL above ────────┘
  Task 24 (Error Handling) ← Task 23
  Task 25 (Responsive Polish) ← Tasks 15,16,17,20,21
```

## Parallelization Summary

| Group | Tasks | Description |
|-------|-------|-------------|
| A1 | 1 | Project init |
| A2 | 2 | Theme + fonts (after A1) |
| A3 | 3 | shadcn/ui (after A2) |
| B | 4, 5, 6, 7 | FMP types → client → endpoints + utils (4→5→6 chain, 7 parallel with 4) |
| C | 8, 9, 10, 11 | Route handlers + layout + config (all parallel, depend on B) |
| D | 12, 13, 14 | Search + home + header (all parallel, depend on C) |
| E | 15, 16, 17 | Overview tab components (all parallel, depend on D) |
| F | 18→19→20→21→22 | Financials tab (sequential chain, depends on D) |
| G | 23, 24, 25 | Assembly + errors + polish (parallel, depend on E+F) |

## Critical Path

**Fastest path to working app:** 1 → 2 → 3 → 4 → 5 → 6 → 9 → 14 → 23 → 24

**Financials is the bottleneck:** Tasks 18-22 form the longest sequential chain (5 tasks). Start early and consider splitting Task 20 (DataTable) and Task 21 (ChartPanel) to run in parallel since they share only the parent container interface.

## NPM Dependencies to Install

| Package | Purpose | Task |
|---------|---------|------|
| `recharts` | All charts (price, financials) | Task 15 |
| `html-to-image` | Chart PNG export | Task 21 |
| `server-only` | Guard server-only modules | Task 5 |

All other dependencies (next, react, typescript, tailwindcss, shadcn/ui components) are handled during scaffolding in Tasks 1-3.
