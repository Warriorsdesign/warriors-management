"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  ScrollText,
  ShieldCheck,
  LogOut,
  ExternalLink,
  Settings,
} from "lucide-react";
import { useAdminSession, adminLogout } from "@/lib/hooks/useAdminSession";

const NAV_ITEMS = [
  {
    label: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Organisations",
    href: "/admin/organisations",
    icon: Building2,
  },
  {
    label: "Utilisateurs",
    href: "/admin/utilisateurs",
    icon: Users,
  },
  {
    label: "Abonnements",
    href: "/admin/abonnements",
    icon: CreditCard,
  },
  {
    label: "Audit Logs",
    href: "/admin/audit-logs",
    icon: ScrollText,
  },
  {
    label: "Paramètres",
    href: "/admin/settings",
    icon: Settings,
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { adminUser } = useAdminSession();

  const getInitials = () => {
    if (!adminUser) return "SA";
    const f = adminUser.firstName?.[0] || "";
    const l = adminUser.lastName?.[0] || "";
    return `${f}${l}`.toUpperCase() || "SA";
  };

  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col justify-between h-screen sticky top-0 text-card-foreground select-none z-30">
      <div>
        {/* Brand Header */}
        <div className="h-16 flex items-center border-b border-border px-6">
          <div className="flex items-center gap-3 w-full">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold text-xs flex-shrink-0 shadow-sm shadow-primary/25">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="flex-1 overflow-hidden">
              <h2 className="font-bold text-sm text-card-foreground truncate">
                Warriors Admin
              </h2>
              <p className="text-[11px] text-muted-foreground truncate">
                Super Administration
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="p-4">
          <p className="px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            GOUVERNANCE
          </p>
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/admin/dashboard"
                  ? pathname === "/admin/dashboard"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                    isActive
                      ? "bg-secondary text-foreground font-semibold"
                      : "text-muted-foreground font-medium hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-6 pt-4 border-t border-border">
            <Link
              href="/"
              target="_blank"
              className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Espace Client</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer User Info */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center justify-between p-2 rounded-lg bg-secondary/50 border border-border">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs flex-shrink-0">
              {getInitials()}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-foreground truncate">
                {adminUser ? `${adminUser.firstName} ${adminUser.lastName}` : "Super Admin"}
              </p>
              <p className="text-[11px] text-muted-foreground truncate">
                {adminUser?.email ?? "admin@warriors.com"}
              </p>
            </div>
          </div>

          <button
            onClick={adminLogout}
            title="Se déconnecter"
            className="p-1.5 text-muted-foreground hover:text-destructive rounded-md hover:bg-destructive/10 transition-colors flex-shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
