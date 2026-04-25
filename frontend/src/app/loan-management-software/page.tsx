import type { Metadata } from "next";
import Link from "next/link";
import { BrandLogo } from "@/components/branding/BrandLogo";
import { PublicNav } from "@/components/layout/PublicNav";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Loan Management Software — Built for Serious Lenders | DigiKhaato",
  description:
    "DigiKhaato loan management software helps CFOs and lending business owners track borrowers, EMIs, daily collections, and overdue alerts — all in one place.",
};

const features = [
  {
    icon: "👤",
    name: "Borrower Profiles",
    description:
      "Maintain complete borrower records — identity, contact, loan history — in one searchable profile. No more scattered files.",
  },
  {
    icon: "📋",
    name: "Loan Accounts",
    description:
      "Create structured loan accounts with principal, interest rate, tenure, and disbursement date. Every loan is an auditable record.",
  },
  {
    icon: "💰",
    name: "Daily Collections",
    description:
      "Record repayments as they come in. Your collection ledger updates in real time — no end-of-day reconciliation headaches.",
  },
  {
    icon: "📅",
    name: "EMI Tracking",
    description:
      "Auto-calculate EMI schedules and flag missed instalments instantly. You know exactly who owes what and since when.",
  },
  {
    icon: "🔔",
    name: "Overdue Alerts",
    description:
      "Get notified before defaults happen. Overdue alerts surface the highest-risk accounts so your team prioritises correctly.",
  },
  {
    icon: "👥",
    name: "Collector Team Management",
    description:
      "Assign borrowers to collectors, monitor individual performance, and review collections by agent — all from a single dashboard.",
  },
];

const steps = [
  {
    number: 1,
    title: "Add Borrowers",
    description:
      "Create a borrower profile in under a minute. Capture contact details, guarantor info, and KYC references — all in one place.",
  },
  {
    number: 2,
    title: "Create Loan Accounts",
    description:
      "Define the loan terms, interest, and repayment schedule. DigiKhaato auto-generates the amortisation timeline instantly.",
  },
  {
    number: 3,
    title: "Record Collections Daily",
    description:
      "Collectors log payments on the ground. Managers see live portfolio health. No spreadsheets. No delays. No guessing.",
  },
];

const audiences = [
  {
    role: "Small & Mid-size Lenders",
    benefit:
      "Replace your Excel sheets with a purpose-built system that scales with your portfolio without adding overhead.",
  },
  {
    role: "Microfinance Officers",
    benefit:
      "Manage hundreds of borrowers across geographies with zero paper — and instant visibility into every account.",
  },
  {
    role: "Collection Managers",
    benefit:
      "Know exactly which borrowers are overdue, which collectors are performing, and where your cash flow is at risk.",
  },
  {
    role: "CFOs & Finance Heads",
    benefit:
      "Get the portfolio-level view you need — outstanding principal, collection rates, overdue ratios — without chasing reports.",
  },
];

export default function LoanManagementSoftwarePage() {
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
              Loan Management Software
            </span>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-text leading-tight mb-5">
              Stop managing loans on paper.{" "}
              <span className="text-primary-500">Start managing a portfolio.</span>
            </h1>
            <p className="text-lg text-muted max-w-2xl mx-auto mb-8">
              Built for CFOs and lending business owners who need real-time visibility into every borrower, every
              collection, and every rupee owed — without drowning in spreadsheets.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/signup">
                <Button size="lg" fullWidth={false}>
                  Start Free Today
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
                Everything a serious lending operation needs
              </h2>
              <p className="text-muted max-w-xl mx-auto">
                Six core capabilities that give your lending business the operational backbone it deserves.
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
              <h2 className="text-2xl sm:text-3xl font-bold text-text mb-3">Up and running in minutes</h2>
              <p className="text-muted">No training manuals. No implementation consultants. Just log in and go.</p>
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
                Built for the people running the numbers
              </h2>
              <p className="text-muted">
                Whether you lend to 50 borrowers or 5,000 — DigiKhaato gives every role what they need.
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
              Your portfolio deserves better than a spreadsheet.
            </h2>
            <p className="text-muted mb-8">
              Join lending businesses that moved to DigiKhaato and finally got control of their collections.
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
