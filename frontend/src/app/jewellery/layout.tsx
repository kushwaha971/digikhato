"use client";

import { RateTicker } from "@/components/jewellery/shared/RateTicker";
import { AppShell } from "@/components/layout/AppShell";
import { RouteGuard } from "@/components/layout/RouteGuard";

export default function JewelleryLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard requiredRoles={["admin", "collector"]}>
      <AppShell>
        <div className="border-b border-border bg-surface px-4 py-1.5">
          <RateTicker />
        </div>
        {children}
      </AppShell>
    </RouteGuard>
  );
}
