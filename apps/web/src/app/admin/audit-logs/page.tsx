"use client";

import React, { useState } from "react";
import useSWR from "swr";
import {
  ScrollText,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  Code2,
} from "lucide-react";
import { Card } from "@/components/ui/card";

interface AuditLogItem {
  id: string;
  actorId: string;
  actorEmail: string;
  actorName: string;
  action: string;
  resource: string;
  resourceId: string | null;
  details: any;
  createdAt: string;
}

interface AuditLogsResponse {
  logs: AuditLogItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

const ACTION_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  ORGANIZATION_CREATED: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  ORGANIZATION_ACTIVATED: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  ORGANIZATION_SUSPENDED: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" },
  ORGANIZATION_UPDATED: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  USER_ACTIVATED: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  USER_DEACTIVATED: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  SUPER_ADMIN_CREATED: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  ADMIN_LOGIN: { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200" },
  ADMIN_LOGOUT: { bg: "bg-secondary", text: "text-muted-foreground", border: "border-border" },
  SUBSCRIPTION_UPDATED: { bg: "bg-cyan-50", text: "text-cyan-700", border: "border-cyan-200" },
};

export default function AdminAuditLogsPage() {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [resourceFilter, setResourceFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const queryParams = new URLSearchParams({
    page: page.toString(),
    pageSize: "20",
    search,
    action: actionFilter,
    resource: resourceFilter,
  });

  const { data, isLoading } = useSWR<AuditLogsResponse>(
    `/api/admin/audit-logs?${queryParams.toString()}`
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <ScrollText className="w-5 h-5 text-primary" />
          Journal d'Audit
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Historique inaltérable de toutes les opérations d'administration et de sécurité
        </p>
      </div>

      {/* Filter & Search Bar */}
      <Card className="p-4 bg-card border-border rounded-xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Rechercher par acteur, action ou ID..."
            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all hover:border-primary/50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Action Filter */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>Action :</span>
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:border-primary"
            >
              <option value="all">Toutes les actions</option>
              <option value="ORGANIZATION_CREATED">Création Organisation</option>
              <option value="ORGANIZATION_UPDATED">Modification Organisation</option>
              <option value="ORGANIZATION_SUSPENDED">Suspension Organisation</option>
              <option value="ORGANIZATION_ACTIVATED">Réactivation Organisation</option>
              <option value="USER_ACTIVATED">Activation Utilisateur</option>
              <option value="USER_DEACTIVATED">Désactivation Utilisateur</option>
              <option value="SUPER_ADMIN_CREATED">Création Super Admin</option>
              <option value="SUBSCRIPTION_UPDATED">Mise à jour Licence</option>
              <option value="ADMIN_LOGIN">Connexion Admin</option>
              <option value="ADMIN_LOGOUT">Déconnexion Admin</option>
            </select>
          </div>

          {/* Resource Filter */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>Ressource :</span>
            <select
              value={resourceFilter}
              onChange={(e) => {
                setResourceFilter(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:border-primary"
            >
              <option value="all">Toutes les ressources</option>
              <option value="Organization">Organization</option>
              <option value="User">User</option>
              <option value="Subscription">Subscription</option>
              <option value="Security">Security</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Logs Table */}
      <Card className="bg-card border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/40 text-muted-foreground uppercase tracking-wider text-[10px] font-semibold border-b border-border">
              <tr>
                <th className="py-3 px-6">Horodatage</th>
                <th className="py-3 px-4">Acteur (Super Admin)</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Ressource</th>
                <th className="py-3 px-4">ID Cible</th>
                <th className="py-3 px-6 text-right">Détails</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-foreground">
              {isLoading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="py-4 px-6 h-12 bg-muted/20" />
                  </tr>
                ))
              ) : !data?.logs || data.logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    Aucun événement d'audit enregistré.
                  </td>
                </tr>
              ) : (
                data.logs.map((log) => {
                  const style = ACTION_COLORS[log.action] || {
                    bg: "bg-secondary",
                    text: "text-foreground",
                    border: "border-border",
                  };
                  const isExpanded = expandedLogId === log.id;

                  return (
                    <React.Fragment key={log.id}>
                      <tr className="hover:bg-muted/30 transition-colors">
                        {/* Timestamp */}
                        <td className="py-3.5 px-6 font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleDateString("fr-FR", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </td>

                        {/* Actor */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold text-primary-foreground">
                              {log.actorName[0] || "A"}
                            </div>
                            <div>
                              <p className="font-semibold text-foreground text-xs">{log.actorName}</p>
                              <p className="text-[10px] text-muted-foreground">{log.actorEmail}</p>
                            </div>
                          </div>
                        </td>

                        {/* Action badge */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border ${style.bg} ${style.text} ${style.border}`}
                          >
                            {log.action}
                          </span>
                        </td>

                        {/* Resource */}
                        <td className="py-3.5 px-4 font-semibold text-foreground">
                          {log.resource}
                        </td>

                        {/* Resource ID */}
                        <td className="py-3.5 px-4 font-mono text-[11px] text-muted-foreground">
                          {log.resourceId ? (
                            <span className="truncate max-w-[120px] inline-block">
                              {log.resourceId}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>

                        {/* Expand Details Button */}
                        <td className="py-3.5 px-6 text-right">
                          <button
                            onClick={() =>
                              setExpandedLogId(isExpanded ? null : log.id)
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-secondary hover:bg-secondary/80 text-foreground text-[11px] font-medium border border-border transition-colors"
                          >
                            <Code2 className="w-3 h-3 text-primary" />
                            <span>{isExpanded ? "Masquer" : "Inspecter"}</span>
                            {isExpanded ? (
                              <ChevronDown className="w-3 h-3" />
                            ) : (
                              <ChevronRight className="w-3 h-3" />
                            )}
                          </button>
                        </td>
                      </tr>

                      {/* Expanded JSON inspection drawer */}
                      {isExpanded && (
                        <tr className="bg-secondary/30 border-b border-border">
                          <td colSpan={6} className="p-4 px-6">
                            <div className="p-3 bg-card border border-border rounded-lg font-mono text-[11px] text-foreground overflow-x-auto max-h-60 shadow-xs">
                              <pre>
                                {JSON.stringify(
                                  {
                                    id: log.id,
                                    actorId: log.actorId,
                                    actorEmail: log.actorEmail,
                                    action: log.action,
                                    resource: log.resource,
                                    resourceId: log.resourceId,
                                    details: log.details,
                                    horodatage: log.createdAt,
                                  },
                                  null,
                                  2
                                )}
                              </pre>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.pagination.totalPages > 1 && (
          <div className="p-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Page {data.pagination.page} sur {data.pagination.totalPages} ({data.pagination.total} événements enregistrés)
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-md bg-card border border-border hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Précédent
              </button>
              <button
                disabled={page >= data.pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 rounded-md bg-card border border-border hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
