"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { Toast } from "@/components/ui/toast";

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  if (isLoginPage) {
    return <main className="flex-1 min-h-screen">{children}</main>;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 bg-[#FAFAFA] dark:bg-slate-900/10 transition-all duration-300 ease-in-out">
        <Topbar />
        <main className="flex-1 p-4 sm:p-6 lg:px-12 lg:py-10 overflow-x-hidden">
          {children}
        </main>
      </div>
      <Toast />
    </div>
  );
}
