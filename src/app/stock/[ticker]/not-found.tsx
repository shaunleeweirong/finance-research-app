import { SearchBar } from '@/components/search/search-bar';

export default function StockNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h2 className="text-2xl font-bold text-foreground mb-2">Company Not Found</h2>
      <p className="text-text-secondary mb-8">
        The ticker you searched for doesn&apos;t exist or isn&apos;t available.
      </p>
      <div className="w-full max-w-md">
        <SearchBar />
      </div>
    </div>
  );
}
