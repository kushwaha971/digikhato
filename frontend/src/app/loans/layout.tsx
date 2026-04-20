import { AppShell } from "@/components/layout/AppShell";
import { RouteGuard } from "@/components/layout/RouteGuard";

export default function LoansLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard requiredRoles={["admin", "collector"]}>
      <AppShell>{children}</AppShell>
    </RouteGuard>
  );
}
