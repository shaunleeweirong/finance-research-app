import { SearchBar } from '@/components/search/search-bar';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-2xl space-y-8 text-center">
        <div className="space-y-3">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            FinanceResearch
          </h1>
          <p className="text-lg text-text-secondary">
            Research any public company with interactive financial data and analysis
          </p>
        </div>
        <SearchBar size="large" />
      </div>
    </main>
  );
}
