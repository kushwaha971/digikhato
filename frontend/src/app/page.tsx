import Link from "next/link";
import { BrandLogo } from "@/components/branding/BrandLogo";
import { Button } from "@/components/ui/Button";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-neutral-950/90 backdrop-blur-md border-b border-neutral-100 dark:border-neutral-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <BrandLogo size="md" href="/" />
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm" fullWidth={false}>Sign in</Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" fullWidth={false}>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="text-center max-w-2xl mx-auto">
          {/* Pill badge */}
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-50 text-primary-500 text-xs font-semibold mb-6 dark:bg-primary-900/30 dark:text-primary-400">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse" />
            Built for field collection teams
          </span>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-neutral-900 dark:text-white leading-tight mb-5">
            Manage daily loans <span className="text-primary-500">effortlessly</span>
          </h1>

          <p className="text-lg text-neutral-500 dark:text-neutral-400 mb-10 max-w-xl mx-auto leading-relaxed">
            Track borrowers, accounts, and daily collections in one place.
            Built for admins, collectors, and borrowers alike.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/signup">
              <Button size="lg" fullWidth={false}>Start for Free</Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" fullWidth={false}>Sign In</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Feature grid */}
      <section className="px-4 pb-20">
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: "👥", title: "Borrower Management", desc: "Add borrowers and track multiple loan accounts per person." },
            { icon: "💰", title: "Daily Collections", desc: "Record daily payments with just an amount and date — nothing more." },
            { icon: "📊", title: "Smart Reports", desc: "Daily, account, and overdue reports with clear summaries." },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="app-panel p-5 text-center">
              <div className="text-3xl mb-3">{icon}</div>
              <h3 className="font-semibold text-neutral-900 dark:text-white mb-1 text-sm">{title}</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-100 dark:border-neutral-800 py-6 px-4 text-center">
        <p className="text-xs text-neutral-400">© 2026 DailyBook. All rights reserved.</p>
      </footer>
    </div>
  );
}
