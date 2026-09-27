"use client";

import React, { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import {
  CreditCard,
  Search,
  Filter,
  AlertTriangle,
  Clock,
  Edit2,
  Store,
  Users,
  Building2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { EditSubscriptionModal } from "@/components/admin/subscriptions/EditSubscriptionModal";

interface SubscriptionItem {
  id: string;
  plan: string;
  status: string;
  startDate: string;
  endDate: string;
  maxCenters: number;
  maxStudents: number;
  daysLeft: number;
  organization: {
    id: string;
    name: string;
    email: string | null;
    status: string;
    _count: {
      centers: number;
      students: number;
    };
  };
}

interface SubscriptionsResponse {
  subscriptions: SubscriptionItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export default function AdminSubscriptionsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [editingSub, setEditingSub] = useState<SubscriptionItem | null>(null);

  const queryParams = new URLSearchParams({
    page: page.toString(),
    pageSize: "15",
    search,
    status: statusFilter,
  });

  const { data, isLoading, mutate } = useSWR<SubscriptionsResponse>(
    `/api/admin/subscriptions?${queryParams.toString()}`
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-primary" />
          Abonnements & Licences
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Suivi des formules, validité des contrats et quotas alloués aux organisations
        </p>
      </div>

      {/* Filter & Search Bar */}
      <Card className="p-4 bg-card border-border rounded-xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Rechercher par nom d'organisation..."
            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all hover:border-primary/50"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Statut :</span>
          <div className="flex items-center p-1 bg-secondary/60 rounded-lg border border-border text-xs flex-wrap">
            {["all", "active", "trial", "expired", "suspended"].map((st) => (
              <button
                key={st}
                onClick={() => {
                  setStatusFilter(st);
                  setPage(1);
                }}
                className={`px-3 py-1 rounded-md text-xs capitalize transition-all ${
                  statusFilter === st
                    ? "bg-card text-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {st === "all" ? "Tous" : st}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Subscriptions Table */}
      <Card className="bg-card border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/40 text-muted-foreground uppercase tracking-wider text-[10px] font-semibold border-b border-border">
              <tr>
                <th className="py-3 px-6">Organisation</th>
                <th className="py-3 px-4">Plan</th>
                <th className="py-3 px-4">Statut Contrat</th>
                <th className="py-3 px-4">Utilisation Quotas</th>
                <th className="py-3 px-4">Date d'Échéance</th>
                <th className="py-3 px-4">Temps Restant</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-foreground">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={7} className="py-4 px-6 h-14 bg-muted/20" />
                  </tr>
                ))
              ) : !data?.subscriptions || data.subscriptions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    Aucun abonnement trouvé.
                  </td>
                </tr>
              ) : (
                data.subscriptions.map((sub) => {
                  const isExpiringSoon = sub.daysLeft > 0 && sub.daysLeft <= 7;
                  const isExpired = sub.daysLeft <= 0;

                  return (
                    <tr
                      key={sub.id}
                      className="hover:bg-muted/30 transition-colors group"
                    >
                      {/* Organization info */}
                      <td className="py-3.5 px-6">
                        <Link
                          href={`/admin/organisations/${sub.organization.id}`}
                          className="font-bold text-foreground hover:text-primary transition-colors flex items-center gap-1.5"
                        >
                          <Building2 className="w-3.5 h-3.5 text-primary" />
                          <span>{sub.organization.name}</span>
                        </Link>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {sub.organization.email || "Email non renseigné"}
                        </p>
                      </td>

                      {/* Plan */}
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2.5 py-0.5 rounded bg-primary/10 text-primary font-bold text-[10px] uppercase border border-primary/20">
                          {sub.plan}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                            sub.status === "active"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : sub.status === "trial"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : sub.status === "suspended"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-rose-50 text-rose-700 border-rose-200"
                          }`}
                        >
                          {sub.status}
                        </span>
                      </td>

                      {/* Quotas */}
                      <td className="py-3.5 px-4 text-muted-foreground">
                        <div className="space-y-1 text-[11px]">
                          <div className="flex items-center gap-1.5">
                            <Store className="w-3 h-3 text-primary" />
                            <span>
                              {sub.organization._count.centers} / {sub.maxCenters} centres
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Users className="w-3 h-3 text-blue-600" />
                            <span>
                              {sub.organization._count.students} / {sub.maxStudents} apprenants
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* End Date */}
                      <td className="py-3.5 px-4 font-mono text-[11px] text-foreground">
                        {new Date(sub.endDate).toLocaleDateString("fr-FR", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>

                      {/* Days Left */}
                      <td className="py-3.5 px-4">
                        {isExpired ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-destructive">
                            <AlertTriangle className="w-3 h-3" />
                            Expiré ({Math.abs(sub.daysLeft)}j)
                          </span>
                        ) : isExpiringSoon ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600">
                            <Clock className="w-3 h-3" />
                            {sub.daysLeft} jours restants
                          </span>
                        ) : (
                          <span className="text-[11px] text-foreground font-medium">
                            {sub.daysLeft} jours
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-6 text-right">
                        <button
                          onClick={() => setEditingSub(sub)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-secondary hover:bg-secondary/80 text-foreground text-xs font-semibold border border-border transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Gérer</span>
                        </button>
                      </td>
                    </tr>
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
              Page {data.pagination.page} sur {data.pagination.totalPages} ({data.pagination.total} abonnements)
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

      {/* Edit modal */}
      <EditSubscriptionModal
        isOpen={Boolean(editingSub)}
        onClose={() => setEditingSub(null)}
        subscription={editingSub}
        onSuccess={() => mutate()}
      />
    </div>
  );
}
