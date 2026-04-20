"use client";

import { Input } from "@/components/ui/Input";

export function StickyGlobalSearchBar({ value, onChange, placeholder = "Search borrower by name or mobile" }: { value: string; onChange: (value: string) => void; placeholder?: string; }) {
  return (
    <div className="sticky top-0 z-20 mb-3 rounded-xl bg-[#f3f7f4] pb-2 pt-1">
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
