import type { Metadata } from "next";
import Link from "next/link";
import { DashboardPreview } from "@/components/branding/DashboardPreview";
import { FeatureGrid } from "@/components/home/FeatureGrid";
import { PublicNav } from "@/components/layout/PublicNav";
import { Button } from "@/components/ui/Button";
import { BrandLogo } from "@/components/branding/BrandLogo";

export const metadata: Metadata = {
  title: "DigiKhaato — Modular SaaS for Loans, Ledger, Notes & Vertical Apps",
  description: "DigiKhaato is a modular SaaS platform with included apps (UdhaarBook, Notes) and activation-based apps (Loans, Jewellery, more). Built on Django + Postgres with external integrations added in later phases.",
  keywords: ["loan management software", "customer ledger app", "daily collection app", "library seat management", "gym membership software", "udhar book app"],
  openGraph: {
    type: "website",
    siteName: "DigiKhaato",
    title: "DigiKhaato — Modular Business Operations Platform",
    description: "Included apps for everyone, advanced apps by workspace activation. One login, one system, no spreadsheet chaos.",
  },
};


export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-neutral-950">

      {/* ── Navbar with theme toggle ── */}
      <PublicNav />

      {/* ── Hero ── */}
      <section className="pt-10 pb-4 overflow-hidden">
        <div className="w-full px-6 sm:px-10 md:px-14 lg:px-20">
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12 min-h-[560px]">

            {/* Left: copy */}
            <div className="flex-1 min-w-0 lg:max-w-[46%] py-6">
              <div className="mb-5">
                <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
                  Modular SaaS for growing businesses
                </span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-5xl xl:text-6xl font-bold text-text leading-tight mb-5">
                Included apps for everyone.{" "}
                <span className="text-primary-500">Advanced apps when you need them.</span>
              </h1>
              <p className="text-base sm:text-lg text-muted mb-8 leading-relaxed">
                Run UdhaarBook and Notes from day one, then activate domain modules like Loans and Jewellery per workspace.
                Current stack is Django + Postgres first; external integrations are phased later.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 mb-5">
                <Link href="/signup">
                  <Button size="lg" fullWidth={false}>Start Free →</Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline" size="lg" fullWidth={false}>Already have an account</Button>
                </Link>
              </div>
              <p className="text-xs text-muted">
                Mobile-first onboarding, web-first operations, and feature activation controls built in.
              </p>

              {/* Social proof strip */}
              <div className="mt-8 flex flex-wrap gap-6">
                {[
                  { stat: "Included + Advanced", label: "Common apps included, advanced modules activatable" },
                  { stat: "One login", label: "All modules under a single workspace account" },
                  { stat: "Django + Postgres", label: "No external dependency required to start" },
                ].map(({ stat, label }) => (
                  <div key={stat} className="flex flex-col">
                    <span className="text-sm font-bold text-primary-500">{stat}</span>
                    <span className="text-xs text-muted">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: device previews */}
            <div className="flex-1 lg:max-w-[54%] w-full flex items-center justify-center lg:justify-end relative">
              <div className="relative w-full max-w-2xl">
                {/* Glow */}
                <div className="absolute inset-0 bg-primary-500/8 dark:bg-primary-500/12 blur-3xl rounded-3xl" />
                {/* Preview SVG */}
                <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-neutral-300/50 dark:shadow-neutral-900/60 border border-border/50">
                  <DashboardPreview className="w-full h-auto" />
                </div>
                {/* Floating badge */}
                <div className="absolute -bottom-3 left-6">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white dark:bg-neutral-900 border border-border shadow-sm text-muted">
                    <span className="w-2 h-2 rounded-full bg-success-500 inline-block" />{" "}
                    Works on mobile &amp; desktop
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Feature Grid ── */}
      <section className="py-16 bg-neutral-50 dark:bg-neutral-900/50">
        <div className="w-full px-6 sm:px-10 md:px-14 lg:px-20">

          <div className="mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-text mb-2">
              Everything your business needs
            </h2>
            <p className="text-sm text-muted max-w-lg">
              Start with core apps and activate add-ons as your operations expand.
            </p>
          </div>

          <FeatureGrid />

        </div>
      </section>

      {/* ── Trust strip ── */}
      <section className="py-12 border-y border-border">
        <div className="w-full px-6 sm:px-10 md:px-14 lg:px-20">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            {[
              { stat: "Modular Access", label: "Included modules are always available; advanced modules are controlled per workspace." },
              { stat: "Single Workspace", label: "Users switch apps without separate logins or disconnected tools." },
              { stat: "Phased Integrations", label: "Run now on Django + Postgres, add external connectors later." },
            ].map(({ stat, label }) => (
              <div key={stat} className="flex flex-col gap-2">
                <p className="text-xl font-bold text-primary-500">{stat}</p>
                <p className="text-xs text-muted leading-relaxed">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-16">
        <div className="w-full px-6 sm:px-10 md:px-14 lg:px-20 text-center">
          <h2 className="text-2xl font-bold text-text mb-3">Ready to take control?</h2>
          <p className="text-sm text-muted mb-6">
            Set up your workspace, use core apps immediately, and activate advanced modules when required.
          </p>
          <Link href="/signup">
            <Button size="lg" fullWidth={false}>Get Started Free →</Button>
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border py-8">
        <div className="w-full px-6 sm:px-10 md:px-14 lg:px-20 flex flex-col sm:flex-row items-center justify-between gap-4">
          <BrandLogo size="sm" href="/" />
          <nav className="flex flex-wrap justify-center gap-x-5 gap-y-1.5 text-xs text-muted">
            <Link href="/loan-management-software" className="hover:text-text transition-colors">Loan Management</Link>
            <Link href="/customer-ledger-app" className="hover:text-text transition-colors">Udhar Book</Link>
            <Link href="/reports-app" className="hover:text-text transition-colors">Reports</Link>
            <Link href="/notes-app" className="hover:text-text transition-colors">Notes</Link>
            <Link href="/library-seat-management-system" className="hover:text-text transition-colors">Library Seats</Link>
            <Link href="/gym-management-software" className="hover:text-text transition-colors">Gym Membership</Link>
          </nav>
          <p className="text-xs text-muted">© 2026 DigiKhaato</p>
        </div>
      </footer>

    </div>
  );
}
