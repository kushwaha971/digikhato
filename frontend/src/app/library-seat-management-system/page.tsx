import type { Metadata } from "next";
import Link from "next/link";
import { BrandLogo } from "@/components/branding/BrandLogo";
import { PublicNav } from "@/components/layout/PublicNav";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Library Seat Management System — Fee Collection & Attendance | DigiKhaato",
  description:
    "DigiKhaato's library seat management system lets library owners and study centres book seats by shift, collect fees, track attendance, and send renewal alerts.",
};

const features = [
  {
    icon: "🪑",
    name: "Seat Booking by Shift",
    description:
      "Define morning, afternoon, and evening shifts. Assign specific seats to students with a clean, conflict-free booking system.",
  },
  {
    icon: "💰",
    name: "Fee Collection",
    description:
      "Record monthly or custom-period fees per student. Track who has paid, who is pending, and how much is due — at a glance.",
  },
  {
    icon: "🧑‍🎓",
    name: "Student Profiles",
    description:
      "Maintain a complete profile for every member — contact, seat number, shift, admission date, and fee history.",
  },
  {
    icon: "✅",
    name: "Attendance Tracking",
    description:
      "Log daily attendance by shift. Know exactly who showed up, who didn't, and spot irregular patterns before they become a problem.",
  },
  {
    icon: "🔔",
    name: "Renewal Alerts",
    description:
      "Get automatic alerts before memberships expire. Reach out to students at the right time and reduce seat turnover.",
  },
  {
    icon: "📊",
    name: "Occupancy Reports",
    description:
      "See which shifts are full, which seats are idle, and how your revenue stacks up — broken down by day, week, or month.",
  },
];

const steps = [
  {
    number: 1,
    title: "Set Up Shifts",
    description:
      "Define your library's shifts — timing, seat count, pricing per shift. Your capacity structure is configured once and reused forever.",
  },
  {
    number: 2,
    title: "Book Seats for Students",
    description:
      "Enrol students, assign their seat and shift, and set their fee period. Their profile is live in seconds.",
  },
  {
    number: 3,
    title: "Track Fees & Attendance",
    description:
      "Log daily attendance, record monthly fee payments, and let DigiKhaato alert you to renewals and dues automatically.",
  },
];

const audiences = [
  {
    role: "Library Owners",
    benefit:
      "Replace paper registers and handwritten receipts with a digital system that gives you full visibility into every seat and every payment.",
  },
  {
    role: "Study Centre Managers",
    benefit:
      "Manage multiple shifts, dozens of students, and monthly fee cycles — without spreadsheets or manual follow-ups.",
  },
  {
    role: "Coaching Institutes",
    benefit:
      "Track attendance and fee compliance for reading room students separately from your main coaching operations.",
  },
];

export default function LibrarySeatManagementPage() {
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
              Library Seat Management System
            </span>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-text leading-tight mb-5">
              Every seat. Every shift. Every payment.{" "}
              <span className="text-primary-500">Under control.</span>
            </h1>
            <p className="text-lg text-muted max-w-2xl mx-auto mb-8">
              Built for library owners and study centre managers who need to book seats, collect fees, and track
              attendance — without paper registers or missed renewals.
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
                Run a tighter library operation
              </h2>
              <p className="text-muted max-w-xl mx-auto">
                Six features that replace your notebook — and put every seat, fee, and student in one clean system.
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
              <h2 className="text-2xl sm:text-3xl font-bold text-text mb-3">From setup to fully operational in an hour</h2>
              <p className="text-muted">
                DigiKhaato is designed for owner-operators — not IT teams. Get going fast, stay organised longer.
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
                For the people keeping the lights on at reading rooms
              </h2>
              <p className="text-muted">
                Whether you run 20 seats or 200 — DigiKhaato scales without adding work to your plate.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
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
              Your library deserves a system — not a notebook.
            </h2>
            <p className="text-muted mb-8">
              DigiKhaato gives you the tools to run a professional, organised, profitable reading space. Start free today.
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
