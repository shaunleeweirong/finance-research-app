import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const CACHE_TTL_DAYS = 7;

// Simple in-memory rate limiter: max 10 generation requests per IP per minute
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
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

  // Rate limit before any expensive work
  const ip = _request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1';
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const forceRefresh = new URL(_request.url).searchParams.get('refresh') === 'true';
  const companyName = new URL(_request.url).searchParams.get('name') ?? ticker;

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
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const dateRange = `${monthAgo.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

    const prompt = `Write a structured stock research brief for ${companyName} (ticker: ${ticker}) covering ${dateRange}.

Search for recent analyst opinions, investment theses, news analysis, and commentary about this company — not just financial data or price history.

Use this EXACT format. Only include a section if you have concrete, sourced information. If a section would require speculation, omit it entirely by writing NONE after the header.

TITLE: [Short, compelling headline about the business narrative — max 12 words]

BULL CASE:
- [Explain WHY investors are optimistic — the narrative, thesis, or trend driving conviction, not just a number]
- [Another reason for optimism with context on why it matters]
- [Third bullish point if available]

BEAR CASE:
- [Explain WHY investors are worried — the concern, risk, or trend causing caution, not just a metric]
- [Another reason for caution with context on why it matters]
- [Third bearish point if available]

KEY DEVELOPMENTS:
- [Specific product launch, partnership, M&A, earnings result, or regulatory event with date]
- [Another concrete development]

MANAGEMENT SIGNALS:
- [Recent earnings call quote, guidance change, buyback announcement, or insider buy/sell]
- [Another management action if available]

COMPETITIVE LANDSCAPE:
- [How peers are performing, market share shift, or emerging competitive threat]

WHAT TO WATCH:
- [Upcoming earnings date, product launch, or regulatory decision with date]
- [Key business metric or threshold to monitor]

IMPORTANT — write every bullet as a NARRATIVE explaining WHY something matters, not as a data point.

BAD example (do NOT write like this):
- "Q1 revenue was $173B, up 14% YoY"
- "EPS of $1.95 missed estimates of $1.98"
- "Operating income projected at $16.5-21.5 billion"

GOOD example (write like this):
- "Amazon's custom AI chip business is rapidly gaining enterprise adoption, potentially reducing dependence on Nvidia and improving cloud margins long-term"
- "Investors worry that rising capex on AI infrastructure could compress margins before revenue catches up, echoing concerns from prior AWS buildout cycles"

Rules:
- Every bullet must explain a perspective, thesis, or narrative — not just state a number
- Do NOT simply restate financial metrics — explain why they matter and what they signal
- Never fabricate quotes, analyst names, or price targets you cannot verify
- If you have no sourced information for a section, write NONE (do not speculate)
- Remove inline citation markers like [1][2] from the text
- Keep each bullet to 1-2 sentences max
- Do not include a BODY section`;

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
              'You are a senior equity research analyst writing investment briefs. Your job is to explain the narrative and thesis around a stock — why investors are bullish or bearish, what trends matter, and what to watch. Do NOT just restate financial numbers. Explain what they mean and why they matter. Search for analyst commentary, opinion pieces, and investment analysis — not just earnings data. Omit sections where you lack concrete information. Never include inline citation markers like [1] or [2].',
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
