import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { getUserPlan } from '@/lib/auth/get-user-plan';
import { canAccess } from '@/lib/auth/plans';

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const CACHE_TTL_DAYS = 7;

// Soft per-user throttle: max 10 generation requests per user per minute.
// NOTE: This Map is per-serverless-isolate and resets on cold starts. It is
// NOT a durable rate limiter — for defense against cost abuse we rely on:
//   1) Mandatory authentication (checked in-handler below)
//   2) The 7-day Supabase cache (1 Perplexity call per ticker per week)
//   3) `?refresh=true` gated to premium plan (paying customers)
// For a durable limiter, migrate to Upstash Redis or Vercel KV.
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10;

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}

interface Citation {
  url: string;
  title?: string;
}

interface PerplexityMessage {
  role: string;
  content: string;
}

interface PerplexityChoice {
  message: PerplexityMessage;
}

interface PerplexityResponse {
  choices: PerplexityChoice[];
  citations?: string[];
}

interface ParsedSummary {
  title: string;
  dateRange: string;
  bullCase: string[];
  bearCase: string[];
  keyDevelopments: string[];
  managementSignals: string[];
  competitiveLandscape: string[];
  whatToWatch: string[];
}

function parseSection(raw: string, sectionName: string): string[] {
  const pattern = new RegExp(
    `${sectionName}:\\s*\\n([\\s\\S]*?)(?=\\n(?:BULL CASE|BEAR CASE|KEY DEVELOPMENTS|MANAGEMENT SIGNALS|COMPETITIVE LANDSCAPE|WHAT TO WATCH|$))`,
    'i',
  );
  const match = raw.match(pattern);
  if (!match) return [];

  return match[1]
    .split('\n')
    .map((line) => line.replace(/^[-•*]\s*/, '').replace(/\*\*/g, '').replace(/\[\d+\]/g, '').trim())
    .filter((line) => line.length > 0 && !line.startsWith('NONE'));
}

