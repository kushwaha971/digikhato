"use client";

import Link from "next/link";

import { Screen } from "@/components/layout/Screen";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/lib/routes";

export default function NewOldGoldExchangePage() {
  return (
    <Screen
      title="Old Gold Exchange"
      subtitle="Start a sales invoice with old-gold deduction rows pre-enabled"
      backHref={ROUTES.app.jewellery.billing}
    >
      <div className="app-panel rounded-2xl p-6 space-y-4 max-w-2xl">
        <p className="text-sm text-muted leading-relaxed">
          Old-gold valuation and deduction is now handled inside the main invoice form.
          Continue to the invoice builder to add old-gold rows, auto-calculate pure grams,
          and issue the final bill.
        </p>

        <div className="flex items-center gap-2">
          <Link href="/jewellery/billing/new?oldGold=1">
            <Button type="button">Open invoice with old-gold section</Button>
          </Link>
          <Link href={ROUTES.app.jewellery.billing} className="text-sm text-muted hover:text-text">
            Back to billing list
          </Link>
        </div>
      </div>
    </Screen>
  );
}
