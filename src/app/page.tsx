import { auth } from '@clerk/nextjs/server';
import { SearchBar } from '@/components/search/search-bar';
import Link from 'next/link';
import { SignInButton, SignUpButton } from '@clerk/nextjs';
import { BarChart3, LineChart, Shield, Zap } from 'lucide-react';
import { UserMenu } from '@/components/auth/user-menu';

export default async function HomePage() {
  const { userId } = await auth();

  // Signed-in users see the search experience
  if (userId) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-4">
        <div className="absolute top-4 right-6">
          <UserMenu />
        </div>
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

  // Visitors see the landing page
  return (
    <main className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <span className="text-lg font-bold text-foreground">FinanceResearch</span>
        <div className="flex items-center gap-3">
          <Link href="/pricing" className="text-sm text-text-secondary hover:text-foreground transition-colors">
            Pricing
          </Link>
          <SignInButton mode="modal">
            <button className="rounded-md px-3 py-1.5 text-sm text-text-secondary hover:text-foreground transition-colors">
              Sign in
            </button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-500 transition-colors">
              Sign up free
            </button>
          </SignUpButton>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center px-4 pt-24 pb-20 text-center">
        <div className="max-w-3xl space-y-6">
          <h1 className="text-5xl font-bold tracking-tight text-foreground sm:text-6xl">
            Research stocks like a
            <span className="text-blue-500"> professional</span>
          </h1>
          <p className="mx-auto max-w-xl text-lg text-text-secondary">
            Interactive financial data, 40 years of history, analyst estimates, ownership data, and more — all in one platform.
          </p>
          <div className="flex items-center justify-center gap-4 pt-4">
            <SignUpButton mode="modal">
              <button className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-500 transition-colors">
                Get started free
              </button>
            </SignUpButton>
            <Link
              href="/pricing"
              className="rounded-lg border border-border px-6 py-3 text-sm font-medium text-foreground hover:bg-surface transition-colors"
            >
              View pricing
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 py-16 max-w-5xl mx-auto">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: BarChart3, title: '40Y Financials', desc: 'Income statements, balance sheets, cash flow, and ratios spanning decades' },
            { icon: LineChart, title: 'Interactive Charts', desc: 'Visualize any metric with multi-series charts and flexible time ranges' },
            { icon: Zap, title: 'Analyst Estimates', desc: 'Revenue, EPS, and EBITDA consensus forecasts with price targets' },
            { icon: Shield, title: 'Ownership Data', desc: 'Institutional holders, insider trading activity, and ownership trends' },
          ].map((feature) => (
            <div key={feature.title} className="rounded-xl border border-border bg-surface p-6">
              <feature.icon className="mb-3 h-8 w-8 text-blue-500" />
              <h3 className="mb-1 font-semibold text-foreground">{feature.title}</h3>
              <p className="text-sm text-text-secondary">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-20 text-center">
        <h2 className="mb-4 text-3xl font-bold text-foreground">Ready to start researching?</h2>
        <p className="mb-8 text-text-secondary">Create a free account and search any public company.</p>
        <SignUpButton mode="modal">
          <button className="rounded-lg bg-blue-600 px-8 py-3 text-sm font-medium text-white hover:bg-blue-500 transition-colors">
            Sign up free
          </button>
        </SignUpButton>
      </section>
    </main>
  );
}
