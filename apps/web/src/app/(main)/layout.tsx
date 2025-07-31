"use client";

import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { useUiStore } from "@/lib/state/ui-store";
import React from "react";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isSidebarOpen = useUiStore((s) => s.isSidebarOpen);

  return (
    <div className="flex flex-col h-screen bg-white font-sans">
      <Header />
      <div className="flex-1 relative overflow-y-auto">
        <Sidebar />
        <main
          className="flex-1 overflow-y-auto p-4 md:p-8 bg-white transition-all duration-300"
          style={{ marginLeft: isSidebarOpen ? '288px' : '80px' }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
