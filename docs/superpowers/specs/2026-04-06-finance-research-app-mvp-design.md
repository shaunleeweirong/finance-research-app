# Finance Research App — MVP Design Spec

## Context

We are building a commercial SaaS financial research platform similar to Fiscal.ai (formerly FinChat.io). The MVP focuses on delivering a high-polish company profile experience with interactive financial data visualization, powered by FMP (Financial Modeling Prep) API data and deployed on Vercel.

**Why this MVP scope:** Fiscal.ai's core value starts with making financial data accessible and visually rich. The AI Copilot, screener, and DCF features all build on top of solid data presentation. By nailing the company profile + financials experience first, we create a foundation that every future feature depends on.

**Target user:** Self-directed investors and fundamental analysts who want quick access to clean, visual financial data without paying for Bloomberg.

---

## MVP Scope

### In Scope
- Company search (ticker/name)
- Company profile page with tabbed layout
- **Overview tab:** price chart, key metrics grid, company info
- **Financials tab:** interactive data table with selectable metric charting
- Dark theme, high-polish fintech UI (Fiscal.ai quality)
- Everything FMP API provides for a given company

### Out of Scope (Placeholders)
- AI Copilot (chat UI placeholder only)
- Stock screener
- DCF modeling
- User authentication / accounts
- Watchlists / portfolios
- API / B2B platform
- Notifications / alerts
- News, Estimates, Ownership, Filings tabs (placeholder "Coming Soon")

---

## Architecture

### Approach: Server-First, No Database

```
User searches "AAPL"
  -> / (Home page with search)
  -> /stock/AAPL (Server Component)
    -> Next.js route handlers fetch from FMP API
    -> Cached via Next.js data cache (revalidation per data type)
    -> Server Component renders HTML, streams to client
    -> Interactive charts (price, financials) hydrate on client
```

**Why no database:** FMP API is the source of truth. Next.js caching handles performance. Adding a DB for MVP adds sync complexity with no user-facing benefit. When we add auth/watchlists/screener later, we add Neon Postgres — the route handler layer carries forward unchanged.

### Tech Stack
- **Next.js 15** — App Router, Server Components, Route Handlers
- **TypeScript** — strict mode throughout
- **Tailwind CSS** + **shadcn/ui** — dark theme, high-polish components
- **Recharts** — all data visualizations (price charts, financial bar/line charts)
- **Vercel** — deployment, edge caching, serverless functions

### Caching Strategy
| Data Type | Revalidation Period | Rationale |
|-----------|-------------------|-----------|
| Company profile | 24 hours | Rarely changes |
| Financial statements | 6 hours | Updates after earnings releases |
| Financial ratios | 6 hours | Derived from statements |
| Historical prices | 15 minutes | Intraday movement |
| Company search | No cache | Must be real-time |

---

## Routes

```
/                    -> Home page (centered search prompt)
/stock/[ticker]      -> Company profile page (tabbed layout)
```

### Home Page (`/`)

Minimal landing page:
- Centered logo/brand name
- Large search input with autocomplete dropdown
- Typing triggers FMP company search endpoint
- Selecting a result navigates to `/stock/[ticker]`
- No trending/popular tickers for MVP — keep home page minimal

### Company Profile Page (`/stock/[ticker]`)

#### Persistent Company Header

Visible across all tabs:
- Company logo (FMP `image` field)
- Ticker symbol + full company name
- Current price + daily change (absolute $ and %)
- Exchange, sector, industry, market cap — single-line summary below

#### Tabs

| Tab | Status | Description |
|-----|--------|-------------|
| Overview | **Functional** | Price chart, key metrics, company profile |
| Financials | **Functional** | Data table + selectable metric charting |
| News | Placeholder | "Coming Soon" card |
| Estimates | Placeholder | "Coming Soon" card |
| Ownership | Placeholder | "Coming Soon" card |
| Filings | Placeholder | "Coming Soon" card |

---

## Overview Tab

