"use client";

import { useGetLiveRatesQuery } from "@/store/jewellery-api";

function formatRate(rate: string) {
  return `₹${parseFloat(rate).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatTime(ts: string) {
  return new Date(ts).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

export function RateTicker() {
  const { data: rates, isLoading } = useGetLiveRatesQuery(undefined, {
    pollingInterval: 60_000,
  });

  if (isLoading || !rates || rates.length === 0) return null;

  return (
    <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto py-1 px-0.5 scrollbar-none">
      {rates.map((rate) => (
        <div
          key={`${rate.metal}-${rate.purity}`}
          className="flex items-center gap-2 shrink-0 rounded-xl bg-surface2 border border-border px-2.5 py-1.5"
        >
          <span className="text-xs font-semibold text-muted whitespace-nowrap">
            {rate.metal_name} {rate.purity_name}
          </span>
          <span className="text-xs sm:text-sm font-bold text-text whitespace-nowrap">
            {formatRate(rate.sell_rate)}/g
          </span>
          {rate.is_stale ? (
            <span
              title="Rate not updated in last 5 minutes"
              className="w-2 h-2 rounded-full bg-warning-400 shrink-0"
              aria-label="stale"
            />
          ) : (
            <span
              title={`Updated at ${formatTime(rate.updated_at)}`}
              className="w-2 h-2 rounded-full bg-success-400 shrink-0"
              aria-label="live"
            />
          )}
        </div>
      ))}
    </div>
  );
}
