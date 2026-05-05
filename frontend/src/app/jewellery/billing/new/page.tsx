"use client";

import { useSearchParams } from "next/navigation";

import { InvoiceFormContent } from "@/components/jewellery/billing/InvoiceFormContent";
import { Screen } from "@/components/layout/Screen";
import { ROUTES } from "@/lib/routes";
import type { InvoiceType } from "@/store/jewellery-api";

export default function NewJewelleryInvoicePage() {
  const searchParams = useSearchParams();
  const seedOldGold = searchParams.get("oldGold") === "1";
  const requestedType = searchParams.get("type");
  const referenceFromQuery = searchParams.get("ref") ?? "";

  const initialType: InvoiceType = requestedType === "CREDIT_NOTE" ? "CREDIT_NOTE" : "TAX_INVOICE";

  return (
    <Screen
      title={initialType === "CREDIT_NOTE" ? "New Credit Note" : "New Invoice"}
      subtitle={
        initialType === "CREDIT_NOTE"
          ? "Capture returned items and issue customer credit note"
          : "Build line items, preview GST split, and issue sales invoice"
      }
      backHref={ROUTES.app.jewellery.billing}
    >
      <InvoiceFormContent
        initialInvoiceType={initialType}
        initialReferenceInvoiceId={referenceFromQuery}
        seedOldGold={seedOldGold}
      />
    </Screen>
  );
}
