'use client';

import { X } from 'lucide-react';
import type { RefObject } from 'react';

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

interface MetricSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  inputRef: RefObject<HTMLInputElement | null>;
  totalCount: number;
  filteredCount: number;
  isSearchActive: boolean;
}

export function MetricSearchBar({
  value,
  onChange,
  inputRef,
  totalCount,
  filteredCount,
  isSearchActive,
}: MetricSearchBarProps) {
  return (
    <div className="relative">
      <SearchIcon className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search across all financial metrics… (⌘F)"
        className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-20 text-sm text-foreground placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
      />
      {isSearchActive && (
        <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-2">
          <span className="text-xs text-text-muted">
            {filteredCount} of {totalCount}
          </span>
          <button
            onClick={() => onChange('')}
            className="rounded p-0.5 text-text-muted hover:bg-surface-hover hover:text-foreground transition-colors"
            title="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
