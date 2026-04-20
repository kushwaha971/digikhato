"use client";

import { OverdueCard } from "@/components/business/OverdueCard";
import { Screen } from "@/components/layout/Screen";
import { useListOverdueQuery } from "@/features/loans/loan-api";

export default function OverduePage() {
  const { data, isLoading } = useListOverdueQuery();

  return (
    <Screen title="Overdue List">
      {isLoading ? <p>Loading...</p> : null}
      <div className="space-y-2">
        {data?.results?.map((loan) => <OverdueCard key={loan.id} loan={loan} />)}
      </div>
    </Screen>
  );
}