function parseStructuredSummary(raw: string, dateRange: string): ParsedSummary {
  const titleMatch = raw.match(/TITLE:\s*(.+?)(?:\n|$)/);
  const title = titleMatch?.[1]?.replace(/^["']|["']$/g, '').replace(/\*\*/g, '').trim() ?? '';

  const bullCase = parseSection(raw, 'BULL CASE');
  const bearCase = parseSection(raw, 'BEAR CASE');
  const keyDevelopments = parseSection(raw, 'KEY DEVELOPMENTS');
  const managementSignals = parseSection(raw, 'MANAGEMENT SIGNALS');
  const competitiveLandscape = parseSection(raw, 'COMPETITIVE LANDSCAPE');
  const whatToWatch = parseSection(raw, 'WHAT TO WATCH');

  // If no sections parsed at all, return empty — the component handles graceful degradation
  return { title: title || 'Stock Summary', dateRange, bullCase, bearCase, keyDevelopments, managementSignals, competitiveLandscape, whatToWatch };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ ticker: string }> },
) {
  const { ticker } = await params;

  if (!ticker || !/^[A-Z0-9.\-^]{1,10}$/.test(ticker)) {
    return NextResponse.json({ error: 'Invalid ticker' }, { status: 400 });
  }

  // Defense-in-depth auth check (middleware also enforces this).
  const userClient = await createClient();
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Rate limit per authenticated user
  if (isRateLimited(user.id)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  // Only premium users can bypass the 7-day cache; prevents free users from
  // forcing paid Perplexity calls by spamming `?refresh=true`.
  const refreshRequested = new URL(_request.url).searchParams.get('refresh') === 'true';
  const userPlan = await getUserPlan(user.id);
  const forceRefresh = refreshRequested && canAccess(userPlan, 'ai:copilot');

  const rawName = new URL(_request.url).searchParams.get('name') ?? ticker;
  const companyName = rawName.replace(/[^a-zA-Z0-9\s.,&'\-()]/g, '').slice(0, 100);

  try {
    const supabase = await createServiceClient();

    // Check cache — return if summary exists and is less than 7 days old
    if (!forceRefresh) {
      const { data: cached } = await supabase
        .from('stock_summaries')
        .select('summary, citations, generated_at')
        .eq('ticker', ticker)
        .gte(
          'generated_at',
          new Date(Date.now() - CACHE_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString(),
        )
        .single();

      if (cached) {
        let parsed: ParsedSummary | null;
        try {
          const obj = JSON.parse(cached.summary);
          parsed = obj.bullCase ? obj : null;
        } catch {
          parsed = null;
        }
        if (parsed) {
          return NextResponse.json({
            ...parsed,
            citations: cached.citations ?? [],
            generatedAt: cached.generated_at,
            cached: true,
          });
        }
        // Old format — delete stale cache so it regenerates
        await supabase.from('stock_summaries').delete().eq('ticker', ticker);
      }
    }

    // No valid cache — generate via Perplexity Sonar
    if (!PERPLEXITY_API_KEY) {
      return NextResponse.json(
        { error: 'AI summary service not configured' },
        { status: 503 },
      );
    }

    const today = new Date();
    // 90-day window — fundamentals move slower than sentiment, so a wider net
    // catches genuine business events (product cycles, regulatory rulings,
    // customer wins) that a 30-day window often misses.
    const windowStart = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);
    const dateRange = `${windowStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

    const prompt = `Write a structured BUSINESS brief for ${companyName} (ticker: ${ticker}) covering ${dateRange}.

This is a business analysis — not a stock-market analysis. Write about what is happening to the COMPANY: its products, customers, competitors, unit economics, regulatory environment, supply chain, capital allocation, and leadership. Do NOT write about the stock.

Anchor every BULL/BEAR bullet in DURABLE BUSINESS FUNDAMENTALS — the moat, unit economics, structural advantages or risks — and use 90-day developments to show how those fundamentals are advancing or being threatened. Recent events matter only when they materially change a durable business factor.

HARD EXCLUSIONS — never mention any of the following:
- Stock price, share price, price moves, percentage gains/losses, "stock bounced/dropped/rebounded"
- Market capitalisation, "market value wipeout", enterprise value changes
- Analyst ratings ("Buy", "Hold", "Strong Buy"), number of analysts, consensus ratings
- Price targets ("targets up to $X", "trimmed price target", "implies X% upside")
- Whether investors are "bullish" or "bearish" — only what is happening to the business
- Index moves, geopolitical-driven market reactions, "tech sentiment"

If your search returns only price-action or rating coverage, write NONE for that section.
DO NOT paraphrase a price-action story into business language — omit it.

Use this EXACT format. Section headers must match exactly so the parser can read them:

TITLE: [Business-focused headline — what is happening to the company. Max 12 words. Do not reference stock, price, or sentiment.]

BULL CASE:
- [DURABLE ADVANTAGE — required: a timeless business strength: the moat, unit economics structurally improving, a customer cohort with high LTV, a network effect compounding, a regulatory advantage. Explain WHY it endures.]
- [RECENT DEVELOPMENT — required: a 90-day event (product launch, customer win, M&A, regulatory ruling, executive change) that materially STRENGTHENS the durable advantage above. Tie it back to the thesis explicitly.]
- [Optional third bullet — either a second durable advantage or another recent development.]

BEAR CASE:
- [DURABLE RISK — required: a timeless business risk: customer concentration, regulatory exposure, eroding unit economics, a technology shift threatening the moat, supply-chain dependency. Explain WHY it endures.]
- [RECENT DEVELOPMENT — required: a 90-day event that materially DEEPENS the durable risk above. Tie it back to the thesis explicitly.]
- [Optional third bullet — either a second durable risk or another recent development.]

KEY DEVELOPMENTS:
- [A specific business event with date: product launch, customer win/loss, M&A, regulatory ruling, factory opening, executive change, contract signing.]
- [Another concrete business event.]

MANAGEMENT SIGNALS:
- [What management said or did about the BUSINESS: capital allocation choice, capex commitment, hiring direction, segment reorganisation, strategic pivot. Quote sparingly and accurately. Report guidance as a business-direction signal, NOT as a stock-impact event.]
- [Another management signal if available.]

COMPETITIVE LANDSCAPE:
- [A peer's product launch, a market-share shift, an emerging competitor or substitute, a customer choosing this company over a rival or vice versa. Frame as competitive dynamics, not equity-market commentary.]

WHAT TO WATCH:
- [An upcoming business milestone with date: product launch, regulatory decision, contract renewal, capacity coming online, geographic expansion.]
- [A business KPI to monitor: customer count, take rate, gross margin trajectory, churn, capacity utilisation — not stock-related metrics.]

EXAMPLES of BAD writing (do NOT write any of these — these are exactly the kinds of bullets that have been rejected before):
- "67 analysts cover the stock with no Sell ratings, implying 44% upside" — banned: ratings + upside
- "AI release sparked a 6.6% stock bounce signaling investor enthusiasm" — banned: price action
- "Wells Fargo trimmed price target on tariff risk" — banned: price target
- "$300B market value wipeout" — banned: market cap move
- "Strong Buy consensus from 45 analysts with targets up to $1015" — banned: ratings + targets
- "Q4 EPS beat estimates by 8%, revenue by 2.4%" — banned: bare number without business context
- "Iran ceasefire announcement boosted shares 6.7%" — banned: price reaction to macro news

EXAMPLES of GOOD writing (write like this — durable factor + recent event tied together):
- "Meta's Reels ad load is approaching parity with Feed for the first time, structurally shifting incremental ad inventory toward short-form and reducing exposure to declining long-form engagement among under-30 users."
- "The California addiction-liability ruling against Meta establishes a negligence standard that could force product redesign of recommendation systems used across Instagram and Facebook, raising compliance cost on the company's most engaged surfaces."
- "Capex guidance of $115-135B for 2026 — nearly double prior year — signals management is committing to in-house AI training capacity rather than renting frontier compute, reshaping the cost structure of the family-of-apps segment for the next 3-5 years."
- "Apple's launch of on-device generative features without a Meta partnership reduces Meta's reach into the iOS LLM-assistant surface area, widening dependence on its own apps for distribution."

Rules:
- Every BULL/BEAR section must contain at least one DURABLE bullet anchored in timeless business fundamentals AND at least one RECENT bullet tying a 90-day event back to that durable factor.
- Numbers are allowed only when they describe the BUSINESS (revenue, capex, units sold, customers, capacity) — never when they describe the STOCK.
- Never fabricate quotes, executives, customers, or product names you cannot verify.
- If you have no sourced BUSINESS information for a section, write NONE (do not speculate, do not paraphrase price commentary).
- Remove inline citation markers like [1][2] from the text.
- Keep each bullet to 1-2 sentences max.
- No BODY section, no preamble, no closing remarks.`;

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          {
            role: 'system',
            content:
              'You are a senior equity research analyst writing a BUSINESS brief — not a stock-market brief. Your job is to explain what is happening to the company AS A BUSINESS: its products, customers, competitive position, unit economics, regulatory environment, supply chain, leadership, and capital allocation. Anchor every section in durable business fundamentals — the moat, the unit economics, structural advantages — and layer recent developments on top to show how those fundamentals are advancing or being threatened. Search earnings-call transcripts, regulatory filings, and product/customer journalism — not market commentary. Do NOT write about stock price, share price moves, market cap changes, analyst ratings, price targets, upside/downside percentages, or who is bullish/bearish on the stock. If a source only discusses price action or ratings, ignore it. Omit any section where you lack concrete sourced business information. Never include inline citation markers like [1] or [2].',
          },
          { role: 'user', content: prompt },
        ],
        max_tokens: 1000,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Perplexity API error:', response.status, errorText.slice(0, 200));
      return NextResponse.json(
        { error: 'Failed to generate summary' },
        { status: 502 },
      );
    }

    const data: PerplexityResponse = await response.json();
    const rawContent = data.choices?.[0]?.message?.content ?? '';
    const citations: Citation[] = (data.citations ?? []).map((url: string) => ({
      url,
    }));

    if (!rawContent) {
      return NextResponse.json(
        { error: 'Empty summary returned' },
        { status: 502 },
      );
    }

    const parsed = parseStructuredSummary(rawContent, dateRange);
    const summaryJson = JSON.stringify(parsed);

    await supabase.from('stock_summaries').upsert(
      {
        ticker,
        summary: summaryJson,
        citations,
        generated_at: new Date().toISOString(),
      },
      { onConflict: 'ticker' },
    );

    return NextResponse.json({
      ...parsed,
      citations,
      generatedAt: new Date().toISOString(),
      cached: false,
    });
  } catch (error) {
    console.error('Stock summary error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
