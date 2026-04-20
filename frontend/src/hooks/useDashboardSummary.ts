"use client";

import { useGetDashboardSummaryQuery } from "@/features/dashboard/dashboard-api";

export function useDashboardSummary() {
  return useGetDashboardSummaryQuery();
}
