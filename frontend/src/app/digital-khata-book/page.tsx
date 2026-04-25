import type { Metadata } from "next";
import Link from "next/link";
import { BrandLogo } from "@/components/branding/BrandLogo";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Digital Khata Book | Online Credit & Payment Tracking for Indian Businesses",
  description:
    "Replace your paper khata with DigiKhaato's digital khata book. Track credit, payments, and customer balances online. Free for small businesses.",
  keywords: [
    "digital khata book",
    "online khata",
    "paperless khata",
    "khatabook alternative",
    "udhar tracking online",
    "credit management app India",
  ],
};

const featureLinks = [
  { label: "Customer Ledger App", href: "/customer-ledger-app" },
  { label: "Notes App", href: "/notes-app" },
  { label: "Library Seat Management", href: "/library-seat-management-system" },
  { label: "Daily Collection App", href: "/daily-collection-app" },
  { label: "Loan Management Software", href: "/loan-management-software" },
];

const benefits = [
  {
    icon: "📵",
    title: "No More Lost Registers",
    desc: "A paper khata can be damaged, lost, or stolen. Your digital khata is stored securely in the cloud and backed up automatically.",
  },
  {
    icon: "🔢",
    title: "Zero Calculation Errors",
    desc: "Manual addition leads to mistakes. DigiKhaato calculates every balance automatically — no errors, no disputes.",
  },
  {
    icon: "🔍",
    title: "Find Any Customer Instantly",
    desc: "Search by name or mobile number and pull up a customer's full ledger in seconds. No more flipping through pages.",
  },
  {
    icon: "📲",
    title: "Access Anywhere, Anytime",
    desc: "Open your khata on your phone at the shop, at home, or while visiting a customer. Works on any device with a browser.",
  },
  {
    icon: "📤",
    title: "Share Statements Easily",
    desc: "Send a customer their account statement via WhatsApp or SMS directly from the app. Professional and transparent.",
  },
  {
    icon: "🔐",
    title: "Private & Secure",
    desc: "Only you can see your business data. Customers can view only their own account when they log in.",
  },
];

const comparisons = [
  { aspect: "Balance Calculation", paper: "Manual, error-prone", digital: "Automatic, instant" },
  { aspect: "Search Customer", paper: "Flip through pages", digital: "Search by name instantly" },
  { aspect: "Risk of Loss", paper: "Fire, flood, or theft", digital: "Cloud backup, always safe" },
  { aspect: "Customer Statement", paper: "Handwrite or photocopy", digital: "Share with one tap" },
  { aspect: "Access on Phone", paper: "Not possible", digital: "Yes, from anywhere" },
  { aspect: "Cost", paper: "Register cost + time", digital: "Free" },
];

const steps = [
  {
    step: "1",
    title: "Create Your Free Account",
    desc: "Sign up with your mobile number. No paperwork, no fees.",
  },
  {
    step: "2",
    title: "Add Your Customers",
    desc: "Enter each customer's name and mobile number to create their digital khata.",
  },
  {
    step: "3",
    title: "Start Recording Transactions",
    desc: "Record credit given or payment received. Balances update in real time.",
  },
];

const faqs = [
  {
    q: "Is DigiKhaato a free alternative to KhataBook?",
    a: "Yes. DigiKhaato offers free digital khata features for individual business owners. You can track customer credit, payments, and balances without paying anything.",
  },
  {
    q: "Can I migrate my paper khata data to DigiKhaato?",
    a: "Yes. You can manually enter your existing customer balances as an opening balance when you add each customer. From that point, DigiKhaato tracks all future transactions automatically.",
  },
  {
    q: "What happens if I lose my phone?",
    a: "Nothing. Your data is stored in the cloud, not on your phone. Simply log in from any other device to access all your customer records.",
  },
  {
    q: "Can I use this for my wholesale business?",
    a: "Absolutely. DigiKhaato works for any business that extends credit — from kirana stores and pharmacies to wholesale distributors and contractors.",
  },
  {
    q: "Does DigiKhaato send payment reminders to customers?",
    a: "Yes. You can send payment reminders to customers via the app. Customers receive a notification about their outstanding balance.",
  },
  {
    q: "Is there a limit on how many customers I can add?",
    a: "No. You can add unlimited customers to your digital khata book at no extra cost.",
  },
];

export default function DigitalKhataBookPage() {
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
              <Button size="sm" fullWidth={false}>Start Free</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="px-4 py-20 text-center">
        <div className="max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-50 text-primary-500 text-xs font-semibold mb-6 dark:bg-primary-900/30 dark:text-primary-400">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse" />
            Replace your paper register today
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold text-neutral-900 dark:text-white leading-tight mb-5">
            Digital Khata Book —{" "}
            <span className="text-primary-500">Go Paperless</span> with Online Credit Tracking
          </h1>
          <p className="text-lg text-neutral-500 dark:text-neutral-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Your paper khata register gets lost, damaged, or filled up. DigiKhaato is your permanent, free digital khata book that tracks customer credit and payments online — with automatic balance calculation.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/signup">
              <Button size="lg" fullWidth={false}>Start Free →</Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" fullWidth={false}>I Already Have an Account</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="px-4 pb-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white text-center mb-3">
            Why Switch to a Digital Khata Book?
          </h2>
          <p className="text-center text-neutral-500 dark:text-neutral-400 mb-10">
            See what you gain when you move from paper to digital.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {benefits.map(({ icon, title, desc }) => (
              <div key={title} className="app-panel p-5">
                <div className="text-3xl mb-3">{icon}</div>
                <h3 className="font-semibold text-neutral-900 dark:text-white mb-2 text-sm">{title}</h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="px-4 py-16 bg-neutral-50 dark:bg-neutral-900/50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white text-center mb-10">
            Paper Khata vs Digital Khata Book
          </h2>
          <div className="app-panel overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100 dark:border-neutral-800">
                  <th className="text-left p-4 font-semibold text-neutral-900 dark:text-white">Feature</th>
                  <th className="text-center p-4 font-semibold text-neutral-500 dark:text-neutral-400">Paper Khata</th>
                  <th className="text-center p-4 font-semibold text-primary-500">DigiKhaato</th>
                </tr>
              </thead>
              <tbody>
                {comparisons.map(({ aspect, paper, digital }, i) => (
                  <tr
                    key={aspect}
                    className={i % 2 === 0 ? "bg-neutral-50/50 dark:bg-neutral-800/20" : ""}
                  >
                    <td className="p-4 font-medium text-neutral-800 dark:text-neutral-200">{aspect}</td>
                    <td className="p-4 text-center text-neutral-400 dark:text-neutral-500">❌ {paper}</td>
                    <td className="p-4 text-center text-primary-500">✅ {digital}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white mb-3">
            How to Get Started
          </h2>
          <p className="text-neutral-500 dark:text-neutral-400 mb-10">
            Switch from paper to digital in under 5 minutes.
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

      {/* Internal link to Loan Management */}
      <section className="px-4 py-10">
        <div className="max-w-3xl mx-auto app-panel p-6 text-center">
          <p className="text-neutral-500 dark:text-neutral-400 text-sm mb-3">
            Do you also manage loans and EMI collections?
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
            Ditch the Register. Start Your Free Digital Khata Today.
          </h2>
          <p className="text-neutral-500 dark:text-neutral-400 mb-8">
            Free forever for small businesses. No hidden charges.
          </p>
          <Link href="/signup">
            <Button size="lg" fullWidth={false}>Start Free →</Button>
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
