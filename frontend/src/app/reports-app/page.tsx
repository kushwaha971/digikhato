import type { Metadata } from "next";
import Link from "next/link";
import { BrandLogo } from "@/components/branding/BrandLogo";
import { PublicNav } from "@/components/layout/PublicNav";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Reports & Analytics | Daily Collection Reports | DigiKhaato",
  description:
    "DigiKhaato reports give CFOs, operations leads, and lending managers real-time visibility into collections, overdue accounts, team performance, and portfolio health.",
};

const features = [
  {
    icon: "📅",
    name: "Daily Collection Reports",
    description:
      "See exactly how much was collected today, by which collector, across which borrowers. Crisp, complete, and available the moment the day closes.",
  },
  {
    icon: "⚠️",
    name: "Overdue Summaries",
    description:
      "Surface every overdue account — days past due, amount outstanding, assigned collector. Your escalation list, generated automatically.",
  },
  {
    icon: "🏦",
    name: "Loan Portfolio Overview",
    description:
      "Total principal disbursed, outstanding balance, collection rate, and overdue ratio — your full portfolio picture in a single view.",
  },
  {
    icon: "👥",
    name: "Team Performance",
    description:
      "Compare collectors by collections made, amounts recovered, and overdue follow-ups. Identify your top performers — and the gaps.",
  },
  {
    icon: "💳",
    name: "Payment Mode Breakdown",
    description:
      "See collections split by cash, UPI, bank transfer, and other modes. Understand how your customers actually pay and plan accordingly.",
  },
  {
    icon: "📤",
    name: "Export to PDF/Excel",
    description:
      "Download any report for board reviews, audits, or investor updates. PDF and Excel export coming — designed for the formats that matter.",
  },
];

const steps = [
  {
    number: 1,
    title: "Transactions Auto-Log",
    description:
      "Every payment recorded by every collector flows directly into your reporting layer. Nothing manual. Nothing lost. No reconciliation needed.",
  },
  {
    number: 2,
    title: "Reports Generate Instantly",
    description:
      "Open the reports section and your data is already there — current, accurate, and broken down exactly the way you need it.",
  },
  {
    number: 3,
    title: "Make Decisions Fast",
    description:
      "Act on overdue lists, redirect collectors, and review portfolio health — in minutes, not days. The lag between data and decision is gone.",
  },
];

const audiences = [
  {
    role: "CFOs",
    benefit:
      "Portfolio health, overdue ratios, and daily collection totals — exactly what you need for board reviews, risk reviews, and cash flow calls.",
  },
  {
    role: "Operations Leads",
    benefit:
      "Monitor team performance, flag overdue spikes, and reallocate collector resources based on live data — not end-of-week reports.",
  },
  {
    role: "Lending Managers",
    benefit:
      "Track daily collection targets, identify at-risk accounts early, and escalate overdue cases before they become write-offs.",
  },
  {
    role: "Finance & Audit Teams",
    benefit:
      "Access clean, timestamped transaction records across the full portfolio — audit-ready and exportable on demand.",
  },
];

export default function ReportsAppPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-neutral-950">
      {/* Navbar */}
      <PublicNav />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative py-20 sm:py-28 px-4 text-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-white dark:from-primary-950/20 dark:via-neutral-950 dark:to-neutral-950 pointer-events-none" />
          <div className="relative max-w-3xl mx-auto">
            <span className="inline-block mb-4 px-3 py-1 rounded-full text-xs font-semibold bg-primary-50 text-primary-500 border border-primary-500/20">
              Reports & Analytics
            </span>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-text leading-tight mb-5">
              Decisions without data are guesses.{" "}
              <span className="text-primary-500">Stop guessing.</span>
            </h1>
            <p className="text-lg text-muted max-w-2xl mx-auto mb-8">
              Built for CFOs, operations leads, and lending managers who need daily collection reports, overdue
              summaries, and portfolio performance — without waiting for someone to build a spreadsheet.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/signup">
                <Button size="lg" fullWidth={false}>
                  Get Started Free
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="lg" fullWidth={false}>
                  See a Demo
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Key Capabilities */}
        <section className="py-16 sm:py-20 px-4 bg-surface">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-text mb-3">
                The visibility your business runs on
              </h2>
              <p className="text-muted max-w-xl mx-auto">
                Six report types that give every decision-maker in your organisation the data they actually need.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {features.map((f) => (
                <div
                  key={f.name}
                  className="app-panel rounded-xl p-6 flex flex-col gap-3 hover:shadow-md transition-shadow"
                >
                  <div className="w-11 h-11 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center text-2xl">
                    {f.icon}
                  </div>
                  <h3 className="font-semibold text-text text-base">{f.name}</h3>
                  <p className="text-sm text-muted leading-relaxed">{f.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16 sm:py-20 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-text mb-3">
                Zero lag between data and insight
              </h2>
              <p className="text-muted">
                No exports to request. No analyst to wait for. Open DigiKhaato and your reports are live.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-8 sm:gap-0 relative">
              <div className="hidden sm:block absolute top-8 left-[calc(16.67%+1.5rem)] right-[calc(16.67%+1.5rem)] h-0.5 bg-border z-0" />
              {steps.map((step) => (
                <div key={step.number} className="flex-1 flex flex-col items-center text-center px-4 relative z-10">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-xl font-bold mb-4 shadow-lg">
                    {step.number}
                  </div>
                  <h3 className="font-bold text-text mb-2">{step.title}</h3>
                  <p className="text-sm text-muted leading-relaxed">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Who It's For */}
        <section className="py-16 sm:py-20 px-4 bg-surface">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-text mb-3">
                For every role that runs on numbers
              </h2>
              <p className="text-muted">
                DigiKhaato reports are built for the people who make consequential decisions — not just for dashboards.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {audiences.map((a) => (
                <div key={a.role} className="app-panel rounded-xl p-5 flex gap-4 items-start">
                  <div className="mt-1.5 w-2.5 h-2.5 rounded-full bg-primary-500 shrink-0" />
                  <div>
                    <p className="font-semibold text-text text-sm mb-1">{a.role}</p>
                    <p className="text-sm text-muted leading-relaxed">{a.benefit}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-text mb-4">
              The data was always there. Now it works for you.
            </h2>
            <p className="text-muted mb-8">
              DigiKhaato reports are live, accurate, and ready the moment you open the app. No build time. No waiting.
              Just answers.
            </p>
            <Link href="/signup">
              <Button size="lg" fullWidth={false}>
                Get Started Free — No Credit Card
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <BrandLogo size="sm" href="/" />
          <nav className="flex flex-wrap justify-center gap-x-5 gap-y-1.5 text-xs text-muted">
            <Link href="/loan-management-software" className="hover:text-text transition-colors">
              Loan Management
            </Link>
            <Link href="/customer-ledger-app" className="hover:text-text transition-colors">
              Customer Ledger
            </Link>
            <Link href="/reports-app" className="hover:text-text transition-colors">
              Reports
            </Link>
            <Link href="/notes-app" className="hover:text-text transition-colors">
              Notes
            </Link>
            <Link href="/library-seat-management-system" className="hover:text-text transition-colors">
              Library Seats
            </Link>
            <Link href="/gym-management-software" className="hover:text-text transition-colors">
              Gym Membership
            </Link>
          </nav>
          <p className="text-xs text-muted">© 2026 DigiKhaato</p>
        </div>
      </footer>
    </div>
  );
}