### Price Chart
- **Type:** Interactive line chart (Recharts `LineChart`)
- **Time range buttons:** 1D | 1W | 1M | 3M | 6M | 1Y | 5Y | ALL
- **Interaction:** Tooltip on hover showing price + date + volume
- **Data source:** FMP historical daily price endpoint; intraday for 1D view
- **Default view:** 1Y on page load
- **Styling:** Gradient fill under line, green for up / red for down vs. previous close

### Key Metrics Grid
- Responsive grid of metric cards (3-4 columns on desktop, 2 on tablet, 1 on mobile)
- Each card shows: metric label and current value (formatted appropriately per metric type)
- **Metrics included:**
  - P/E Ratio
  - EPS (Diluted)
  - Market Cap
  - Dividend Yield
  - Beta
  - 52-Week High / Low
  - Revenue (TTM)
  - Net Income (TTM)
  - Profit Margin
  - ROE (Return on Equity)
  - Debt-to-Equity
  - Free Cash Flow (TTM)
- **Data source:** FMP company key metrics and ratios endpoints

### Company Profile Card
- Company description (1-2 paragraph summary from FMP)
- Key facts: CEO, number of employees, founded year, headquarters (city, state), website (clickable link), IPO date
- **Data source:** FMP company profile endpoint

---

## Financials Tab

The richest component in the MVP. Two-panel layout: chart on top, data table below.

### Chart Panel (Top)
- Renders when user checks one or more metrics in the table below
- **Default chart type:** Grouped bar chart
- **Per-metric toggle:** Bar | Line (icon buttons per metric in legend)
- **Value labels** displayed on each bar/data point
- **Legend below chart:** Shows each selected metric with:
  - Color indicator
  - Metric name
  - Total Change % over the displayed period
  - CAGR (Compound Annual Growth Rate) over the displayed period
  - Chart type toggle icons (bar/line)
  - Remove (X) button
- **Download button:** Export chart as PNG
- **Empty state:** When no metrics selected, show instructional message: "Select metrics from the table below to visualize them"

### Controls Bar (Between chart and table)
- **Period toggle:** Annual (default) | Quarterly
- **Statement sub-tabs:** Income Statement (default) | Balance Sheet | Cash Flow Statement | Ratios
- Each sub-tab loads the corresponding FMP endpoint data

### Data Table (Bottom)
- **Columns:** Metric name (leftmost, sticky) + one column per period (most recent on left)
  - Annual: up to 10 years of history
  - Quarterly: up to 12 quarters
- **Rows:** Each financial line item from the statement
  - Checkbox on the left of each row for selecting metrics to chart
  - Metric name (clickable row for expand/collapse if sub-items exist)
  - Numerical values, right-aligned, formatted with thousands separators
  - Negative values shown in parentheses or red text
- **Highlighting:** Selected (checked) rows get a subtle highlight background
- **Data source:** FMP income statement, balance sheet, cash flow statement endpoints (annual and quarterly variants), plus FMP ratios endpoint for the Ratios sub-tab

### Income Statement Line Items
- Total Revenue
- Cost of Revenue
- Gross Profit
- Gross Profit Margin (%)
- R&D Expenses
- SG&A Expenses
- Operating Income
- Operating Margin (%)
- Interest Expense
- Income Before Tax
- Income Tax Expense
- Net Income
- Net Profit Margin (%)
- Basic EPS
- Diluted EPS
- Weighted Average Shares Outstanding

### Balance Sheet Line Items
- Cash & Cash Equivalents
- Short-Term Investments
- Total Current Assets
- Property, Plant & Equipment (Net)
- Goodwill & Intangibles
- Total Assets
- Total Current Liabilities
- Long-Term Debt
- Total Liabilities
- Total Shareholders' Equity
- Total Debt
- Net Debt

### Cash Flow Statement Line Items
- Net Income
- Depreciation & Amortization
- Stock-Based Compensation
- Cash from Operations
- Capital Expenditure
- Cash from Investing
- Debt Repayment / Issuance
- Dividends Paid
- Cash from Financing
- Net Change in Cash
- Free Cash Flow

