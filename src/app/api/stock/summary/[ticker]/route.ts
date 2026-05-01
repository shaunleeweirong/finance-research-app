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
  debates: string[];
  keyDevelopments: string[];
  managementSignals: string[];
  competitiveLandscape: string[];
  whatToWatch: string[];
}

function parseSection(raw: string, sectionName: string): string[] {
  const pattern = new RegExp(
    `${sectionName}:\\s*\\n([\\s\\S]*?)(?=\\n(?:BULL CASE|BEAR CASE|DEBATES|KEY DEVELOPMENTS|MANAGEMENT SIGNALS|COMPETITIVE LANDSCAPE|WHAT TO WATCH|$))`,
    'i',
  );
  const match = raw.match(pattern);
  if (!match) return [];

  return match[1]
    .split('\n')
    // Strip leading bullets, bold markdown, and *numeric* citation markers like [1][2].
    // Source-type tags like [earnings call], [10-K], [reporting] are preserved on purpose.
    .map((line) => line.replace(/^[-•*]\s*/, '').replace(/\*\*/g, '').replace(/\[\d+\]/g, '').trim())
    .filter((line) => line.length > 0 && !line.startsWith('NONE'));
}

function parseStructuredSummary(raw: string, dateRange: string): ParsedSummary {
  const titleMatch = raw.match(/TITLE:\s*(.+?)(?:\n|$)/);
  const title = titleMatch?.[1]?.replace(/^["']|["']$/g, '').replace(/\*\*/g, '').trim() ?? '';

  const bullCase = parseSection(raw, 'BULL CASE');
  const bearCase = parseSection(raw, 'BEAR CASE');
  const debates = parseSection(raw, 'DEBATES');
  const keyDevelopments = parseSection(raw, 'KEY DEVELOPMENTS');
  const managementSignals = parseSection(raw, 'MANAGEMENT SIGNALS');
  const competitiveLandscape = parseSection(raw, 'COMPETITIVE LANDSCAPE');
  const whatToWatch = parseSection(raw, 'WHAT TO WATCH');

  // If no sections parsed at all, return empty — the component handles graceful degradation
  return { title: title || 'Stock Summary', dateRange, bullCase, bearCase, debates, keyDevelopments, managementSignals, competitiveLandscape, whatToWatch };
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

PRIMARY-SOURCE PRIORITY: Search for and lean on (in this order) the company's most recent 10-Q (or 10-K if a 10-Q is not yet filed for this period), the latest earnings call transcript, 8-K filings, IR press releases, and regulator/agency announcements. Treat third-party reporting as a tiebreaker, not a primary source. Specifically, search for "highlights from the latest quarterly report" and the most recent earnings call to ground your bullets in what management actually disclosed.

Anchor every BULL/BEAR bullet in DURABLE BUSINESS FUNDAMENTALS — the moat, unit economics, structural advantages or risks — and use 90-day developments to show how those fundamentals are advancing or being threatened. Recent events matter only when they materially change a durable business factor.

HARD EXCLUSIONS — never mention any of the following:
- Stock price, share price, price moves, percentage gains/losses, "stock bounced/dropped/rebounded"
- Market capitalisation, "market value wipeout", enterprise value changes
- Analyst ratings ("Buy", "Hold", "Strong Buy"), number of analysts, consensus ratings
- Price targets ("targets up to $X", "trimmed price target", "implies X% upside")
- Whether investors are "bullish" or "bearish" — only what is happening to the business
- Index moves, geopolitical-driven market reactions, "tech sentiment"

If your search returns only price-action or rating coverage, search again with broader queries before writing NONE.
DO NOT paraphrase a price-action story into business language — omit it.

SOURCE TAGS — every bullet must end with a tag in square brackets identifying the strongest source backing the claim:
- [earnings call] — direct from management on the quarterly call
- [10-Q] / [10-K] / [8-K] / [proxy] — formal SEC filing
- [IR release] — company investor-relations communication
- [regulator] — SEC, EU, FDA, FTC, or equivalent agency announcement
- [reporting] — third-party journalism (use sparingly)

Use this EXACT format. Section headers must match exactly so the parser can read them:

TITLE: [Business-focused headline — what is happening to the company. Max 12 words. Do not reference stock, price, or sentiment.]

BULL CASE:
- [DURABLE ADVANTAGE — required: a timeless business strength (the moat, unit economics structurally improving, a customer cohort with high LTV, a network effect compounding, a regulatory advantage). Explain WHY it endures and cite a SPECIFIC operating KPI when possible (ARPU, take rate, NRR, GMV, gross margin trajectory, capacity utilisation, attach rate) rather than aggregate revenue/margin. 2-3 sentences. End with a source tag.]
- [RECENT DEVELOPMENT — required: a 90-day event (product launch, customer win, M&A, regulatory ruling, executive change, capex commitment) that materially STRENGTHENS the durable advantage above. Tie it back to the thesis explicitly. 2-3 sentences. End with a source tag.]
- [Optional third bullet — either a second durable advantage or another recent development.]

BEAR CASE:
- [DURABLE RISK — required: a timeless business risk (customer concentration, regulatory exposure, eroding unit economics, a technology shift threatening the moat, supply-chain dependency). Explain WHY it endures and cite a specific operating KPI when possible. 2-3 sentences. End with a source tag.]
- [RECENT DEVELOPMENT — required: a 90-day event that materially DEEPENS the durable risk above. Tie it back to the thesis explicitly. 2-3 sentences. End with a source tag.]
- [Optional third bullet — either a second durable risk or another recent development.]

DEBATES:
- [A topic where reasonable bull and bear analysts disagree, framed as the strongest version of each side, in one bullet. Examples: AI capex magnitude (compute moat vs. margin compression), regulatory exposure (operational adjustment vs. structural product redesign), platform shift (incumbent advantage vs. disruptor leverage), M&A integration (capability acquisition vs. distraction risk). 2-3 sentences. End with a source tag.]
- [A second debate, if there is one with strong arguments on both sides.]

KEY DEVELOPMENTS:
- [A specific dated business event from the period: product launch, customer win/loss, M&A, regulatory ruling, factory opening, executive change, contract signing, guidance update. End with a source tag.]
- [Another concrete business event.]

MANAGEMENT SIGNALS:
- [What management said or did about the BUSINESS — capital allocation choice, capex commitment, hiring direction, segment reorganisation, strategic pivot. Pull from earnings call transcripts and IR releases first. Quote sparingly and accurately. Report guidance as a business-direction signal, NOT as a stock-impact event. End with a source tag.]
- [Another management signal if available.]

COMPETITIVE LANDSCAPE (REQUIRED — always include at least one bullet; if your initial search returns nothing, broaden the query):
- [A peer's product launch, a market-share shift, an emerging competitor or substitute, a customer choosing this company over a rival or vice versa. Frame as competitive dynamics, not equity-market commentary. End with a source tag.]
- [A second competitive dynamic if material.]

WHAT TO WATCH (REQUIRED — always include at least two bullets; combine known forward-dated events with KPIs to monitor):
- [An upcoming business milestone with a specific date or window: next earnings, product launch, regulatory decision, contract renewal, capacity coming online, geographic expansion. End with a source tag.]
- [A business KPI to monitor over the next 1-2 quarters: customer count, take rate, gross margin trajectory, churn, capacity utilisation, segment mix shift — not stock-related metrics. End with a source tag.]

EXAMPLES of BAD writing (do NOT write any of these — these are exactly the kinds of bullets that have been rejected before):
- "67 analysts cover the stock with no Sell ratings, implying 44% upside" — banned: ratings + upside
- "AI release sparked a 6.6% stock bounce signaling investor enthusiasm" — banned: price action
- "Wells Fargo trimmed price target on tariff risk" — banned: price target
- "$300B market value wipeout" — banned: market cap move
- "Strong Buy consensus from 45 analysts with targets up to $1015" — banned: ratings + targets
- "Q4 EPS beat estimates by 8%, revenue by 2.4%" — banned: bare aggregate without operating KPI or business context
- "Iran ceasefire announcement boosted shares 6.7%" — banned: price reaction to macro news

EXAMPLES of GOOD writing (write like this — durable factor + recent event + specific KPI + source tag):
- "Meta's advertising moat compounds through 3.4B family DAP and a 60%+ Reels ad-load mix on Instagram, with US/EU ARPU growing ~14% YoY — a structurally widening gap vs. Snap and X. Q1 earnings disclosure showed Reels revenue inflection across the family of apps. [earnings call]"
- "Capex of $125-145B for 2026 builds proprietary AI training capacity that reduces cloud-vendor dependency for the family-of-apps surface — a 3-5 year cost-structure shift management explicitly tied to ad-ranking improvements on the Q1 call. The shift to in-house compute alters the operating leverage of the next two years. [earnings call] [10-Q]"
- "Recommendation-system regulation in the EU is the durable risk most likely to reshape product economics, since the engagement engine drives the bulk of ad inventory. The April DSA enforcement action against a peer establishes a precedent that could force structural redesign of how this company personalises content. [regulator]"
- "TikTok's US fate continues to anchor a tail risk and tail opportunity: a forced sale or shutdown would hand 80M+ engagement-hours back to Reels and Stories, potentially worth $5-10B in incremental ad revenue at current pricing. The most recent CFIUS update suggests the timeline is converging into the next two quarters. [reporting] [regulator]"

Rules:
- Every BULL/BEAR section must contain at least one DURABLE bullet anchored in timeless business fundamentals AND at least one RECENT bullet tying a 90-day event back to that durable factor.
- Where possible, cite a SPECIFIC operating KPI (ARPU, take rate, NRR, churn, gross margin trajectory, attach rate, capacity utilisation, segment mix) rather than aggregate revenue or operating margin.
- Numbers are allowed only when they describe the BUSINESS (revenue, capex, units sold, customers, capacity, KPIs) — never when they describe the STOCK.
- Every bullet must end with a source tag in square brackets, e.g. [earnings call], [10-Q], [reporting].
- COMPETITIVE LANDSCAPE and WHAT TO WATCH are mandatory — never write NONE for these. If your initial search returns nothing, broaden the query.
- Never fabricate quotes, executives, customers, or product names you cannot verify.
- If a section's truthful content would only be price-action commentary, write NONE for that section.
- Remove numeric inline citation markers like [1][2] from the text (source-type tags like [earnings call] are kept).
- Each bullet 2-3 sentences. No BODY section, no preamble, no closing remarks.`;

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
              'You are a senior equity research analyst writing a BUSINESS brief — not a stock-market brief. Your job is to explain what is happening to the company AS A BUSINESS: its products, customers, competitive position, unit economics, regulatory environment, supply chain, leadership, and capital allocation. Anchor every section in durable business fundamentals — the moat, the unit economics, structural advantages — and layer recent developments on top to show how those fundamentals are advancing or being threatened. PRIMARY-SOURCE BIAS: prefer SEC filings (10-K, 10-Q, 8-K, S-1, proxy statements), earnings call transcripts, and company investor-relations releases over second-hand financial news. Treat third-party reporting as a tiebreaker, not a primary source. Always search for highlights from the company\'s most recent quarterly disclosure (10-Q or equivalent) and the latest earnings call transcript, and let those shape the brief. Do NOT write about stock price, share price moves, market cap changes, analyst ratings, price targets, upside/downside percentages, or who is bullish/bearish on the stock. If a source only discusses price action or ratings, ignore it. Tag every bullet with its source type at the end in square brackets: [earnings call], [10-K], [10-Q], [8-K], [IR release], [regulator], or [reporting]. Omit any section where you lack concrete sourced business information.',
          },
          { role: 'user', content: prompt },
        ],
        // Densified v2 prompt: 2-3 sentence bullets + DEBATES section.
        // 1000 was tight; 2000 leaves headroom without inviting padding.
        max_tokens: 2000,
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
