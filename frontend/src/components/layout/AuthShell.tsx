import { PropsWithChildren } from "react";

import { BrandLogo } from "@/components/branding/BrandLogo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

type Props = PropsWithChildren<{
  title: string;
  subtitle: string;
  kicker?: string;
  highlights?: string[];
}>;

const defaultHighlights = [
  "Fast borrower onboarding and collection workflows",
  "Role-aware views for admin and collector teams",
  "Responsive interface from phone to desktop",
];

export function AuthShell({ title, subtitle, kicker = "Secure Access", highlights = defaultHighlights, children }: Props) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-neutral-50 dark:bg-neutral-950 px-4 py-5 sm:px-8 sm:py-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(224,48,96,0.08),transparent_35%),radial-gradient(circle_at_80%_15%,rgba(224,48,96,0.06),transparent_30%),radial-gradient(circle_at_50%_100%,rgba(224,48,96,0.05),transparent_35%)]" />
      <div className="relative mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-6xl flex-col">
        <header className="flex items-center justify-between py-2">
          <BrandLogo compact href="/" />
          <ThemeToggle />
        </header>

        <div className="grid flex-1 items-stretch gap-4 py-4 lg:grid-cols-[1.08fr_0.92fr] lg:gap-8">
          <section className="gradient-panel flex flex-col justify-between p-6 sm:p-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/85 sm:text-sm">{kicker}</p>
              <h1 className="mt-3 max-w-xl text-2xl font-bold tracking-tight text-white sm:text-4xl">{title}</h1>
              <p className="mt-3 max-w-xl text-sm text-white/90 sm:text-base">{subtitle}</p>
            </div>

            <div className="mt-8 grid gap-2 sm:grid-cols-2">
              {highlights.map((item) => (
                <div key={item} className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white/95 backdrop-blur-sm">
                  {item}
                </div>
              ))}
            </div>
          </section>

          <section className="app-panel flex flex-col justify-center p-5 sm:p-8">
            <BrandLogo showTagline className="mb-6" />
            {children}
          </section>
        </div>
      </div>
    </main>
  );
}