### Ratios (Key Financial Ratios)
- Current Ratio
- Quick Ratio
- Debt/Equity
- Return on Equity (ROE)
- Return on Assets (ROA)
- Return on Invested Capital (ROIC)
- Gross Margin
- Operating Margin
- Net Margin
- Free Cash Flow Margin
- Price/Earnings
- Price/Sales
- Price/Book
- EV/EBITDA

---

## Project Structure

```
src/
  app/
    layout.tsx                    # Root layout: dark theme, fonts, metadata
    page.tsx                      # Home page: search prompt
    stock/[ticker]/
      page.tsx                    # Server component: fetches all data for ticker
      layout.tsx                  # Ticker layout: company header + tab navigation
  components/
    search/
      search-bar.tsx              # Search input with autocomplete (client component)
      search-results.tsx          # Dropdown results list
    stock/
      company-header.tsx          # Logo, name, price, change, meta info
      tab-navigation.tsx          # Tab bar component
      overview/
        price-chart.tsx           # Interactive price line chart (client)
        key-metrics.tsx           # Metrics card grid
        company-profile.tsx       # Description + facts card
      financials/
        financials-view.tsx       # Top-level financials container (client)
        chart-panel.tsx           # Selected metrics chart
        controls-bar.tsx          # Period/statement toggles
        data-table.tsx            # Financial statement table with checkboxes
        metric-legend.tsx         # Chart legend with CAGR, toggles
    ui/                           # shadcn/ui components (button, card, tabs, etc.)
    placeholder-tab.tsx           # "Coming Soon" placeholder for inactive tabs
  lib/
    fmp/
      client.ts                   # FMP API client: base URL, API key, error handling
      types.ts                    # TypeScript interfaces for all FMP response shapes
      endpoints/
        profile.ts                # GET company profile
        quote.ts                  # GET real-time quote
        price.ts                  # GET historical daily/intraday prices
        financials.ts             # GET income statement, balance sheet, cash flow
        ratios.ts                 # GET financial ratios
        search.ts                 # GET company search
    utils/
      format.ts                   # formatCurrency(), formatPercent(), formatLargeNumber()
      chart-helpers.ts            # calculateCAGR(), transformToChartData(), etc.
  config/
    financial-line-items.ts       # Defines which fields to show for each statement type,
                                  # display names, formatting rules, and row ordering
```

---

## Data Flow

### Search Flow
```
User types in search bar
  -> Debounced (300ms) client-side fetch to /api/fmp/search?q=...
  -> Route handler calls FMP /search endpoint
  -> Returns company matches (name, ticker, exchange)
  -> User selects result -> router.push(/stock/[ticker])
```

### Company Profile Page Load
```
/stock/[ticker] (Server Component)
  -> Parallel fetch via Promise.all:
     1. FMP company profile
     2. FMP real-time quote
     3. FMP historical daily prices (1Y default)
     4. FMP key metrics
     5. FMP income statement (annual, 10 years)
     6. FMP balance sheet (annual, 10 years)
     7. FMP cash flow statement (annual, 10 years)
     8. FMP financial ratios (annual, 10 years)
  -> Each fetch goes through route handlers with Next.js cache + revalidation
  -> Data passed to client components as props
  -> Page streams progressively (Suspense boundaries per section)
```

### Financials Interaction Flow (Client-Side)
```
User clicks "Quarterly" toggle
  -> Client fetches quarterly data (or uses cached)
  -> Table re-renders with quarterly columns

User checks "Total Revenue" checkbox
  -> Revenue data added to chart panel state
  -> Chart renders bar chart for revenue
  -> Legend shows metric name + CAGR

User toggles Revenue chart type to "Line"
  -> Chart re-renders Revenue as line, other metrics unchanged

User clicks "Balance Sheet" sub-tab
  -> Table switches to balance sheet line items
  -> Chart clears selected metrics (selections do not persist across statement tabs)
```

