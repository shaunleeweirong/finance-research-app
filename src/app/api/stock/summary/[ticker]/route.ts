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

  // Fallback: if no sections parsed, extract bullet lines from raw
  if (!bullCase.length && !bearCase.length && !keyDevelopments.length) {
    const lines = raw
      .split('\n')
      .map((l) => l.replace(/^[-•*]\s*/, '').replace(/\*\*/g, '').replace(/\[\d+\]/g, '').trim())
      .filter((l) => l.length > 20);
    return {
      title: title || 'Stock Summary',
      dateRange,
      bullCase: lines.slice(0, 2),
      bearCase: lines.slice(2, 4),
      keyDevelopments: lines.slice(4, 6),
      managementSignals: [],
      competitiveLandscape: [],
      whatToWatch: [],
    };
  }

  return { title, dateRange, bullCase, bearCase, keyDevelopments, managementSignals, competitiveLandscape, whatToWatch };
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

  try {
    const supabase = await createServiceClient();

    // Check cache — return if summary exists and is less than 7 days old
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

    const prompt = `Write a structured stock research brief for ${ticker} covering ${dateRange}.

Use this EXACT format. Only include a section if you have concrete, sourced information. If a section would require speculation, omit it entirely by writing NONE after the header.

TITLE: [Short, compelling headline — max 12 words]

BULL CASE:
- [Why optimists are buying — specific growth driver, catalyst, or positive data point]
- [Another concrete bullish factor with numbers]
- [Third bullish point if available]

BEAR CASE:
- [Why skeptics are cautious — specific risk, overvaluation concern, or negative data]
- [Another concrete bearish factor with numbers]
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
- [Upcoming earnings date with consensus EPS estimate]
- [Specific catalyst event with date]
- [Key metric or threshold to monitor]

Rules:
- Each bullet must contain a specific fact, number, or date — no vague statements
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
              'You are a senior equity research analyst writing concise stock briefs. Every claim must be backed by data from your search results. Omit sections where you lack concrete information rather than speculating. Never include inline citation markers like [1] or [2] in your output text.',
          },
          { role: 'user', content: prompt },
        ],
        max_tokens: 800,
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
