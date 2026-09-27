"use client";

import React, { useState } from "react";
import useSWR from "swr";
import {
  Users,
  Search,
  Plus,
  Power,
  Building2,
  CheckCircle2,
  XCircle,
  Filter,
  ShieldCheck,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { CreateSuperAdminModal } from "@/components/admin/users/CreateSuperAdminModal";
import { apiFetch, ApiClientError } from "@/lib/api/client";
import { useUIStore } from "@/lib/store/useUIStore";
import { useAdminSession } from "@/lib/hooks/useAdminSession";

interface UserItem {
  id: string;
  matricule: string;
  firstName: string;
  lastName: string;
  email: string;
  roles: string[];
  isSuperAdmin: boolean;
  status: string;
  createdAt: string;
  organization?: {
    id: string;
    name: string;
    status: string;
  } | null;
}

interface UsersResponse {
  users: UserItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export default function AdminUsersPage() {
  const showToast = useUIStore((state) => state.showToast);
  const { adminUser: currentSuperAdmin } = useAdminSession();

  const [activeTab, setActiveTab] = useState<"clients" | "admins">("clients");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [isCreateAdminOpen, setIsCreateAdminOpen] = useState(false);
  const [togglingUserId, setTogglingUserId] = useState<string | null>(null);

  const queryParams = new URLSearchParams({
    page: page.toString(),
    pageSize: "15",
    search,
    isSuperAdmin: activeTab === "admins" ? "true" : "false",
    role: activeTab === "clients" ? roleFilter : "all",
  });

  const { data, isLoading, mutate } = useSWR<UsersResponse>(
    `/api/admin/users?${queryParams.toString()}`
  );

  const handleToggleStatus = async (user: UserItem) => {
    const newStatus = user.status === "actif" ? "inactif" : "actif";
    setTogglingUserId(user.id);

    try {
      await apiFetch(`/api/admin/users/${user.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });

      showToast(
        `Le compte de ${user.firstName} ${user.lastName} est maintenant ${newStatus}.`,
        "success"
      );
      mutate();
    } catch (err) {
      showToast(
        err instanceof ApiClientError ? err.message : "Erreur lors du changement de statut.",
        "error"
      );
    } finally {
      setTogglingUserId(null);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Gestion des Utilisateurs & Accès
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Supervision de tous les comptes clients et gouvernance des Super Administrateurs
          </p>
        </div>

        {activeTab === "admins" && (
          <button
            onClick={() => setIsCreateAdminOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold rounded-lg shadow-sm transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Nouveau Super Admin</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-2">
        <button
          onClick={() => {
            setActiveTab("clients");
            setPage(1);
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === "clients"
              ? "bg-secondary text-foreground shadow-xs font-bold"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Utilisateurs des Organisations</span>
        </button>

        <button
          onClick={() => {
            setActiveTab("admins");
            setPage(1);
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === "admins"
              ? "bg-secondary text-foreground shadow-xs font-bold"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-primary" />
          <span>Équipe Super Administrateurs</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
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
            placeholder="Rechercher par nom, matricule ou email..."
            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all hover:border-primary/50"
          />
        </div>

        {activeTab === "clients" && (
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Rôle :</span>
            <div className="flex items-center p-1 bg-secondary/60 rounded-lg border border-border text-xs">
              {["all", "ADMIN", "GESTIONNAIRE", "COMPTABLE"].map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    setRoleFilter(r);
                    setPage(1);
                  }}
                  className={`px-3 py-1 rounded-md text-xs capitalize transition-all ${
                    roleFilter === r
                      ? "bg-card text-foreground font-semibold shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {r === "all" ? "Tous" : r.toLowerCase()}
                </button>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Users Table */}
      <Card className="bg-card border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/40 text-muted-foreground uppercase tracking-wider text-[10px] font-semibold border-b border-border">
              <tr>
                <th className="py-3 px-6">Utilisateur</th>
                <th className="py-3 px-4">Matricule</th>
                {activeTab === "clients" ? (
                  <th className="py-3 px-4">Organisation</th>
                ) : (
                  <th className="py-3 px-4">Type de Compte</th>
                )}
                <th className="py-3 px-4">Rôles</th>
                <th className="py-3 px-4">Statut</th>
                <th className="py-3 px-4">Date de Création</th>
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
              ) : !data?.users || data.users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    Aucun utilisateur trouvé.
                  </td>
                </tr>
              ) : (
                data.users.map((user) => {
                  const isCurrentAdmin = user.id === currentSuperAdmin?.id;

                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-muted/30 transition-colors group"
                    >
                      {/* Name & Email */}
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs flex-shrink-0">
                            {user.firstName[0]}
                            {user.lastName[0]}
                          </div>
                          <div>
                            <p className="font-bold text-foreground flex items-center gap-2">
                              <span>
                                {user.firstName} {user.lastName}
                              </span>
                              {isCurrentAdmin && (
                                <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.2 rounded font-semibold">
                                  Vous
                                </span>
                              )}
                            </p>
                            <p className="text-[11px] text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Matricule */}
                      <td className="py-3.5 px-4 font-mono text-[11px] text-foreground">
                        {user.matricule}
                      </td>

                      {/* Org or Account Type */}
                      {activeTab === "clients" ? (
                        <td className="py-3.5 px-4">
                          {user.organization ? (
                            <span className="font-medium text-foreground">
                              {user.organization.name}
                            </span>
                          ) : (
                            <span className="text-muted-foreground italic">Non rattaché</span>
                          )}
                        </td>
                      ) : (
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                            <ShieldCheck className="w-3 h-3 text-primary" />
                            Super Admin
                          </span>
                        </td>
                      )}

                      {/* Roles */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1">
                          {user.roles.map((r) => (
                            <span
                              key={r}
                              className="px-2 py-0.5 rounded bg-secondary text-foreground text-[10px] font-medium border border-border"
                            >
                              {r}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                            user.status === "actif"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-rose-50 text-rose-700 border-rose-200"
                          }`}
                        >
                          {user.status === "actif" ? (
                            <CheckCircle2 className="w-2.5 h-2.5" />
                          ) : (
                            <XCircle className="w-2.5 h-2.5" />
                          )}
                          {user.status}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-muted-foreground text-[11px]">
                        {new Date(user.createdAt).toLocaleDateString("fr-FR")}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-6 text-right">
                        {isCurrentAdmin ? (
                          <span className="text-[11px] text-muted-foreground italic">
                            Compte actif
                          </span>
                        ) : (
                          <button
                            onClick={() => handleToggleStatus(user)}
                            disabled={togglingUserId === user.id}
                            title={
                              user.status === "actif"
                                ? "Désactiver le compte"
                                : "Activer le compte"
                            }
                            className={`p-1.5 rounded-md border transition-colors ${
                              user.status === "actif"
                                ? "border-border text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                : "border-border text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50"
                            }`}
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>
                        )}
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
              Page {data.pagination.page} sur {data.pagination.totalPages} ({data.pagination.total} utilisateurs)
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

      {/* Modal create super admin */}
      <CreateSuperAdminModal
        isOpen={isCreateAdminOpen}
        onClose={() => setIsCreateAdminOpen(false)}
        onSuccess={() => mutate()}
      />
    </div>
  );
}
