import type { Metadata } from "next";
import { Inter as FontSans } from "next/font/google";
import { cn } from "@9nau/ui/lib/utils";
import { AppProvider } from "@/providers/app-provider";
import "./globals.css";
import React from "react";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "9naŭ",
  description: "Life & business growth",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("min-h-screen bg-background font-sans antialiased", fontSans.variable)}>
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
