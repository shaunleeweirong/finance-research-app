'use client';

import { SignInButton, SignUpButton, UserButton, useUser } from '@clerk/nextjs';
import Link from 'next/link';

export function AuthHeader() {
  const { isSignedIn, isLoaded } = useUser();

  if (!isLoaded) {
    return <div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-surface" />;
  }

  if (isSignedIn) {
    return (
      <div className="flex shrink-0 items-center gap-4">
        <Link
          href="/billing"
          className="hidden text-sm text-text-secondary hover:text-foreground transition-colors sm:block"
        >
          Billing
        </Link>
        <UserButton
          appearance={{
            elements: {
              avatarBox: 'w-8 h-8',
            },
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex shrink-0 items-center gap-2 sm:gap-3">
      <Link
        href="/pricing"
        className="text-sm text-text-secondary hover:text-foreground transition-colors whitespace-nowrap"
      >
        Pricing
      </Link>
      <SignInButton mode="modal">
        <button className="rounded-md px-3 py-1.5 text-sm text-text-secondary hover:text-foreground transition-colors">
          Sign in
        </button>
      </SignInButton>
      <SignUpButton mode="modal">
        <button className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-500 transition-colors sm:px-4">
          Sign up
        </button>
      </SignUpButton>
    </div>
  );
}
