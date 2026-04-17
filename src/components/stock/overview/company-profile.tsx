import { Card } from '@/components/ui/card';
import { formatNumber } from '@/lib/utils/format';
import type { FMPProfile } from '@/lib/fmp/types';

interface CompanyProfileProps {
  profile: FMPProfile;
}

export function CompanyProfile({ profile }: CompanyProfileProps) {
  const facts = [
    { label: 'CEO', value: profile.ceo || null, isLink: false },
    {
      label: 'Employees',
      value: profile.fullTimeEmployees ? formatNumber(Number(profile.fullTimeEmployees)) : null,
      isLink: false,
    },
    {
      label: 'Headquarters',
      value: [profile.city, profile.state].filter(Boolean).join(', ') || null,
      isLink: false,
    },
    { label: 'Website', value: profile.website || null, isLink: true },
    { label: 'IPO Date', value: profile.ipoDate || null, isLink: false },
  ].filter((f) => f.value);

  return (
    <Card className="bg-surface border-border p-5">
      {/* Description */}
      {profile.description && (
        <div className="mb-5">
          <h3 className="mb-2 text-sm font-medium text-text-muted">About</h3>
          <p className="text-sm leading-relaxed text-text-secondary line-clamp-4">
            {profile.description}
          </p>
        </div>
      )}

      {/* Key Facts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
        {facts.map((fact) => (
          <div key={fact.label}>
            <p className="text-xs text-text-muted">{fact.label}</p>
            {fact.isLink ? (
              <a
                href={fact.value as string}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline truncate block"
              >
                {(fact.value as string).replace(/^https?:\/\/(www\.)?/, '')}
              </a>
            ) : (
              <p className="text-sm text-foreground">{fact.value}</p>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
