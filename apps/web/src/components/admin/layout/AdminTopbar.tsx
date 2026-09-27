"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAdminSession } from "@/lib/hooks/useAdminSession";

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  "/admin/dashboard": {
    title: "Tableau de Bord Global",
    subtitle: "Surveillance et métriques consolidées de la plateforme",
  },
  "/admin/organisations": {
    title: "Gestion des Organisations",
    subtitle: "Parc des centres de formation clients et abonnements",
  },
  "/admin/utilisateurs": {
    title: "Utilisateurs & Administrateurs",
    subtitle: "Contrôle d'accès global et gestion des comptes",
  },
  "/admin/abonnements": {
    title: "Gestion des Abonnements",
    subtitle: "Suivi des formules, échéances et suspensions",
  },
  "/admin/audit-logs": {
    title: "Journal d'Audit Sécurisé",
    subtitle: "Historique inaltérable des opérations sensibles",
  },
};

export function AdminTopbar() {
  const pathname = usePathname();
  const { adminUser } = useAdminSession();

  const currentInfo = Object.entries(PAGE_TITLES).find(([route]) =>
    pathname.startsWith(route)
  )?.[1] ?? {
    title: "Back-Office Super Admin",
    subtitle: "Plateforme Warriors Management",
  };

  const getInitials = () => {
    if (!adminUser) return "SA";
    const f = adminUser.firstName?.[0] || "";
    const l = adminUser.lastName?.[0] || "";
    return `${f}${l}`.toUpperCase() || "SA";
  };

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6 sticky top-0 z-10 w-full">
      <div>
        <h1 className="text-base font-bold tracking-tight text-foreground leading-tight">
          {currentInfo.title}
        </h1>
        <p className="text-[11px] text-muted-foreground mt-0.5">{currentInfo.subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        <Badge variant="outline" className="h-7 px-2 font-medium bg-card text-muted-foreground whitespace-nowrap text-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2 flex-shrink-0"></span>
          Système à jour
        </Badge>

        <button className="relative text-muted-foreground hover:text-foreground p-1 flex-shrink-0">
          <Bell className="w-4 h-4" />
        </button>

        {adminUser?.avatarUrl ? (
          <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-white ml-1">
            <img
              src={adminUser.avatarUrl}
              alt="Avatar"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold ml-1 flex-shrink-0">
            {getInitials()}
          </div>
        )}
      </div>
    </header>
  );
}
