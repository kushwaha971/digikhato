import { AppShell } from "@/components/layout/AppShell";
import { RouteGuard } from "@/components/layout/RouteGuard";

export default function TeamLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard requiredRoles={["admin"]}>
      <AppShell>{children}</AppShell>
    </RouteGuard>
  );
}
