import { Suspense } from 'react';

export default function StockLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Suspense fallback={<div className="h-32 animate-pulse bg-surface rounded-lg mt-6" />}>
          {children}
        </Suspense>
      </div>
    </div>
  );
}
