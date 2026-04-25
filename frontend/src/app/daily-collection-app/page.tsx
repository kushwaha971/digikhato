import type { Metadata } from "next";
import Link from "next/link";
import { BrandLogo } from "@/components/branding/BrandLogo";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Daily Collection App | Installment & Chit Fund Collection Tracking Software",
  description:
    "Track daily installments, EMI collections, chit fund dues, and field collections with DigiKhaato's daily collection app. Built for field agents.",
  keywords: [
    "daily collection app",
    "installment tracking",
    "chit fund software",
    "field collection app",
    "EMI collection tracker",
    "daily saving collection",
  ],
};

const featureLinks = [
  { label: "Customer Ledger App", href: "/customer-ledger-app" },
  { label: "Digital Khata Book", href: "/digital-khata-book" },
  { label: "Notes App", href: "/notes-app" },
  { label: "Library Seat Management", href: "/library-seat-management-system" },
  { label: "Loan Management Software", href: "/loan-management-software" },
];

const features = [
  {
    icon: "📅",
    title: "Daily EMI Tracking",
    desc: "Record daily or weekly payments for each borrower. The system calculates outstanding dues and remaining installments automatically.",
  },
  {
    icon: "💰",
    title: "Chit Fund Management",
    desc: "Track monthly chit contributions from each member. Mark who has paid, who is due, and manage the pot distribution.",
  },
  {
    icon: "🏃",
    title: "Field Collector Tools",
    desc: "Designed for agents who collect in the field. Mark collections on the go with a phone and sync everything to the main account.",
  },
  {
    icon: "📋",
    title: "Collection History",
    desc: "View a full history of every payment collected from each customer. Filter by date, agent, or collection status.",
  },
  {
    icon: "🔔",
    title: "Overdue Alerts",
    desc: "Get notified when a customer misses a collection date. Send payment reminders directly from the app.",
  },
  {
    icon: "📊",
    title: "Daily Collection Reports",
    desc: "See how much was collected today, this week, or this month. Compare targets vs actual collections with clear summaries.",
  },
];

const useCases = [
  {
    icon: "🏦",
    title: "Micro Finance & MFI",
    desc: "Track weekly group loan repayments for microfinance borrowers across multiple villages or areas.",
  },
  {
    icon: "🎯",
    title: "Chit Fund Companies",
    desc: "Manage member subscriptions, collect monthly chit amounts, and record pot distributions accurately.",
  },
  {
    icon: "🔧",
    title: "Daily Instalment Lenders",
    desc: "For lenders who collect small daily amounts from borrowers instead of monthly EMIs.",
  },
  {
    icon: "💎",
    title: "Jewellery & Gold Schemes",
    desc: "Track monthly gold or jewellery scheme payments from customers and manage maturity payouts.",
  },
];

const steps = [
  {
    step: "1",
    title: "Add Your Borrowers",
    desc: "Create a borrower profile with name, mobile, and the installment amount and schedule.",
  },
  {
    step: "2",
    title: "Collect & Mark Payments",
    desc: "When a payment is received, tap to record it. The outstanding balance updates immediately.",
  },
  {
    step: "3",
    title: "Review Daily Reports",
    desc: "End each day by reviewing what was collected, what is pending, and who is overdue.",
  },
];

const faqs = [
  {
    q: "What types of collections can I track?",
    a: "DigiKhaato supports daily installments, weekly EMIs, monthly chit fund contributions, and any recurring payment schedule. You can configure the frequency for each borrower.",
  },
  {
    q: "Can multiple field agents use the same account?",
    a: "Yes. You can add multiple collectors to your DigiKhaato account. Each agent sees only their assigned borrowers and records collections against them.",
  },
  {
    q: "Does the app work offline?",
    a: "Collections can be entered any time. The data syncs to the server when an internet connection is available, so field agents in low-connectivity areas are not blocked.",
  },
  {
    q: "Can I see which collections are pending for today?",
    a: "Yes. The daily collection view shows you exactly which borrowers are due for collection today, their outstanding amount, and their collection history.",
  },
  {
    q: "Is this different from the loan management feature?",
    a: "The daily collection app focuses on recording recurring field collections. The loan management software tracks the full loan lifecycle — disbursement, interest calculation, EMI schedule, and overdue recovery. Both features are available in DigiKhaato.",
  },
  {
    q: "Can borrowers view their own collection history?",
    a: "Yes. Borrowers can log in to the DigiKhaato portal using their mobile number and view their complete payment history and outstanding balance.",
  },
];

