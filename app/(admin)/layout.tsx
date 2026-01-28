"use client";

import React from "react"

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminTopbar } from "@/components/admin/topbar";
import { AdminEnvBanner } from "@/components/admin/env-banner";
import { useAuth } from "@/lib/auth-context";
import { AdminLocaleProvider } from "@/lib/admin-locale";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <AdminLocaleProvider>
      <div className="min-h-screen">
        <AdminSidebar />
        <AdminTopbar />
        <AdminEnvBanner />
        <main className="ml-64 pt-16">
          <div className="p-6">{children}</div>
        </main>
      </div>
    </AdminLocaleProvider>
  );
}
