import Image from 'next/image';
import { Card } from '@/components/ui/card';
import type { FMPStockNews } from '@/lib/fmp/types';

interface NewsTabProps {
  news: FMPStockNews[];
}

function timeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function NewsTab({ news }: NewsTabProps) {
  if (news.length === 0) {
    return (
      <Card className="bg-surface border-border p-12 text-center">
        <p className="text-text-muted">No news available for this company.</p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {news.map((item, index) => (
        <a
          key={`${item.url}-${index}`}
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group"
        >
          <Card className="bg-surface border-border overflow-hidden transition-colors hover:border-primary/50 h-full flex flex-col">
            {/* Image */}
            {item.image && (
              <div className="relative h-40 w-full overflow-hidden bg-background">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  unoptimized
                />
              </div>
            )}

            {/* Content */}
            <div className="flex flex-1 flex-col p-4">
              <h3 className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                {item.title}
              </h3>
              <div className="mt-auto pt-3 flex items-center justify-between text-xs text-text-muted">
                <span>{item.site}</span>
                <span>{timeAgo(item.publishedDate)}</span>
              </div>
            </div>
          </Card>
        </a>
      ))}
    </div>
  );
}
