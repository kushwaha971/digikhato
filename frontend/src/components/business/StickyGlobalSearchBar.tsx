"use client";

import { Input } from "@/components/ui/Input";

export function StickyGlobalSearchBar({
  value,
  onChange,
  placeholder = "Search borrower by name or mobile",
  sticky = true,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  sticky?: boolean;
}) {
  return (
    <div className={`${sticky ? "sticky top-0 z-20" : ""} mb-3 rounded-xl bg-canvas pb-2 pt-1`}>
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
