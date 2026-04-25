"use client";

import Link from "next/link";
import { useState } from "react";

interface Feature {
  icon: string;
  title: string;
  tagline: string;
  href?: string;
  comingSoon?: boolean;
}

const features: Feature[] = [
  {
    icon: "🏦",
    title: "Borrower Management",
    tagline: "Loan accounts, EMI tracking, daily collections, and collector teams — all connected.",
    href: "/loan-management-software",
  },
  {
    icon: "📒",
    title: "UdhaarBook",
    tagline: "Udhar book for your business. Record credit, receive payments, see every balance in real time.",
    href: "/customer-ledger-app",
  },
  {
    icon: "📊",
    title: "Reports & Analytics",
    tagline: "Daily collection reports, overdue summaries, and portfolio-level visibility on demand.",
    href: "/reports-app",
  },
  {
    icon: "📝",
    title: "Notes",
    tagline: "Work reminders, daily tasks, and personal notes — secured to your account.",
    href: "/notes-app",
  },
  {
    icon: "🪑",
    title: "Library Seat Management",
    tagline: "Shift bookings, fee collection, and student attendance — all in one place.",
    comingSoon: true,
  },
  {
    icon: "💪",
    title: "Gym Membership",
    tagline: "Members, plans, renewals, and attendance — run a tighter fitness centre.",
    comingSoon: true,
  },
];

export function FeatureGrid() {
  const [comingSoonTitle, setComingSoonTitle] = useState<string | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map(({ icon, title, tagline, href, comingSoon }) => {
          const card = (
            <div
              className={`app-panel p-6 flex flex-col gap-4 w-full transition-all duration-200 relative ${
                comingSoon
                  ? "opacity-60 cursor-not-allowed"
                  : "hover:shadow-lg group-hover:border-primary-200 dark:group-hover:border-primary-800"
              }`}
            >
              {comingSoon && (
                <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-200 dark:bg-neutral-700 text-muted uppercase tracking-wide">
                  Coming Soon
                </span>
              )}
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-2xl shadow-sm flex-shrink-0">
                {icon}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-text text-base mb-1.5">{title}</h3>
                <p className="text-xs text-muted leading-relaxed">{tagline}</p>
              </div>
              {!comingSoon && (
                <div className="flex items-center gap-1 text-xs font-semibold text-primary-500 group-hover:gap-2 transition-all">
                  Explore
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              )}
            </div>
          );

          if (comingSoon) {
            return (
              <button
                key={title}
                type="button"
                className="group flex text-left w-full"
                onClick={() => setComingSoonTitle(title)}
              >
                {card}
              </button>
            );
          }

          return (
            <Link key={title} href={href!} className="group flex">
              {card}
            </Link>
          );
        })}
      </div>

      {/* Coming soon modal */}
      {comingSoonTitle && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setComingSoonTitle(null)}
        >
          <div
            className="app-panel p-8 max-w-sm w-full text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-3xl mx-auto mb-4">
              🔜
            </div>
            <h3 className="text-lg font-bold text-text mb-2">{comingSoonTitle}</h3>
            <p className="text-sm text-muted mb-6">
              This module is under development and will be available soon. Stay tuned for the launch!
            </p>
            <button
              type="button"
              onClick={() => setComingSoonTitle(null)}
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
