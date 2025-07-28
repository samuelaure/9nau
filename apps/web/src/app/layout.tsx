import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "9naŭ",
  description: "The 9naŭ platform for life and business growth.",
};

export default function RootLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
