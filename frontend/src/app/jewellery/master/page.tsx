"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { Screen } from "@/components/layout/Screen";
import { ROUTES } from "@/lib/routes";

const MASTER_CARDS = [
  {
    key: "categories",
    title: "Categories",
    description: "Manage jewellery categories, HSN codes, and making charge formulas.",
    href: "/jewellery/master/categories",
  },
  {
    key: "designs",
    title: "Designs",
    description: "Design library with default weights, stones, and labour.",
    href: "/jewellery/master/designs",
  },
  {
    key: "tax-slabs",
    title: "Tax slabs",
    description: "Configure GST rate slabs and their effective date ranges.",
    href: "/jewellery/master/tax-slabs",
  },
  {
    key: "number-series",
    title: "Number series",
    description: "Set up voucher number prefixes, padding, and next counters.",
    href: "/jewellery/master/number-series",
  },
];

function MasterLanding() {
  return (
    <Screen
      title="Master data"
      subtitle="Configure categories, designs, tax slabs, and number series."
      backHref={ROUTES.app.jewellery.dashboard}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
        {MASTER_CARDS.map((card) => (
          <Link key={card.key} href={card.href} className="block">
            <div className="app-panel p-5 card-clickable h-full">
              <p className="font-semibold text-text">{card.title}</p>
              <p className="text-sm text-muted mt-1">{card.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </Screen>
  );
}

function MasterPageInner() {
  const searchParams = useSearchParams();
  const view = searchParams.get("view");

  if (!view) {
    return <MasterLanding />;
  }

  // Redirect to sub-pages via normal links
  return <MasterLanding />;
}

export default function JewelleryMasterPage() {
  return (
    <Suspense fallback={<Screen title="Master data" subtitle="Loading...">{null}</Screen>}>
      <MasterPageInner />
    </Suspense>
  );
}
