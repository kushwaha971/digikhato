import { RouteGuard } from "@/components/layout/RouteGuard";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return <RouteGuard requiredRoles={["admin", "collector"]}>{children}</RouteGuard>;
}
