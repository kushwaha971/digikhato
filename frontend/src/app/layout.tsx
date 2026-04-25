import type { Metadata } from "next";
import "./globals.css";

import { AuthBootstrap } from "@/components/layout/AuthBootstrap";
import { SessionSecurityProvider } from "@/components/session/SessionSecurityProvider";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { Snackbar } from "@/components/ui/Snackbar";
import { StoreProvider } from "@/store/provider";

export const metadata: Metadata = {
  title: {
    default: "DigiKhaato — Digital Khata Book & Loan Management Software",
    template: "%s | DigiKhaato",
  },
  description: "DigiKhaato is India's all-in-one digital khata book for customer ledger, loan management, library seat booking, and daily collection tracking.",
  keywords: ["digital khata book", "customer ledger app", "loan management software", "khatabook alternative", "udhar khata app", "daily collection app"],
  manifest: "/manifest.json",
  icons: {
    icon: "/icon-192.svg",
    apple: "/icon-192.svg",
    shortcut: "/icon-192.svg",
  },
  openGraph: {
    type: "website",
    siteName: "DigiKhaato",
    title: "DigiKhaato — Digital Bahi Khata for Every Business",
    description: "Manage customer credit, loans, library seats, and daily collections from one simple dashboard.",
  },
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
