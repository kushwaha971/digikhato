"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Input } from "@/components/ui/Input";
import { useDebounce } from "@/hooks/useDebounce";
import { ROUTES } from "@/lib/routes";
import type { ModuleContext } from "@/lib/moduleNav";
import { useListBorrowersQuery } from "@/features/borrowers/borrower-api";
import {
  useListCustomersQuery,
  useListInvoicesQuery,
  useListItemsQuery,
  useListKarigarsQuery,
} from "@/store/jewellery-api";

type SearchSection = {
  title: string;
  items: Array<{ id: string; label: string; meta?: string; href: string }>;
};

const JWL_NAV_TARGETS = [
  { id: "nav-dashboard", label: "Dashboard", href: ROUTES.app.jewellery.dashboard, keywords: "dashboard summary kpi" },
  { id: "nav-billing", label: "Billing & Sales", href: ROUTES.app.jewellery.billing, keywords: "invoice bill sales credit note" },
  { id: "nav-inventory", label: "Inventory", href: ROUTES.app.jewellery.inventory, keywords: "stock item sku huid purity" },
  { id: "nav-customers", label: "Customers", href: ROUTES.app.jewellery.customers, keywords: "customer party" },
  { id: "nav-karigar", label: "Order & Karigar", href: ROUTES.app.jewellery.karigar, keywords: "karigar order artisan" },
  { id: "nav-pledge", label: "Gold Pledge Loans", href: ROUTES.app.jewellery.pledge, keywords: "pledge loan gold" },
  { id: "nav-outstanding", label: "Party Outstanding", href: ROUTES.app.jewellery.outstanding, keywords: "outstanding receivable due" },
  { id: "nav-master", label: "Jewellery Master", href: ROUTES.app.jewellery.master, keywords: "master design category" },
  { id: "nav-rates", label: "MCX Live Rate", href: ROUTES.app.jewellery.rates, keywords: "rate metal purity" },
] as const;

interface GlobalSearchProps {
  moduleCtx: ModuleContext;
}

