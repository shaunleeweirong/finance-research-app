'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { SearchResults } from './search-results';
import type { FMPSearchResult } from '@/lib/fmp/types';

// Simple search icon SVG inline to avoid dependency
function SearchIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

export function SearchBar({ size = 'default' }: { size?: 'default' | 'large' }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FMPSearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Debounced search
  useEffect(() => {
    if (query.length < 1) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/fmp/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data: FMPSearchResult[] = await res.json();
          setResults(data);
          setIsOpen(true);
        }
      } catch {
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Close on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const selectResult = useCallback((symbol: string) => {
    setIsOpen(false);
    setQuery('');
    router.push(`/stock/${symbol}`);
  }, [router]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!isOpen || results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      selectResult(results[selectedIndex].symbol);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  }

  const isLarge = size === 'large';

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <SearchIcon className={`absolute left-3 top-1/2 -translate-y-1/2 text-text-muted ${isLarge ? 'h-5 w-5' : 'h-4 w-4'}`} />
        <Input
          type="text"
          placeholder="Search companies or tickers..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedIndex(-1);
          }}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className={`${isLarge ? 'h-14 pl-11 text-lg' : 'h-10 pl-9 text-sm'} bg-surface border-border text-foreground placeholder:text-text-muted focus:border-primary focus:ring-1 focus:ring-primary`}
        />
        {isLoading && (
          <div className={`absolute right-3 top-1/2 -translate-y-1/2 ${isLarge ? 'h-5 w-5' : 'h-4 w-4'} animate-spin rounded-full border-2 border-text-muted border-t-primary`} />
        )}
      </div>
      {isOpen && results.length > 0 && (
        <SearchResults
          results={results}
          selectedIndex={selectedIndex}
          onSelect={selectResult}
          query={query}
        />
      )}
    </div>
  );
}
