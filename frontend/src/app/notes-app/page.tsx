import type { Metadata } from "next";
import Link from "next/link";
import { BrandLogo } from "@/components/branding/BrandLogo";
import { PublicNav } from "@/components/layout/PublicNav";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Notes App — Business Notes That Stay With Your Account | DigiKhaato",
  description:
    "DigiKhaato's notes app keeps your business notes, reminders, and work diary securely tied to your account — accessible anywhere, instantly searchable.",
};

const features = [
  {
    icon: "⚡",
    name: "Quick Notes",
    description:
      "Capture a thought, instruction, or observation in seconds. No formatting required — just type and it's saved.",
  },
  {
    icon: "⏰",
    name: "Task Reminders",
    description:
      "Attach a reminder to any note. Get nudged at the right time so nothing critical falls off your radar.",
  },
  {
    icon: "📔",
    name: "Work Diary",
    description:
      "Build a running log of what happened, when, and why. Invaluable for reviews, disputes, and your own clarity.",
  },
  {
    icon: "🔒",
    name: "Secure Storage",
    description:
      "Your notes are private and encrypted. Not shared with other users, not accessible without your credentials.",
  },
  {
    icon: "🔗",
    name: "Linked to Your Account",
    description:
      "Notes travel with your DigiKhaato account — not your device. Switch phones, switch computers. Everything is there.",
  },
  {
    icon: "🌐",
    name: "Always Available",
    description:
      "Access from any browser on any device. Notes sync instantly — no cables, no backups, no exports needed.",
  },
];

const steps = [
  {
    number: 1,
    title: "Write a Note",
    description:
      "Open the notes section, type what you need to remember. Titles are optional — even a raw thought gets saved immediately.",
  },
  {
    number: 2,
    title: "Organise by Date",
    description:
      "Notes are automatically timestamped and listed by date. Find what you wrote last Tuesday without searching through files.",
  },
  {
    number: 3,
    title: "Access Anywhere",
    description:
      "Log in from any device and your notes are right there. Whether you're at the office or in the field — same view, same data.",
  },
];

const audiences = [
  {
    role: "Field Agents & Collectors",
    benefit:
      "Jot down borrower feedback, site observations, or follow-up actions right from your phone — and have them on record permanently.",
  },
  {
    role: "Branch Managers",
    benefit:
      "Keep a running diary of daily operations, staff notes, and pending decisions without relying on email threads or sticky notes.",
  },
  {
    role: "Individual Professionals",
    benefit:
      "One secure, searchable place for everything you need to remember — attached to your work account, not a personal app.",
  },
];

export default function NotesAppPage() {
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
              Business Notes App
            </span>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-text leading-tight mb-5">
              Stop losing track of what matters.{" "}
              <span className="text-primary-500">Write it down, find it instantly.</span>
            </h1>
            <p className="text-lg text-muted max-w-2xl mx-auto mb-8">
              A secure, always-available notes space built into your DigiKhaato account — for field agents,
              managers, and professionals who can't afford to forget things.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/signup">
                <Button size="lg" fullWidth={false}>
                  Start Writing Free
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="lg" fullWidth={false}>
                  Log In
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
                Notes that work as hard as you do
              </h2>
              <p className="text-muted max-w-xl mx-auto">
                Not just a notepad — a professional memory tool built for people in motion.
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
                Frictionless from first note to last search
              </h2>
              <p className="text-muted">No setup. No categories to configure. Just open and write.</p>
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
                For everyone who needs to remember — professionally
              </h2>
              <p className="text-muted">
                Notes are part of DigiKhaato — so they live where your work lives, not in a random app on your phone.
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
              The best note is the one you can actually find later.
            </h2>
            <p className="text-muted mb-8">
              DigiKhaato keeps your notes secure, synced, and searchable — exactly when you need them.
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