export function GlobalSearch({ moduleCtx }: Readonly<GlobalSearchProps>) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const normalized = debouncedQuery.trim().toLowerCase();
  const minCharsReached = normalized.length >= 2;

  // Loans mode (existing behavior, now debounced)
  const { data: borrowersData, isFetching: borrowersFetching } = useListBorrowersQuery(
    { search: debouncedQuery.trim() },
    { skip: moduleCtx !== "loans" || !minCharsReached }
  );

  // Jewellery mode (multi-entity)
  const { data: customersData, isFetching: customersFetching } = useListCustomersQuery(
    { search: debouncedQuery.trim() },
    { skip: moduleCtx !== "jewellery" || !minCharsReached }
  );
  const { data: itemsData, isFetching: itemsFetching } = useListItemsQuery(
    { search: debouncedQuery.trim(), page_size: 8 },
    { skip: moduleCtx !== "jewellery" || !minCharsReached }
  );
  const { data: invoicesData, isFetching: invoicesFetching } = useListInvoicesQuery(
    { search: debouncedQuery.trim(), page: 1 },
    { skip: moduleCtx !== "jewellery" || !minCharsReached }
  );
  const { data: karigarsData, isFetching: karigarsFetching } = useListKarigarsQuery(
    { search: debouncedQuery.trim() },
    { skip: moduleCtx !== "jewellery" || !minCharsReached }
  );

  const loansSections = useMemo<SearchSection[]>(() => {
    if (moduleCtx !== "loans") return [];
    const borrowers = borrowersData?.results ?? [];
    return [
      {
        title: "Borrowers",
        items: borrowers.slice(0, 6).map((b) => ({
          id: String(b.id),
          label: b.name,
          meta: b.mobile_number,
          href: ROUTES.app.loans.borrower(b.id),
        })),
      },
    ];
  }, [borrowersData, moduleCtx]);

  const jewellerySections = useMemo<SearchSection[]>(() => {
    if (moduleCtx !== "jewellery") return [];

    const navMatches = JWL_NAV_TARGETS.filter((n) =>
      `${n.label.toLowerCase()} ${n.keywords}`.includes(normalized)
    ).slice(0, 5);

    const customers = (customersData?.results ?? []).slice(0, 5).map((c) => ({
      id: c.id,
      label: c.name,
      meta: c.mobile,
      href: ROUTES.app.jewellery.customers + `/${c.id}`,
    }));

    const items = (itemsData?.results ?? []).slice(0, 5).map((i) => ({
      id: i.id,
      label: i.sku || i.barcode || i.huid || "Inventory item",
      meta: [i.design_name, `${i.metal_code}/${i.purity_code}`].filter(Boolean).join(" • "),
      href: ROUTES.app.jewellery.inventory + `/${i.id}`,
    }));

    const invoices = (invoicesData?.results ?? []).slice(0, 5).map((inv) => ({
      id: inv.id,
      label: inv.voucher_no || "Draft invoice",
      meta: [inv.customer_name || "No customer", inv.status].filter(Boolean).join(" • "),
      href: ROUTES.app.jewellery.billingInvoice(inv.id),
    }));

    const karigars = (karigarsData?.results ?? []).slice(0, 5).map((k) => ({
      id: k.id,
      label: k.name,
      meta: k.mobile,
      href: `${ROUTES.app.jewellery.karigar}?view=karigars`,
    }));

    return [
      {
        title: "Quick Pages",
        items: navMatches.map((n) => ({ id: n.id, label: n.label, href: n.href })),
      },
      { title: "Customers", items: customers },
      { title: "Inventory Items", items },
      { title: "Invoices", items: invoices },
      { title: "Karigars", items: karigars },
    ];
  }, [customersData, invoicesData, itemsData, karigarsData, moduleCtx, normalized]);

  const sections = moduleCtx === "jewellery" ? jewellerySections : loansSections;

  const isFetching =
    moduleCtx === "jewellery"
      ? customersFetching || itemsFetching || invoicesFetching || karigarsFetching
      : borrowersFetching;

  const totalItems = sections.reduce((sum, section) => sum + section.items.length, 0);

  function handleSelect(href: string) {
    setOpen(false);
    setQuery("");
    router.push(href);
  }

  function handleBlur() {
    setTimeout(() => setOpen(false), 150);
  }

  const placeholder =
    moduleCtx === "jewellery"
      ? "Search in Jewellery (customer, invoice, SKU...)"
      : "Search borrowers...";

  return (
    <div className="relative w-full" data-testid="global-search-root">
      <Input
        type="search"
        placeholder={placeholder}
        aria-label={moduleCtx === "jewellery" ? "Jewellery global search" : "Global search"}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={handleBlur}
        leftAddon={
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" />
          </svg>
        }
      />

      {open && query.trim().length >= 2 ? (
        <div className="absolute top-full mt-1 left-0 right-0 z-50 bg-surface border border-border rounded-lg shadow-lg overflow-hidden max-h-[70vh] overflow-y-auto" data-testid="global-search-results">
          {isFetching ? (
            <p className="px-4 py-3 text-sm text-muted">Searching...</p>
          ) : null}

          {!isFetching && totalItems === 0 ? (
            <p className="px-4 py-3 text-sm text-muted">No matching results.</p>
          ) : null}

          {!isFetching
            ? sections
                .filter((section) => section.items.length > 0)
                .map((section) => (
                  <div key={section.title} className="border-t border-border first:border-t-0">
                    <p className="px-3 py-2 text-[11px] font-semibold tracking-wide uppercase text-muted bg-surface2">{section.title}</p>
                    <ul>
                      {section.items.map((item) => (
                        <li key={`${section.title}-${item.id}`}>
                          <button
                            type="button"
                            onMouseDown={() => handleSelect(item.href)}
                            className="w-full px-4 py-2.5 text-left hover:bg-canvas transition-colors"
                          >
                            <p className="text-sm font-medium text-text truncate">{item.label}</p>
                            {item.meta ? <p className="text-xs text-muted truncate mt-0.5">{item.meta}</p> : null}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))
            : null}
        </div>
      ) : null}
    </div>
  );
}
