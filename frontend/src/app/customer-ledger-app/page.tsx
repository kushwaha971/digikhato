import type { Metadata } from "next";
import Link from "next/link";
import { BrandLogo } from "@/components/branding/BrandLogo";
import { PublicNav } from "@/components/layout/PublicNav";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Customer Ledger App — Track Every Credit and Payment | DigiKhaato",
  description:
    "DigiKhaato's customer ledger app helps shop owners, traders, and B2B operators track credit given, payments received, and running balances for every customer.",
};

const features = [
  {
    icon: "🧑‍💼",
    name: "Customer Profiles",
    description:
      "One profile per customer — contact info, credit limit, outstanding balance, full history. Everything in reach the moment you need it.",
  },
  {
    icon: "📝",
    name: "Credit Recording",
    description:
      "Log credit given in seconds. Date, amount, notes. No receipt book, no handwriting, no end-of-month confusion.",
  },
  {
    icon: "💳",
    name: "Payment Tracking",
    description:
      "Record every payment as it arrives. Partial payments, full settlements — each one timestamped and attached to the right customer.",
  },
  {
    icon: "⚖️",
    name: "Running Balance",
    description:
      "The balance updates automatically with every transaction. You always know exactly how much each customer owes — to the rupee.",
  },
  {
    icon: "📜",
    name: "Transaction History",
    description:
      "Pull up any customer's complete transaction timeline instantly. Perfect for disputes, audits, or simply knowing the facts.",
  },
  {
    icon: "🔍",
    name: "Instant Lookup",
    description:
      "Search any customer by name or phone. No index cards. No flipping through notebooks. Results in under a second.",
  },
];

const steps = [
  {
    number: 1,
    title: "Add a Customer",
    description:
      "Create a customer profile with name, phone, and optional credit limit. Takes 30 seconds — and they're in your system permanently.",
  },
  {
    number: 2,
    title: "Record Credit Given",
    description:
      "Every time you extend credit — goods, cash, services — log it immediately. Amounts, dates, and notes all captured cleanly.",
  },
  {
    number: 3,
    title: "Track Payments Received",
    description:
      "Mark payments as they come in. The balance updates live. You never need to manually tally totals again.",
  },
];

const audiences = [
  {
    role: "Traders & Wholesalers",
    benefit:
      "Stop relying on verbal agreements and handwritten khatas. Every credit line is documented and searchable.",
  },
  {
    role: "Shop Owners",
    benefit:
      "Know exactly who owes you and how much — at any moment — without spending an hour reconciling at day's end.",
  },
  {
    role: "B2B Business Operators",
    benefit:
      "Manage credit across dozens or hundreds of business customers with zero manual bookkeeping overhead.",
  },
  {
    role: "Finance Heads",
    benefit:
      "Get a clean, auditable trail of every credit and payment transaction — ready for review, tax, or dispute resolution.",
  },
];

export default function CustomerLedgerAppPage() {
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
              Customer Ledger App
            </span>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-text leading-tight mb-5">
              Your customers pay you back.{" "}
              <span className="text-primary-500">Make sure you know when.</span>
            </h1>
            <p className="text-lg text-muted max-w-2xl mx-auto mb-8">
              Built for shop owners, B2B operators, and finance heads who extend credit — and need every rupee
              tracked without a single page of handwritten notes.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/signup">
                <Button size="lg" fullWidth={false}>
                  Start Tracking Free
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
                The complete customer credit toolkit
              </h2>
              <p className="text-muted max-w-xl mx-auto">
                Six capabilities that replace your khata book — and make it smarter, faster, and searchable.
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
                Three steps to a clean ledger
              </h2>
              <p className="text-muted">Simple enough for day one. Powerful enough for year ten.</p>
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
                For every business that extends credit
              </h2>
              <p className="text-muted">
                If money leaves your business before it's fully paid, this is built for you.
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
              Your khata book had its run. This is better.
            </h2>
            <p className="text-muted mb-8">
              DigiKhaato's customer ledger is fast, searchable, and always accurate. Get started in under two minutes.
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