export default function DailyCollectionAppPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 flex flex-col">
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-neutral-950/90 backdrop-blur-md border-b border-neutral-100 dark:border-neutral-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <BrandLogo size="md" href="/" />
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm" fullWidth={false}>Login</Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" fullWidth={false}>Start Free Trial</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="px-4 py-20 text-center">
        <div className="max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-50 text-primary-500 text-xs font-semibold mb-6 dark:bg-primary-900/30 dark:text-primary-400">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse" />
            Built for field collection teams
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold text-neutral-900 dark:text-white leading-tight mb-5">
            Daily Collection App —{" "}
            <span className="text-primary-500">Installment & Chit Fund</span> Collection Tracking Software
          </h1>
          <p className="text-lg text-neutral-500 dark:text-neutral-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Track every daily installment, weekly EMI, and chit fund contribution from your borrowers and members. DigiKhaato's daily collection app is built for field agents, MFIs, and chit fund operators who need real-time collection visibility.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/signup">
              <Button size="lg" fullWidth={false}>Start Free Trial →</Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" fullWidth={false}>Login to My Account</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 pb-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white text-center mb-3">
            Everything You Need to Run Daily Collections
          </h2>
          <p className="text-center text-neutral-500 dark:text-neutral-400 mb-10">
            Purpose-built tools for installment and chit fund collection teams.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map(({ icon, title, desc }) => (
              <div key={title} className="app-panel p-5">
                <div className="text-3xl mb-3">{icon}</div>
                <h3 className="font-semibold text-neutral-900 dark:text-white mb-2 text-sm">{title}</h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section className="px-4 py-16 bg-neutral-50 dark:bg-neutral-900/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white text-center mb-3">
            Who Uses DigiKhaato Daily Collection App?
          </h2>
          <p className="text-center text-neutral-500 dark:text-neutral-400 mb-10">
            Trusted by collection businesses of all sizes.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {useCases.map(({ icon, title, desc }) => (
              <div key={title} className="app-panel p-5 flex gap-4">
                <div className="text-3xl shrink-0">{icon}</div>
                <div>
                  <h3 className="font-semibold text-neutral-900 dark:text-white mb-1 text-sm">{title}</h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white mb-3">
            How It Works
          </h2>
          <p className="text-neutral-500 dark:text-neutral-400 mb-10">
            Simple for field agents. Powerful for business owners.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {steps.map(({ step, title, desc }) => (
              <div key={step} className="app-panel p-6 text-center">
                <div className="w-10 h-10 rounded-full bg-primary-500 text-white font-bold text-lg flex items-center justify-center mx-auto mb-4">
                  {step}
                </div>
                <h3 className="font-semibold text-neutral-900 dark:text-white mb-2">{title}</h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Internal link */}
      <section className="px-4 py-10">
        <div className="max-w-3xl mx-auto app-panel p-6 text-center">
          <p className="text-neutral-500 dark:text-neutral-400 text-sm mb-3">
            Need full loan lifecycle management with EMI schedules and interest tracking?
          </p>
          <Link href="/loan-management-software" className="text-primary-500 font-semibold hover:underline">
            Explore DigiKhaato Loan Management Software →
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 py-16 bg-neutral-50 dark:bg-neutral-900/50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white text-center mb-10">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {faqs.map(({ q, a }) => (
              <div key={q} className="app-panel p-5">
                <h3 className="font-semibold text-neutral-900 dark:text-white mb-2 text-sm">{q}</h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-16 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white mb-4">
            Take Control of Your Daily Collections
          </h2>
          <p className="text-neutral-500 dark:text-neutral-400 mb-8">
            Start your free trial today. No upfront cost. Full access from day one.
          </p>
          <Link href="/signup">
            <Button size="lg" fullWidth={false}>Start Free Trial →</Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-100 dark:border-neutral-800 py-8 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
            <BrandLogo size="sm" href="/" />
            <div className="flex flex-wrap gap-4 justify-center text-sm text-neutral-500 dark:text-neutral-400">
              {featureLinks.map(({ label, href }) => (
                <Link key={href} href={href} className="hover:text-primary-500 transition-colors">
                  {label}
                </Link>
              ))}
            </div>
          </div>
          <p className="text-xs text-neutral-400 text-center">© 2026 DigiKhaato. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
