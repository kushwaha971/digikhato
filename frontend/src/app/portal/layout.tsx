import { AppShell } from "@/components/layout/AppShell";
import { RouteGuard } from "@/components/layout/RouteGuard";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard requiredRoles={["borrower"]}>
      <AppShell>{children}</AppShell>
    </RouteGuard>
  );
}
