"use client";

import React, { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Building2,
  ArrowLeft,
  Store,
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  Mail,
  Phone,
  MapPin,
  CheckCircle2,
  XCircle,
  Edit2,
  Power,
  CreditCard,
  AlertCircle,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { OrganizationModal } from "@/components/admin/organizations/OrganizationModal";
import { SuspendOrganizationModal } from "@/components/admin/organizations/SuspendOrganizationModal";
import { ResetOnboardingModal } from "@/components/admin/organizations/ResetOnboardingModal";

const ONBOARDING_BADGE: Record<string, { label: string; className: string }> = {
  non_commence: { label: "Configuration non commencée", className: "bg-slate-50 text-slate-600 border-slate-200" },
  en_cours: { label: "Configuration en cours", className: "bg-amber-50 text-amber-700 border-amber-200" },
  termine: { label: "Configuration terminée", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
};

export default function AdminOrganizationDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSuspendOpen, setIsSuspendOpen] = useState(false);
  const [isResetOnboardingOpen, setIsResetOnboardingOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "centers" | "users" | "subscription">("overview");

  const { data, isLoading, error, mutate } = useSWR<{
    organization: {
      id: string;
      name: string;
      email: string | null;
      phone: string | null;
      address: string | null;
      status: string;
      onboardingStatus: string;
      onboardingStep: string | null;
      onboardingCompletedAt: string | null;
      createdAt: string;
      updatedAt: string;
      subscription: {
        id: string;
        plan: string;
        status: string;
        startDate: string;
        endDate: string;
        maxCenters: number;
        maxStudents: number;
      } | null;
      centers: Array<{
        id: string;
        name: string;
        address: string | null;
        status: string;
        _count: { classes: number; expenses: number };
      }>;
      users: Array<{
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        matricule: string;
        roles: string[];
        status: string;
        lastLoginAt: string | null;
        createdAt: string;
      }>;
      _count: {
        students: number;
        formations: number;
        classes: number;
        payments: number;
        expenses: number;
      };
    };
  }>(id ? `/api/admin/organizations/${id}` : null);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-44 bg-card rounded-md" />
        <div className="h-36 bg-card rounded-xl border border-border" />
        <div className="h-80 bg-card rounded-xl border border-border" />
      </div>
    );
  }

  if (error || !data?.organization) {
    return (
      <div className="p-12 text-center bg-card border border-border rounded-xl shadow-sm">
        <AlertCircle className="w-10 h-10 text-destructive mx-auto mb-3" />
        <h3 className="text-base font-semibold text-foreground">
          Organisation introuvable
        </h3>
        <p className="text-xs text-muted-foreground mt-1 mb-4">
          L'organisation demandée n'existe pas ou a été supprimée.
        </p>
        <Link
          href="/admin/organisations"
          className="inline-flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground text-xs font-semibold rounded-lg"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Retour à la liste des organisations</span>
        </Link>
      </div>
    );
  }

  const { organization: org } = data;

  return (
    <div className="space-y-6 pb-12">
      {/* Back button */}
      <div>
        <Link
          href="/admin/organisations"
          className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Retour aux organisations</span>
        </Link>
      </div>

      {/* Header Banner */}
      <Card className="p-6 bg-card border-border rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-bold text-foreground">{org.name}</h2>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${
                  org.status === "actif"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-rose-50 text-rose-700 border-rose-200"
                }`}
              >
                {org.status === "actif" ? (
                  <CheckCircle2 className="w-3 h-3" />
                ) : (
                  <XCircle className="w-3 h-3" />
                )}
                {org.status}
              </span>
              {ONBOARDING_BADGE[org.onboardingStatus] && (
                <span className={`inline-flex items-center gap-1 whitespace-nowrap px-2.5 py-0.5 rounded-full text-xs font-semibold border ${ONBOARDING_BADGE[org.onboardingStatus].className}`}>
                  <Sparkles className="w-3 h-3" />
                  {ONBOARDING_BADGE[org.onboardingStatus].label}
                  {org.onboardingStatus === "en_cours" && org.onboardingStep && ` (${org.onboardingStep})`}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex flex-wrap items-center gap-4">
              {org.email && (
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                  {org.email}
                </span>
              )}
              {org.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                  {org.phone}
                </span>
              )}
              {org.address && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                  {org.address}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                Inscrite le {new Date(org.createdAt).toLocaleDateString("fr-FR")}
              </span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 md:justify-end">
          <button
            onClick={() => setIsResetOnboardingOpen(true)}
            className="inline-flex items-center gap-2 whitespace-nowrap px-3.5 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground text-xs font-semibold border border-border transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Relancer l&apos;onboarding</span>
          </button>
          <button
            onClick={() => setIsEditOpen(true)}
            className="inline-flex items-center gap-2 whitespace-nowrap px-3.5 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground text-xs font-semibold border border-border transition-all"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Modifier</span>
          </button>
          <button
            onClick={() => setIsSuspendOpen(true)}
            className={`inline-flex items-center gap-2 whitespace-nowrap px-3.5 py-2 rounded-lg text-xs font-semibold shadow-sm transition-all ${
              org.status === "actif"
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                : "bg-emerald-600 hover:bg-emerald-500 text-white"
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            <span>{org.status === "actif" ? "Suspendre l'accès" : "Réactiver l'accès"}</span>
          </button>
        </div>
      </Card>

      {/* KPI Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-card border border-border shadow-sm">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Centres</span>
          <div className="flex items-center justify-between mt-2">
            <span className="text-2xl font-bold text-foreground">{org.centers.length}</span>
            <Store className="w-4 h-4 text-primary" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border shadow-sm">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Utilisateurs</span>
          <div className="flex items-center justify-between mt-2">
            <span className="text-2xl font-bold text-foreground">{org.users.length}</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border shadow-sm">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Apprenants</span>
          <div className="flex items-center justify-between mt-2">
            <span className="text-2xl font-bold text-foreground">{org._count.students}</span>
            <GraduationCap className="w-4 h-4 text-emerald-600" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border shadow-sm">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Filières</span>
          <div className="flex items-center justify-between mt-2">
            <span className="text-2xl font-bold text-foreground">{org._count.formations}</span>
            <BookOpen className="w-4 h-4 text-amber-600" />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-border pb-1">
        {[
          { id: "overview", label: "Vue Générale" },
          { id: "centers", label: `Centres (${org.centers.length})` },
          { id: "users", label: `Équipe & Comptes (${org.users.length})` },
          { id: "subscription", label: "Abonnement & Licence" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === tab.id
                ? "bg-secondary text-foreground shadow-xs font-bold"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6 bg-card border-border rounded-xl shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" />
              Coordonnées et Identité
            </h3>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Identifiant Unique (UUID) :</span>
                <span className="font-mono text-foreground">{org.id}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Nom commercial :</span>
                <span className="font-semibold text-foreground">{org.name}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Email officiel :</span>
                <span className="text-foreground">{org.email || "Non renseigné"}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Téléphone :</span>
                <span className="text-foreground">{org.phone || "Non renseigné"}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Localisation :</span>
                <span className="text-foreground">{org.address || "Non renseignée"}</span>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-card border-border rounded-xl shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-primary" />
              Statut de la Licence
            </h3>
            {org.subscription ? (
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Plan souscrit :</span>
                  <span className="font-bold text-primary">{org.subscription.plan}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Statut de la licence :</span>
                  <span className="font-bold text-emerald-600 uppercase">{org.subscription.status}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Date d'échéance :</span>
                  <span className="text-foreground">{new Date(org.subscription.endDate).toLocaleDateString("fr-FR")}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">Limites autorisées :</span>
                  <span className="text-foreground">
                    Max {org.subscription.maxCenters} centres · Max {org.subscription.maxStudents} apprenants
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground py-6 text-center">
                Aucun contrat d'abonnement actif.
              </p>
            )}
          </Card>
        </div>
      )}

      {/* Tab 2: Centers */}
      {activeTab === "centers" && (
        <Card className="p-6 bg-card border-border rounded-xl shadow-sm">
          <div className="space-y-2.5">
            {org.centers.length === 0 ? (
              <p className="text-xs text-muted-foreground py-8 text-center">
                Aucun centre enregistré pour cette organisation.
              </p>
            ) : (
              org.centers.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-3.5 rounded-lg bg-background border border-border text-xs"
                >
                  <div className="space-y-0.5">
                    <p className="font-bold text-foreground text-sm">{c.name}</p>
                    <p className="text-muted-foreground">{c.address || "Adresse non renseignée"}</p>
                    <p className="text-muted-foreground text-[11px]">
                      {c._count.classes} classe(s) rattachée(s) · {c._count.expenses} dépense(s)
                    </p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                      c.status === "actif"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-muted text-muted-foreground border-border"
                    }`}
                  >
                    {c.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>
      )}

      {/* Tab 3: Users */}
      {activeTab === "users" && (
        <Card className="p-6 bg-card border-border rounded-xl shadow-sm">
          <div className="space-y-2.5">
            {org.users.length === 0 ? (
              <p className="text-xs text-muted-foreground py-8 text-center">
                Aucun utilisateur rattaché pour l'instant.
              </p>
            ) : (
              org.users.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between p-3.5 rounded-lg bg-background border border-border text-xs"
                >
                  <div className="space-y-0.5">
                    <p className="font-bold text-foreground">
                      {u.firstName} {u.lastName}
                    </p>
                    <p className="text-muted-foreground">
                      {u.email} · Matricule: <span className="font-mono text-foreground">{u.matricule}</span>
                    </p>
                    <p className="text-muted-foreground">
                      {u.lastLoginAt ? `Dernière connexion : ${new Date(u.lastLoginAt).toLocaleString("fr-FR")}` : "Jamais connecté"}
                    </p>
                    <div className="flex items-center gap-1 pt-1">
                      {u.roles.map((r) => (
                        <span
                          key={r}
                          className="px-2 py-0.5 rounded bg-secondary text-foreground text-[10px] font-semibold border border-border"
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                      u.status === "actif"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-rose-50 text-rose-700 border-rose-200"
                    }`}
                  >
                    {u.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>
      )}

      {/* Tab 4: Subscription */}
      {activeTab === "subscription" && (
        <Card className="p-6 bg-card border-border rounded-xl shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              Contrat de Licence & Quotas
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Détails de l'abonnement SaaS souscrit par cette organisation
            </p>
          </div>

          {org.subscription ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-background border border-border">
                <span className="text-[11px] text-muted-foreground">Formule</span>
                <p className="text-lg font-bold text-foreground mt-1">{org.subscription.plan}</p>
                <p className="text-[11px] text-primary mt-0.5">Accès plateforme complet</p>
              </div>

              <div className="p-4 rounded-xl bg-background border border-border">
                <span className="text-[11px] text-muted-foreground">Période de Validité</span>
                <p className="text-xs font-semibold text-foreground mt-2">
                  Du {new Date(org.subscription.startDate).toLocaleDateString("fr-FR")}
                </p>
                <p className="text-xs font-semibold text-foreground">
                  Au {new Date(org.subscription.endDate).toLocaleDateString("fr-FR")}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-background border border-border">
                <span className="text-[11px] text-muted-foreground">Capacités & Quotas</span>
                <p className="text-xs font-semibold text-foreground mt-2">
                  Max Centres : <span className="font-bold text-primary">{org.subscription.maxCenters}</span>
                </p>
                <p className="text-xs font-semibold text-foreground">
                  Max Apprenants : <span className="font-bold text-primary">{org.subscription.maxStudents}</span>
                </p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground py-8 text-center">
              Aucun abonnement configuré.
            </p>
          )}
        </Card>
      )}

      {/* Edit & Suspend Modals */}
      <OrganizationModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        initialData={org}
        onSuccess={() => mutate()}
      />

      <SuspendOrganizationModal
        isOpen={isSuspendOpen}
        onClose={() => setIsSuspendOpen(false)}
        organization={org}
        onSuccess={() => mutate()}
      />

      <ResetOnboardingModal
        isOpen={isResetOnboardingOpen}
        onClose={() => setIsResetOnboardingOpen(false)}
        organization={org}
        onSuccess={() => mutate()}
      />
    </div>
  );
}
