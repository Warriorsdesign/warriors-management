"use client";

import React, { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import {
  Building2,
  Search,
  Plus,
  Store,
  Users,
  GraduationCap,
  CreditCard,
  Edit2,
  Power,
  ArrowRight,
  Filter,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { OrganizationModal } from "@/components/admin/organizations/OrganizationModal";
import { SuspendOrganizationModal } from "@/components/admin/organizations/SuspendOrganizationModal";

interface OrganizationItem {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  status: string;
  createdAt: string;
  subscription?: {
    plan: string;
    status: string;
    endDate: string;
  } | null;
  _count: {
    centers: number;
    users: number;
    students: number;
    formations: number;
  };
}

interface OrganizationsResponse {
  organizations: OrganizationItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export default function AdminOrganizationsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<OrganizationItem | null>(null);
  const [suspendingOrg, setSuspendingOrg] = useState<OrganizationItem | null>(null);

  const queryParams = new URLSearchParams({
    page: page.toString(),
    pageSize: "10",
    search,
    status: statusFilter,
  });

  const { data, isLoading, mutate } = useSWR<OrganizationsResponse>(
    `/api/admin/organizations?${queryParams.toString()}`
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            Organisations Clientes
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Gestion du parc multi-tenant et des accès aux centres
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold rounded-lg shadow-sm transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Créer une Organisation</span>
        </button>
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
            placeholder="Rechercher par nom ou email..."
            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all hover:border-primary/50"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Statut :</span>
          <div className="flex items-center p-1 bg-secondary/60 rounded-lg border border-border text-xs">
            {["all", "actif", "suspendu"].map((st) => (
              <button
                key={st}
                onClick={() => {
                  setStatusFilter(st);
                  setPage(1);
                }}
                className={`px-3 py-1 rounded-md capitalize transition-all ${
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

      {/* Organizations Table */}
      <Card className="bg-card border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/40 text-muted-foreground uppercase tracking-wider text-[10px] font-semibold border-b border-border">
              <tr>
                <th className="py-3 px-6">Organisation</th>
                <th className="py-3 px-4">Centres & Équipe</th>
                <th className="py-3 px-4">Apprenants</th>
                <th className="py-3 px-4">Formule</th>
                <th className="py-3 px-4">Statut</th>
                <th className="py-3 px-4">Création</th>
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
              ) : !data?.organizations || data.organizations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    Aucune organisation trouvée correspondant à vos critères.
                  </td>
                </tr>
              ) : (
                data.organizations.map((org) => (
                  <tr
                    key={org.id}
                    className="hover:bg-muted/30 transition-colors group"
                  >
                    {/* Organization info */}
                    <td className="py-3.5 px-6">
                      <Link
                        href={`/admin/organisations/${org.id}`}
                        className="font-bold text-foreground hover:text-primary transition-colors flex items-center gap-1.5"
                      >
                        <span>{org.name}</span>
                        <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                      <p className="text-[11px] text-muted-foreground mt-0.5 truncate max-w-xs">
                        {org.email || "Email non renseigné"} {org.phone && `· ${org.phone}`}
                      </p>
                    </td>

                    {/* Centres & Équipe */}
                    <td className="py-3.5 px-4 text-foreground">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Store className="w-3.5 h-3.5 text-primary" />
                          {org._count.centers} centre(s)
                        </span>
                        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Users className="w-3.5 h-3.5 text-blue-600" />
                          {org._count.users} user(s)
                        </span>
                      </div>
                    </td>

                    {/* Apprenants */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-semibold text-[11px] border border-emerald-200">
                        <GraduationCap className="w-3.5 h-3.5" />
                        {org._count.students}
                      </span>
                    </td>

                    {/* Licence / Subscription */}
                    <td className="py-3.5 px-4">
                      {org.subscription ? (
                        <div className="space-y-0.5">
                          <span className="inline-block px-2 py-0.5 rounded bg-primary/10 text-primary font-bold text-[10px] uppercase">
                            {org.subscription.plan}
                          </span>
                          <p className="text-[10px] text-muted-foreground">
                            Exp. {new Date(org.subscription.endDate).toLocaleDateString("fr-FR")}
                          </p>
                        </div>
                      ) : (
                        <span className="text-[11px] text-muted-foreground italic">
                          Aucun abonnement
                        </span>
                      )}
                    </td>

                    {/* Statut */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          org.status === "actif"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-rose-50 text-rose-700 border-rose-200"
                        }`}
                      >
                        {org.status === "actif" ? (
                          <CheckCircle2 className="w-2.5 h-2.5" />
                        ) : (
                          <XCircle className="w-2.5 h-2.5" />
                        )}
                        {org.status}
                      </span>
                    </td>

                    {/* Date Création */}
                    <td className="py-3.5 px-4 text-muted-foreground text-[11px]">
                      {new Date(org.createdAt).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-6 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/admin/organisations/${org.id}`}
                          title="Voir la fiche détaillée"
                          className="p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-secondary transition-colors"
                        >
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => setEditingOrg(org)}
                          title="Modifier l'organisation"
                          className="p-1.5 text-muted-foreground hover:text-primary rounded-md hover:bg-secondary transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setSuspendingOrg(org)}
                          title={
                            org.status === "actif"
                              ? "Suspendre l'organisation"
                              : "Réactiver l'organisation"
                          }
                          className={`p-1.5 rounded-md hover:bg-secondary transition-colors ${
                            org.status === "actif"
                              ? "text-muted-foreground hover:text-destructive"
                              : "text-muted-foreground hover:text-emerald-600"
                          }`}
                        >
                          <Power className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.pagination.totalPages > 1 && (
          <div className="p-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Page {data.pagination.page} sur {data.pagination.totalPages} ({data.pagination.total} organisations au total)
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

      {/* Modals */}
      <OrganizationModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => mutate()}
      />

      <OrganizationModal
        isOpen={Boolean(editingOrg)}
        onClose={() => setEditingOrg(null)}
        initialData={editingOrg}
        onSuccess={() => mutate()}
      />

      <SuspendOrganizationModal
        isOpen={Boolean(suspendingOrg)}
        onClose={() => setSuspendingOrg(null)}
        organization={suspendingOrg}
        onSuccess={() => mutate()}
      />
    </div>
  );
}
