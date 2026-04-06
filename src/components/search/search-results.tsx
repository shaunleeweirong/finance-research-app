import { Badge } from '@/components/ui/badge';
import type { FMPSearchResult } from '@/lib/fmp/types';

interface SearchResultsProps {
  results: FMPSearchResult[];
  selectedIndex: number;
  onSelect: (symbol: string) => void;
  query: string;
}

function highlightMatch(text: string, query: string) {
  if (!query) return text;
  const index = text.toLowerCase().indexOf(query.toLowerCase());
  if (index === -1) return text;
  return (
    <>
      {text.slice(0, index)}
      <span className="text-primary font-semibold">{text.slice(index, index + query.length)}</span>
      {text.slice(index + query.length)}
    </>
  );
}

export function SearchResults({ results, selectedIndex, onSelect, query }: SearchResultsProps) {
  return (
    <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-80 overflow-y-auto rounded-lg border border-border bg-surface shadow-xl">
      {results.map((result, index) => (
        <button
          key={`${result.symbol}-${result.stockExchange}`}
          type="button"
          className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-hover ${
            index === selectedIndex ? 'bg-surface-hover' : ''
          }`}
          onMouseDown={() => onSelect(result.symbol)}
        >
          <span className="font-mono font-bold text-foreground min-w-[60px]">
            {highlightMatch(result.symbol, query)}
          </span>
          <span className="flex-1 truncate text-sm text-text-secondary">
            {highlightMatch(result.name, query)}
          </span>
          <Badge variant="secondary" className="text-xs shrink-0">
            {result.exchangeShortName}
          </Badge>
        </button>
      ))}
    </div>
  );
}
