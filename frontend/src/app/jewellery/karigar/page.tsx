import { ModulePlaceholder } from "@/components/jewellery/shared/ModulePlaceholder";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const KARIGAR_VIEW_CONFIG: Record<string, { title: string; description: string }> = {
  default: {
    title: "Customer order",
    description: "Manage custom orders, track metal with karigars, and reconcile wastage.",
  },
  "customer-order": {
    title: "Customer order",
    description: "Manage custom orders, track metal with karigars, and reconcile wastage.",
  },
  "metal-issue": {
    title: "Metal Issue Voucher",
    description: "Manage custom orders, track metal with karigars, and reconcile wastage.",
  },
  receipt: {
    title: "Karigar receipt",
    description: "Receive finished goods, reconcile issued metal, and update WIP statuses.",
  },
  tunch: {
    title: "Tunch reconciliation",
    description: "Compare expected purity and actual recovery from karigar returns.",
  },
  wastage: {
    title: "Wastage reconciliation",
    description: "Track issued vs received weights and monitor allowed wastage thresholds.",
  },
  "labour-bill": {
    title: "Labour bill",
    description: "Capture labour charges and settlement entries against completed jobs.",
  },
  repair: {
    title: "Repair / alteration",
    description: "Handle repair workflows, status tracking, and delivery commitments.",
  },
};

export default async function JewelleryKarigarPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const rawView = params.view;
  const view = typeof rawView === "string" ? rawView : Array.isArray(rawView) ? rawView[0] : "customer-order";
  const config = KARIGAR_VIEW_CONFIG[view] ?? KARIGAR_VIEW_CONFIG.default;

  return <ModulePlaceholder title={config.title} description={config.description} presetKey={config.title} />;
}
