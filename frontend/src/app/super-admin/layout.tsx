import { RouteGuard } from "@/components/layout/RouteGuard";
import { AppShell } from "@/components/layout/AppShell";

export default function SuperAdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <RouteGuard requiredRoles={["super_admin"]}>
      <AppShell>{children}</AppShell>
    </RouteGuard>
  );
}
