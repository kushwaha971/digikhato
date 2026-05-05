import { Badge } from "@/components/ui/Badge";

type ItemStatus = "IN_STOCK" | "SOLD" | "ISSUED" | "TRANSIT" | "WRITTEN_OFF";

const STATUS_CONFIG: Record<ItemStatus, { label: string; variant: "success" | "neutral" | "primary" | "warning" | "danger" }> = {
  IN_STOCK: { label: "In Stock", variant: "success" },
  SOLD: { label: "Sold", variant: "neutral" },
  ISSUED: { label: "Issued", variant: "primary" },
  TRANSIT: { label: "Transit", variant: "warning" },
  WRITTEN_OFF: { label: "Written Off", variant: "danger" },
};

interface StatusBadgeProps {
  status: ItemStatus | string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status as ItemStatus];
  if (!config) {
    return <Badge variant="neutral">{status}</Badge>;
  }
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
