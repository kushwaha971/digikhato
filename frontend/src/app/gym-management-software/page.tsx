import type { Metadata } from "next";
import Link from "next/link";
import { BrandLogo } from "@/components/branding/BrandLogo";
import { PublicNav } from "@/components/layout/PublicNav";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Gym Membership Management Software — Built for Fitness Centres | DigiKhaato",
  description:
    "DigiKhaato gym management software helps gym owners and studio managers track member profiles, plans, fees, renewals, and attendance — all in one place.",
};

const features = [
  {
    icon: "🏋️",
    name: "Member Profiles",
    description:
      "Maintain a complete member record — personal details, plan history, payment record, and joining date — all searchable in seconds.",
  },
  {
    icon: "📋",
    name: "Plan Management",
    description:
      "Create membership plans — monthly, quarterly, annual — with custom pricing. Assign members to plans with one tap.",
  },
  {
    icon: "💰",
    name: "Fee Collection",
    description:
      "Record every payment against the right member and plan. Know instantly who's paid, who's pending, and how much is outstanding.",
  },
  {
    icon: "🔔",
    name: "Renewal Alerts",
    description:
      "Never lose a member to a lapsed plan again. DigiKhaato flags upcoming renewals so you can follow up before they leave.",
  },
  {
    icon: "✅",
    name: "Attendance Tracking",
    description:
      "Log daily member attendance with a fast check-in flow. Spot low-engagement members early and run retention campaigns.",
  },
  {
    icon: "📊",
    name: "Reports",
    description:
      "Get a clear picture of active members, revenue collected, renewals due, and attendance trends — without building a single spreadsheet.",
  },
];

const steps = [
  {
    number: 1,
    title: "Add Members",
    description:
      "Enrol a new member in under a minute — name, phone, plan, start date. Their profile is live and trackable immediately.",
  },
  {
    number: 2,
    title: "Assign Plans",
    description:
      "Select the membership plan, set the pricing, and DigiKhaato automatically calculates the renewal date and due dates.",
  },
  {
    number: 3,
    title: "Track Fees & Renewals",
    description:
      "Record payments, monitor attendance, and let DigiKhaato surface renewal reminders at exactly the right time.",
  },
];

const audiences = [
  {
    role: "Gym Owners",
    benefit:
      "Stop losing revenue to lapsed memberships and manual follow-ups. DigiKhaato automates your renewal pipeline.",
  },
  {
    role: "Studio Managers",
    benefit:
      "Run daily operations — check-ins, fees, plan changes — from one screen instead of juggling spreadsheets and receipts.",
  },
  {
    role: "Fitness Centre Operators",
    benefit:
      "Scale from 50 to 500 members without adding admin headcount. DigiKhaato handles the paperwork so you focus on fitness.",
  },
  {
    role: "Multi-Location Operators",
    benefit:
      "Centralise member data across locations. No more siloed spreadsheets. One system, one source of truth.",
  },
];

export default function GymManagementSoftwarePage() {
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
              Gym Membership Management Software
            </span>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-text leading-tight mb-5">
              Manage every member. Never miss a renewal.{" "}
              <span className="text-primary-500">Run a tighter gym.</span>
            </h1>
            <p className="text-lg text-muted max-w-2xl mx-auto mb-8">
              Built for gym owners, studio managers, and fitness centre operators who want member data, fee tracking,
              and renewal alerts — without the admin nightmare.
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
                Everything your front desk needs — in one place
              </h2>
              <p className="text-muted max-w-xl mx-auto">
                Six features that replace the clipboard, the receipt book, and the WhatsApp reminders.
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
              <h2 className="text-2xl sm:text-3xl font-bold text-text mb-3">Live in an hour. Loved in a week.</h2>
              <p className="text-muted">
                DigiKhaato is built for gym operators — not for software teams. Simple, fast, and exactly what you need.
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
                For operators who want to grow, not just maintain
              </h2>
              <p className="text-muted">
                DigiKhaato handles the admin so you can focus on members, trainers, and the floor.
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
              Your gym runs hard. Your software should too.
            </h2>
            <p className="text-muted mb-8">
              DigiKhaato is purpose-built for fitness businesses that want to stop losing members to admin failures and
              start growing.
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
