'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <h2 className="text-2xl font-bold text-foreground mb-2">Something went wrong</h2>
      <p className="text-text-secondary mb-6">An unexpected error occurred.</p>
      <button
        onClick={reset}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-accent-hover transition-colors"
      >
        Try Again
      </button>
    </div>
  );
}
