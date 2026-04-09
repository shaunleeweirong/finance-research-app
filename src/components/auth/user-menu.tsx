'use client';

import { UserButton } from '@clerk/nextjs';
import { CreditCard } from 'lucide-react';

export function UserMenu() {
  return (
    <UserButton>
      <UserButton.MenuItems>
        <UserButton.Link
          label="Billing"
          labelIcon={<CreditCard className="h-4 w-4" />}
          href="/billing"
        />
      </UserButton.MenuItems>
    </UserButton>
  );
}
