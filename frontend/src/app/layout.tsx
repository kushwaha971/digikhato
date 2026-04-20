import type { Metadata } from "next";
import "./globals.css";

import { AuthBootstrap } from "@/components/layout/AuthBootstrap";
import { SessionSecurityProvider } from "@/components/session/SessionSecurityProvider";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { Snackbar } from "@/components/ui/Snackbar";
import { StoreProvider } from "@/store/provider";

export const metadata: Metadata = {
  title: {
    default: "DailyBook — Daily Collection & Loan Management",
    template: "%s | DailyBook",
  },
  description: "DailyBook is a modern loan collection management platform for field agents and administrators.",
  manifest: "/manifest.json",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        <StoreProvider>
          <ThemeProvider>
            <AuthBootstrap>
              <SessionSecurityProvider>{children}</SessionSecurityProvider>
              <Snackbar />
            </AuthBootstrap>
          </ThemeProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
