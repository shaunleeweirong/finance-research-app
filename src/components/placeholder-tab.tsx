import { Card } from '@/components/ui/card';

interface PlaceholderTabProps {
  tabName: string;
}

export function PlaceholderTab({ tabName }: PlaceholderTabProps) {
  return (
    <Card className="bg-surface border-border p-12 text-center">
      <div className="text-text-muted">
        <svg className="mx-auto h-12 w-12 mb-4 opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        <h3 className="text-lg font-medium text-text-secondary mb-2">Coming Soon</h3>
        <p className="text-sm">{tabName} will be available in a future update.</p>
      </div>
    </Card>
  );
}
