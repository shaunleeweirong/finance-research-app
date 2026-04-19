import Link from 'next/link';
import { SearchBar } from '@/components/search/search-bar';
import { UserMenu } from '@/components/auth/user-menu';
import { MarketingLogo } from '@/components/marketing/logo';

type Props = {
  showSearch?: boolean;
};

export function AppNav({ showSearch = true }: Props) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2.5"
          aria-label="Moatscape home"
        >
          <MarketingLogo size={22} />
          <span className="hidden sm:inline text-[15px] font-bold tracking-tight text-foreground">
            moatscape
          </span>
        </Link>

        {showSearch && (
          <div className="min-w-0 flex-1 max-w-xl">
            <SearchBar />
          </div>
        )}

        <div className="ml-auto shrink-0">
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
