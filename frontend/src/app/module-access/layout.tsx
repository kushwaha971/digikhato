import { RouteGuard } from "@/components/layout/RouteGuard";

export default function ModuleAccessLayout({ children }: { children: React.ReactNode }) {
  return <RouteGuard>{children}</RouteGuard>;
}
