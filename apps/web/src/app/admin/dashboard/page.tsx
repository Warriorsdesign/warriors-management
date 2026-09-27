"use client";

import React from "react";
import useSWR from "swr";
import Link from "next/link";
import {
  Building2,
  Users,
  GraduationCap,
  Store,
  CreditCard,
  AlertCircle,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  Clock,
  Plus,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface DashboardData {
  kpis: {
    totalOrganizations: number;
    activeOrganizations: number;
    suspendedOrganizations: number;
    totalCenters: number;
    totalUsers: number;
    totalStudents: number;
    totalRevenue: number;
    subscriptions: {
      active: number;
      trial: number;
      expired: number;
      suspended: number;
    };
  };
  recentOrganizations: Array<{
    id: string;
    name: string;
    email: string | null;
    status: string;
    createdAt: string;
    _count: {
      centers: number;
      users: number;
      students: number;
    };
  }>;
  recentAuditLogs: Array<{
    id: string;
    actorEmail: string;
    actorName: string;
    action: string;
    resource: string;
    resourceId: string | null;
    createdAt: string;
  }>;
  growthChart: Array<{
    month: string;
    organizations: number;
  }>;
}

export default function AdminDashboardPage() {
  const { data, isLoading, error } = useSWR<DashboardData>(
    "/api/admin/dashboard/stats"
  );

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-card rounded-xl border border-border shadow-sm" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80 bg-card rounded-xl border border-border shadow-sm" />
          <div className="h-80 bg-card rounded-xl border border-border shadow-sm" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center bg-card border border-border rounded-xl shadow-sm">
        <AlertCircle className="w-10 h-10 text-destructive mx-auto mb-3" />
        <h3 className="text-base font-semibold text-foreground">
          Erreur lors du chargement des statistiques
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Impossible de contacter le service d'agrégation d'administration.
        </p>
      </div>
    );
  }

  const { kpis, recentOrganizations, recentAuditLogs, growthChart } = data;

  return (
    <div className="space-y-6 pb-10">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-xl bg-card border border-border shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-foreground">
            Vue Consolidée de la Plateforme
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Gérez l'ensemble des {kpis.totalOrganizations} organisations clientes réparties sur {kpis.totalCenters} centres.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/organisations"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nouvelle Organisation</span>
          </Link>
          <Link
            href="/admin/audit-logs"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground text-xs font-semibold border border-border transition-all"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Journal d'Audit</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Organisations */}
        <div className="p-5 rounded-xl bg-card border border-border shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Organisations
            </span>
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-foreground">
              {kpis.totalOrganizations}
            </span>
            <span className="text-xs text-emerald-600 font-medium">
              {kpis.activeOrganizations} actives
            </span>
          </div>
          {kpis.suspendedOrganizations > 0 && (
            <p className="text-[11px] text-destructive mt-1 font-medium">
              {kpis.suspendedOrganizations} suspendue(s)
            </p>
          )}
        </div>

        {/* Card 2: Centres */}
        <div className="p-5 rounded-xl bg-card border border-border shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Centres Rattachés
            </span>
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Store className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-foreground">
              {kpis.totalCenters}
            </span>
            <span className="text-xs text-muted-foreground">centres au total</span>
          </div>
        </div>

        {/* Card 3: Utilisateurs */}
        <div className="p-5 rounded-xl bg-card border border-border shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Utilisateurs
            </span>
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-foreground">
              {kpis.totalUsers}
            </span>
            <span className="text-xs text-muted-foreground">comptes enregistrés</span>
          </div>
        </div>

        {/* Card 4: Apprenants */}
        <div className="p-5 rounded-xl bg-card border border-border shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Apprenants
            </span>
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-foreground">
              {kpis.totalStudents}
            </span>
            <span className="text-xs text-emerald-600 font-medium">inscrits</span>
          </div>
        </div>

        {/* Card 5: Chiffre d'Affaires */}
        <div className="p-5 rounded-xl bg-card border border-border shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Chiffre d'Affaires
            </span>
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-foreground">
              {new Intl.NumberFormat('fr-FR').format(kpis.totalRevenue)}
            </span>
            <span className="text-xs font-bold text-muted-foreground">FCFA</span>
          </div>
        </div>
      </div>

      {/* Charts & Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Growth Bar Chart */}
        <Card className="lg:col-span-2 bg-card border-border p-6 rounded-xl shadow-sm">
          <CardHeader className="p-0 mb-6">
            <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Nouvelles Organisations Inscrites (6 derniers mois)
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Dynamique d'adhésion des centres de formation
            </p>
          </CardHeader>
          <CardContent className="p-0 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={growthChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    borderColor: "#e2e8f0",
                    borderRadius: "0.5rem",
                    color: "#0f172a",
                    fontSize: "12px",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                />
                <Bar dataKey="organizations" name="Organisations" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Subscriptions Status Breakdown */}
        <Card className="bg-card border-border p-6 rounded-xl shadow-sm flex flex-col justify-between">
          <CardHeader className="p-0 mb-4">
            <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-primary" />
              État des Abonnements
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Répartition selon le contrat de licence
            </p>
          </CardHeader>

          <div className="space-y-3 my-auto">
            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-xs font-semibold text-foreground">Actifs / Payants</span>
              </div>
              <span className="text-sm font-bold text-foreground">{kpis.subscriptions.active}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span className="text-xs font-semibold text-foreground">Période d'Essai (Trial)</span>
              </div>
              <span className="text-sm font-bold text-foreground">{kpis.subscriptions.trial}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span className="text-xs font-semibold text-foreground">Expirés</span>
              </div>
              <span className="text-sm font-bold text-destructive">{kpis.subscriptions.expired}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="text-xs font-semibold text-foreground">Suspendus</span>
              </div>
              <span className="text-sm font-bold text-amber-600">{kpis.subscriptions.suspended}</span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-border">
            <Link
              href="/admin/abonnements"
              className="text-xs text-primary hover:underline flex items-center justify-between font-semibold"
            >
              <span>Gérer les abonnements</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </Card>
      </div>

      {/* Two columns: Recent Organizations & Recent Audits */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Organizations */}
        <Card className="bg-card border-border p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" />
                Dernières Organisations Inscrites
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Organisations récemment créées sur le réseau
              </p>
            </div>
            <Link
              href="/admin/organisations"
              className="text-xs text-primary hover:underline font-semibold"
            >
              Voir tout
            </Link>
          </div>

          <div className="space-y-2.5">
            {recentOrganizations.length === 0 ? (
              <p className="text-xs text-muted-foreground py-6 text-center">
                Aucune organisation enregistrée pour le moment.
              </p>
            ) : (
              recentOrganizations.map((org) => (
                <div
                  key={org.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-background border border-border hover:bg-secondary/30 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {org.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {org.email || "Email non renseigné"} · {org._count.centers} centre(s) · {org._count.students} apprenant(s)
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                        org.status === "actif"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-rose-50 text-rose-700 border-rose-200"
                      }`}
                    >
                      {org.status}
                    </span>
                    <Link
                      href={`/admin/organisations/${org.id}`}
                      className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Recent Audit Logs */}
        <Card className="bg-card border-border p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Journal d'Audit Récent
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Dernières opérations sensibles Super Admin
              </p>
            </div>
            <Link
              href="/admin/audit-logs"
              className="text-xs text-primary hover:underline font-semibold"
            >
              Consulter tout
            </Link>
          </div>

          <div className="space-y-2.5">
            {recentAuditLogs.length === 0 ? (
              <p className="text-xs text-muted-foreground py-6 text-center">
                Aucun log d'audit disponible.
              </p>
            ) : (
              recentAuditLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-background border border-border"
                >
                  <div className="min-w-0 pr-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-foreground">
                        {log.action}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        ({log.resource})
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      Par <span className="text-foreground font-medium">{log.actorName}</span>
                    </p>
                  </div>
                  <span className="text-[11px] text-muted-foreground flex-shrink-0">
                    {new Date(log.createdAt).toLocaleDateString("fr-FR", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
