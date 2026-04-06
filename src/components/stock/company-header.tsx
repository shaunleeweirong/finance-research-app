import Image from 'next/image';
import { formatCurrency, formatPercent, formatLargeNumber } from '@/lib/utils/format';
import type { FMPProfile, FMPQuote } from '@/lib/fmp/types';

interface CompanyHeaderProps {
  profile: FMPProfile;
  quote: FMPQuote;
}

export function CompanyHeader({ profile, quote }: CompanyHeaderProps) {
  const isPositive = (quote.change ?? 0) >= 0;

  return (
    <div className="py-6">
      <div className="flex items-start gap-4">
        {/* Company Logo */}
        {profile.image && !profile.defaultImage ? (
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-surface">
            <Image
              src={profile.image}
              alt={`${profile.companyName} logo`}
              fill
              className="object-contain p-1"
              sizes="48px"
            />
          </div>
        ) : (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-surface text-lg font-bold text-text-secondary">
            {profile.symbol?.charAt(0) ?? '?'}
          </div>
        )}

        {/* Company Info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h1 className="text-2xl font-bold text-foreground">{profile.symbol}</h1>
            <span className="text-lg text-text-secondary truncate">{profile.companyName}</span>
          </div>

          {/* Price */}
          <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="font-mono text-2xl font-semibold text-foreground">
              {formatCurrency(quote.price)}
            </span>
            <span className={`font-mono text-sm font-medium ${isPositive ? 'text-positive' : 'text-negative'}`}>
              {isPositive ? '+' : ''}{formatCurrency(quote.change, 2)}
            </span>
            <span className={`font-mono text-sm font-medium ${isPositive ? 'text-positive' : 'text-negative'}`}>
              ({formatPercent(quote.changesPercentage, 2)})
            </span>
          </div>

          {/* Meta info line */}
          <div className="mt-2 flex flex-wrap items-center gap-x-2 text-sm text-text-muted">
            <span>{profile.exchangeShortName ?? profile.exchange}</span>
            <span className="text-border">·</span>
            <span>{profile.sector}</span>
            <span className="text-border">·</span>
            <span>{profile.industry}</span>
            <span className="text-border">·</span>
            <span>MCap {formatLargeNumber(profile.mktCap)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
