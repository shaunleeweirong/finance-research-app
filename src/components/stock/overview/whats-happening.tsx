'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import {
  Sparkles,
  RefreshCw,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  Newspaper,
  Megaphone,
  Swords,
  Eye,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface Citation {
  url: string;
  title?: string;
}

interface SummaryData {
  title: string;
  dateRange: string;
  bullCase: string[];
  bearCase: string[];
  keyDevelopments: string[];
  managementSignals: string[];
  competitiveLandscape: string[];
  whatToWatch: string[];
  citations: Citation[];
  generatedAt: string;
  cached: boolean;
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url;
  }
}

function Section({
  icon: Icon,
  label,
  items,
  color,
}: {
  icon: LucideIcon;
  label: string;
  items: string[];
  color: string;
}) {
  if (!items.length) return null;
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-1.5">
        <Icon className={`h-3.5 w-3.5 ${color}`} />
        <span className="text-xs font-semibold text-text">{label}</span>
      </div>
      <ul className="space-y-1 pl-5">
        {items.map((item, i) => (
          <li key={i} className="text-sm leading-relaxed text-text-muted list-disc">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function WhatsHappening({ ticker }: { ticker: string }) {
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  async function fetchSummary(refresh = false) {
    setLoading(true);
    setError(false);
    try {
      const url = `/api/stock/summary/${encodeURIComponent(ticker)}${refresh ? '?refresh=true' : ''}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch');
      const json: SummaryData = await res.json();
      setData(json);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticker]);

  if (error) return null;

  return (
    <Card className="p-5">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-500" />
          <span className="text-sm font-semibold text-text">What&apos;s Happening</span>
        </div>
        {!loading && data && (
          <button
            onClick={() => fetchSummary(true)}
            className="inline-flex items-center gap-1 text-xs text-text-muted/60 transition-colors hover:text-primary"
          >
            <RefreshCw className="h-3 w-3" />
            Refresh
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          <div className="h-5 w-3/4 animate-pulse rounded bg-border" />
          <div className="h-3 w-48 animate-pulse rounded bg-border" />
          <div className="mt-3 space-y-2">
            <div className="h-3 w-11/12 animate-pulse rounded bg-border" />
            <div className="h-3 w-10/12 animate-pulse rounded bg-border" />
            <div className="h-3 w-9/12 animate-pulse rounded bg-border" />
          </div>
          <div className="mt-4 space-y-2">
            <div className="h-3 w-full animate-pulse rounded bg-border" />
            <div className="h-3 w-full animate-pulse rounded bg-border" />
            <div className="h-3 w-11/12 animate-pulse rounded bg-border" />
          </div>
        </div>
      ) : data ? (
        <div>
          {data.title && (
            <h4 className="text-base font-semibold leading-snug text-text">
              {data.title}
            </h4>
          )}
          {data.dateRange && (
            <p className="mt-1 text-xs text-text-muted/60">{data.dateRange}</p>
          )}

          <div className="mt-4 space-y-4">
            <Section icon={TrendingUp} label="Bull Case" items={data.bullCase} color="text-emerald-500" />
            <Section icon={TrendingDown} label="Bear Case" items={data.bearCase} color="text-red-500" />
            <Section icon={Newspaper} label="Key Developments" items={data.keyDevelopments} color="text-blue-500" />
            <Section icon={Megaphone} label="Management Signals" items={data.managementSignals} color="text-violet-500" />
            <Section icon={Swords} label="Competitive Landscape" items={data.competitiveLandscape} color="text-orange-500" />
            <Section icon={Eye} label="What to Watch" items={data.whatToWatch} color="text-amber-500" />
          </div>

          {/* Citations */}
          {data.citations.length > 0 && (
            <div className="mt-4 border-t border-border pt-3">
              <p className="mb-2 text-xs font-medium text-text-muted">Sources</p>
              <div className="flex flex-wrap gap-2">
                {data.citations.slice(0, 5).map((c, i) => (
                  <a
                    key={i}
                    href={c.url.startsWith('https://') || c.url.startsWith('http://') ? c.url : '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-2.5 py-1 text-xs text-text-muted transition-colors hover:border-primary hover:text-primary"
                  >
                    {c.title || getDomain(c.url)}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ))}
              </div>
            </div>
          )}

          <p className="mt-3 text-[11px] text-text-muted/60">
            AI-generated summary · may contain inaccuracies
          </p>
        </div>
      ) : null}
    </Card>
  );
}
