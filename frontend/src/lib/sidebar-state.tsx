"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

interface SidebarState {
  collapsed: boolean;
  toggle: () => void;
}

const SidebarContext = createContext<SidebarState>({ collapsed: false, toggle: () => {} });

export function SidebarProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("sidebar-collapsed");
    if (stored === "true") setCollapsed(true);
  }, []);

  const toggle = () => {
    setCollapsed((c) => {
      const next = !c;
      localStorage.setItem("sidebar-collapsed", String(next));
      return next;
    });
  };

  return <SidebarContext.Provider value={{ collapsed, toggle }}>{children}</SidebarContext.Provider>;
}

export function useSidebarState(): SidebarState {
  return useContext(SidebarContext);
}
