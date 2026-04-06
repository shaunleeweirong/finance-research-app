import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <h2 className="text-3xl font-bold text-foreground mb-2">404</h2>
      <p className="text-text-secondary mb-6">Page not found</p>
      <Link
        href="/"
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-accent-hover transition-colors"
      >
        Go Home
      </Link>
    </div>
  );
}
