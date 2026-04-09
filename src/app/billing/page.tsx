import { Suspense } from 'react';
import { BillingContent } from './billing-content';

export default function BillingPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-background px-4 py-8">
        <div className="mx-auto max-w-2xl">
          <div className="h-96 animate-pulse rounded-lg bg-surface" />
        </div>
      </main>
    }>
      <BillingContent />
    </Suspense>
  );
}
