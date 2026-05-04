import { ModulePlaceholder } from "@/components/jewellery/shared/ModulePlaceholder";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const INVENTORY_VIEW_CONFIG: Record<string, { title: string; description: string }> = {
  default: {
    title: "Item master",
    description: "Track every piece of jewellery with complete weight, purity, and location detail.",
  },
  "item-master": {
    title: "Item master",
    description: "Track every piece of jewellery with complete weight, purity, and location detail.",
  },
  purity: {
    title: "Purity tracking",
    description: "Monitor purity readings, certification flags, and quality checks for stock.",
  },
  huid: {
    title: "HUID / BIS hallmark",
    description: "Manage HUID, hallmark status, and traceability checkpoints for each item.",
  },
  "stock-take": {
    title: "Physical stock-take",
    description: "Run stock-take sessions, reconcile variances, and close branch counts.",
  },
  "chain-of-custody": {
    title: "Item Chain of Custody",
    description: "Track every piece of jewellery with complete weight, purity, and location detail.",
  },
};

export default async function JewelleryInventoryPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const rawView = params.view;
  const view = typeof rawView === "string" ? rawView : Array.isArray(rawView) ? rawView[0] : "item-master";
  const config = INVENTORY_VIEW_CONFIG[view] ?? INVENTORY_VIEW_CONFIG.default;

  return <ModulePlaceholder title={config.title} description={config.description} presetKey={config.title} />;
}
