"use client";

import { useTheme } from "@/components/layout/ThemeProvider";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="inline-flex items-center gap-1 rounded-xl border border-border bg-surface p-1">
      {(["light", "dark", "system"] as const).map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => setTheme(item)}
          className={`rounded-lg px-2 py-1 text-xs font-semibold capitalize ${theme === item ? "bg-gradient-brand text-white" : "text-muted"}`}
        >
          {item}
        </button>
      ))}
    </div>
  );
}
