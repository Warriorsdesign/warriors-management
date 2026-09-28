"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { AdminSidebar } from "@/components/admin/layout/AdminSidebar";
import { AdminTopbar } from "@/components/admin/layout/AdminTopbar";
import { Toast } from "@/components/ui/toast";
import { TabSessionGuard } from "@/components/auth/TabSessionGuard";

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/admin/login";

  if (isLoginPage) {
    return (
      <main className="flex-1 min-h-screen bg-[#F4F4F4]">
        {children}
        <Toast />
      </main>
    );
  }

  return (
    <TabSessionGuard scope="admin" logoutUrl="/api/admin/auth/logout" loginPath="/admin/login">
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0 bg-[#FAFAFA] dark:bg-slate-900/10 transition-all duration-300 ease-in-out">
        <AdminTopbar />
        <main className="flex-1 p-4 sm:p-6 lg:px-10 lg:py-8 overflow-x-hidden">
          {children}
        </main>
      </div>
      <Toast />
    </div>
    </TabSessionGuard>
  );
}
