"use client";

import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from "react";

type ThemePreference = "light" | "dark" | "system";

type ThemeContextShape = {
  theme: ThemePreference;
  setTheme: (theme: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextShape | null>(null);

function applyTheme(theme: ThemePreference) {
  const root = document.documentElement;
  const resolved =
    theme === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : theme;
  root.classList.toggle("dark", resolved === "dark");
}

export function ThemeProvider({ children }: PropsWithChildren) {
  const [theme, setThemeState] = useState<ThemePreference>("system");

  useEffect(() => {
    const saved = (localStorage.getItem("themePreference") as ThemePreference | null) ?? "system";
    setThemeState(saved);
    applyTheme(saved);
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = () => {
      if (theme === "system") applyTheme("system");
    };
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [theme]);

  const setTheme = (next: ThemePreference) => {
    setThemeState(next);
    localStorage.setItem("themePreference", next);
    applyTheme(next);
  };

  const value = useMemo(() => ({ theme, setTheme }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
