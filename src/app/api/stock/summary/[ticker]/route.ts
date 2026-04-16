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
  highlights: string[];
  body: string;
}

function parseStructuredSummary(raw: string, dateRange: string): ParsedSummary {
  // Extract title
  const titleMatch = raw.match(/TITLE:\s*(.+?)(?:\n|$)/);
  const title = titleMatch?.[1]?.replace(/^["']|["']$/g, '').trim() ?? '';

  // Extract highlights (bullet lines between HIGHLIGHTS: and BODY:)
  const highlightsMatch = raw.match(/HIGHLIGHTS:\s*\n([\s\S]*?)(?:\nBODY:|\n\n[A-Z])/);
  const highlights = highlightsMatch?.[1]
    ?.split('\n')
    .map((line) => line.replace(/^[-•*]\s*/, '').trim())
    .filter((line) => line.length > 0) ?? [];

  // Extract body (everything after BODY:)
  const bodyMatch = raw.match(/BODY:\s*\n([\s\S]*)/);
  let body = bodyMatch?.[1]?.trim() ?? '';

  // Fallback: if parsing failed, use the entire content
  if (!title && !body) {
    return {
      title: '',
      dateRange,
      highlights: [],
      body: raw.trim(),
    };
  }

  // Clean up markdown artifacts (bold markers, etc.)
  body = body.replace(/\*\*/g, '');

  return { title, dateRange, highlights, body };
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
      // Parse stored JSON summary back into structured fields
      let parsed: ParsedSummary;
      try {
        parsed = JSON.parse(cached.summary);
      } catch {
        // Legacy plain-text format — wrap in body
        parsed = { title: '', dateRange: '', highlights: [], body: cached.summary };
      }
      return NextResponse.json({
        ...parsed,
        citations: cached.citations ?? [],
        generatedAt: cached.generated_at,
        cached: true,
      });
    }

    // No valid cache — generate via Perplexity Sonar
    if (!PERPLEXITY_API_KEY) {
      return NextResponse.json(
        { error: 'AI summary service not configured' },
        { status: 503 },
      );
    }

    const today = new Date();
    const weekAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const dateRange = `${weekAgo.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

    const prompt = `Write a structured stock analysis for ${ticker} covering the period ${dateRange}. Use this EXACT format:

TITLE: [One compelling headline summarizing the key narrative, e.g. "Apple Inc Rallies on Strong Earnings Amid Tariff Concerns"]

HIGHLIGHTS:
- [Key takeaway about stock price or performance]
- [Key takeaway about major news or catalyst]
- [Key takeaway about outlook or strategic development]

BODY:
[4-5 well-structured paragraphs covering:
1. Overall stock performance with specific percentage moves and comparison to S&P 500 and relevant sector ETF
2. Major news events, catalysts, or earnings driving price action
3. Analyst sentiment, upgrades/downgrades, or institutional activity
4. Regulatory, legal, or macro risks affecting the company
5. Forward-looking outlook including upcoming events or strategic initiatives]

Rules:
- Include specific numbers: percentage moves, price levels, market cap changes
- Compare performance to S&P 500 and the relevant sector ETF
- Write in professional, factual investor tone
- Paragraphs should flow as narrative prose, not bullet points
- Start the body directly with the company name`;

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
              'You are a senior equity research analyst. Write structured stock summaries following the exact format requested. Be precise with data, include specific percentages and comparisons. Always cite sources.',
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

    // Parse structured output into title, highlights, body
    const parsed = parseStructuredSummary(rawContent, dateRange);

    // Store as JSON in the summary column
    const summaryJson = JSON.stringify(parsed);

    // Upsert into cache (insert or update if ticker already exists with stale data)
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
