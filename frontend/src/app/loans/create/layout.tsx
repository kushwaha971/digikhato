import { RouteGuard } from "@/components/layout/RouteGuard";

export default function CreateLoanLayout({ children }: { children: React.ReactNode }) {
  return <RouteGuard requiredRoles={["admin"]}>{children}</RouteGuard>;
}
