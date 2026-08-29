"use client";

import React from "react";
import { BarChart3 } from "lucide-react";

export default function ReportsPage() {
  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Rapports & Analyses</h1>
          <p className="text-sm text-muted-foreground mt-1">Consultez les statistiques détaillées (Bientôt disponible).</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-none p-12 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <BarChart3 className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">En construction</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          La page des rapports dynamiques et d'analyses statistiques est actuellement en cours de développement.
        </p>
      </div>
    </div>
  );
}