---

## Visual Design

### Theme
- **Background:** Dark navy/charcoal (#0a0f1a or similar)
- **Surface cards:** Slightly lighter (#111827)
- **Text primary:** White/near-white (#f1f5f9)
- **Text secondary:** Muted gray (#94a3b8)
- **Accent/brand:** Blue (#3b82f6) or teal
- **Positive values:** Green (#22c55e)
- **Negative values:** Red (#ef4444)
- **Chart colors:** Blue, orange, green, purple (distinct, accessible palette for multi-metric charts)

### Typography
- **Headings:** Inter or Geist Sans (clean, modern)
- **Numbers/data:** Geist Mono or JetBrains Mono (monospace for alignment in tables)

### Responsive Behavior
- **Desktop (1280px+):** Full layout as designed
- **Tablet (768-1279px):** Metrics grid goes to 2 columns, chart/table scroll horizontally
- **Mobile (< 768px):** Single column, horizontal scroll on data table, chart simplified

---

## FMP API Endpoints Used

| Endpoint | Purpose | Cache |
|----------|---------|-------|
| `GET /api/v3/search?query={q}` | Company search autocomplete | None |
| `GET /api/v3/profile/{ticker}` | Company profile, logo, description | 24h |
| `GET /api/v3/quote/{ticker}` | Real-time price, change, volume | 15min |
| `GET /api/v3/historical-price-full/{ticker}` | Historical daily prices | 15min |
| `GET /api/v3/income-statement/{ticker}?period=annual&limit=10` | Income statement | 6h |
| `GET /api/v3/income-statement/{ticker}?period=quarter&limit=12` | Quarterly income | 6h |
| `GET /api/v3/balance-sheet-statement/{ticker}?period=annual&limit=10` | Balance sheet | 6h |
| `GET /api/v3/balance-sheet-statement/{ticker}?period=quarter&limit=12` | Quarterly balance | 6h |
| `GET /api/v3/cash-flow-statement/{ticker}?period=annual&limit=10` | Cash flow | 6h |
| `GET /api/v3/cash-flow-statement/{ticker}?period=quarter&limit=12` | Quarterly cash flow | 6h |
| `GET /api/v3/ratios/{ticker}?period=annual&limit=10` | Financial ratios | 6h |
| `GET /api/v3/key-metrics/{ticker}` | Key metrics (P/E, EPS, etc.) | 6h |
| `GET /api/v3/historical-chart/1min/{ticker}` | Intraday prices (1D view) | 15min |

**Authentication:** All requests require `?apikey={FMP_API_KEY}` query parameter. Key stored as `FMP_API_KEY` environment variable on Vercel.

---

## Error Handling

- **Invalid ticker:** Show "Company not found" page with search suggestion
- **FMP API down:** Show cached data if available, otherwise graceful error state per section ("Unable to load financial data. Please try again.")
- **Rate limiting:** FMP free tier has limits; route handlers should handle 429 responses with exponential backoff
- **Missing data fields:** Some companies have incomplete data (especially smaller caps). Each component handles `null`/`undefined` gracefully — show "N/A" or hide the field.

---

## Future Expansion Path

This MVP is designed to grow into the full Fiscal.ai feature set:

1. **Phase 2 — Auth + Watchlists:** Add Clerk authentication, Neon Postgres for user data, saved watchlists
2. **Phase 3 — AI Copilot:** Wire up chat UI to Claude/GPT with FMP data as context, source citations
3. **Phase 4 — News + Filings:** Activate News and Filings tabs with FMP endpoints
4. **Phase 5 — Screener:** Add stock screener (requires DB for indexed queries across all companies)
5. **Phase 6 — Estimates + Ownership:** Activate remaining tabs
6. **Phase 7 — DCF Modeling:** Built-in valuation models
7. **Phase 8 — API Platform:** B2B data feed and embeddable widgets
