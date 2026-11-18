"use client";

import React, { useState, useEffect } from "react";
import useSWR from "swr";
import { Modal } from "@/components/ui/modal";
import { apiFetch, ApiClientError } from "@/lib/api/client";
import { useUIStore } from "@/lib/store/useUIStore";
import { CreditCard, Calendar, Users, Store, Loader2, Info } from "lucide-react";

interface Plan {
  id: string;
  name: string;
  maxCenters: number;
  maxStudents: number;
}

interface EditSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  subscription: {
    id: string;
    plan: string;
    planId?: string | null;
    status: string;
    endDate: string;
    maxCenters: number;
    maxStudents: number;
    organization: {
      id: string;
      name: string;
    };
  } | null;
}

export function EditSubscriptionModal({
  isOpen,
  onClose,
  onSuccess,
  subscription,
}: EditSubscriptionModalProps) {
  const showToast = useUIStore((state) => state.showToast);

  const { data: plans } = useSWR<Plan[]>("/api/admin/plans");

  const [planId, setPlanId] = useState(subscription?.planId || "");
  const [status, setStatus] = useState(subscription?.status || "active");
  const [endDate, setEndDate] = useState(
    subscription?.endDate ? new Date(subscription.endDate).toISOString().split("T")[0] : ""
  );
  const [maxCenters, setMaxCenters] = useState(subscription?.maxCenters || 3);
  const [maxStudents, setMaxStudents] = useState(subscription?.maxStudents || 200);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (subscription) {
      setPlanId(subscription.planId || "");
      setStatus(subscription.status || "active");
      setEndDate(subscription.endDate ? new Date(subscription.endDate).toISOString().split("T")[0] : "");
      setMaxCenters(subscription.maxCenters || 3);
      setMaxStudents(subscription.maxStudents || 200);
    }
  }, [subscription]);

  const handlePlanChange = (newPlanId: string) => {
    setPlanId(newPlanId);
    const selectedPlan = plans?.find(p => p.id === newPlanId);
    if (selectedPlan) {
      setMaxCenters(selectedPlan.maxCenters);
      setMaxStudents(selectedPlan.maxStudents);
    }
  };

  if (!subscription) return null;

  const handleProlong = (days: number) => {
    const current = endDate ? new Date(endDate) : new Date();
    current.setDate(current.getDate() + days);
    setEndDate(current.toISOString().split("T")[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    try {
      await apiFetch("/api/admin/subscriptions", {
        method: "PATCH",
        body: JSON.stringify({
          id: subscription.id,
          planId: planId || undefined,
          status,
          endDate: new Date(endDate).toISOString(),
          maxCenters: Number(maxCenters),
          maxStudents: Number(maxStudents),
        }),
      });

      showToast("Abonnement mis à jour avec succès.", "success");
      onSuccess();
      onClose();
    } catch (err) {
      setErrorMsg(
        err instanceof ApiClientError ? err.message : "Une erreur est survenue."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Abonnement · ${subscription.organization.name}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 text-xs text-rose-300 bg-rose-950/40 border border-rose-800/60 rounded-lg">
            {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Formule / Plan</label>
            <select
              value={planId}
              onChange={(e) => handlePlanChange(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:border-primary"
            >
              <option value="" disabled>Sélectionner un plan</option>
              {plans?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Statut du contrat</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:border-primary"
            >
              <option value="active">Actif</option>
              <option value="trial">Essai (Trial)</option>
              <option value="expired">Expiré</option>
              <option value="suspended">Suspendu</option>
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">Date d'échéance</label>
          <div className="relative">
            <Calendar className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="date"
              required
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:border-primary"
            />
          </div>
          {/* Quick extension shortcuts */}
          <div className="flex items-center gap-2 pt-1">
            <span className="text-[11px] text-muted-foreground">Prolonger rapidement :</span>
            <button
              type="button"
              onClick={() => handleProlong(30)}
              className="px-2 py-0.5 rounded bg-muted hover:bg-muted/80 text-foreground text-[10px] font-semibold border border-border transition-colors"
            >
              +30 Jours
            </button>
            <button
              type="button"
              onClick={() => handleProlong(90)}
              className="px-2 py-0.5 rounded bg-muted hover:bg-muted/80 text-foreground text-[10px] font-semibold border border-border transition-colors"
            >
              +3 Mois
            </button>
            <button
              type="button"
              onClick={() => handleProlong(365)}
              className="px-2 py-0.5 rounded bg-muted hover:bg-muted/80 text-foreground text-[10px] font-semibold border border-border transition-colors"
            >
              +1 An
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Store className="w-3 h-3 text-primary" />
              <span>Centres max autorisés</span>
            </label>
            <div className="relative">
              <input
                type={maxCenters === -1 ? "text" : "number"}
                min={1}
                value={maxCenters === -1 ? "Illimité" : maxCenters}
                disabled={true}
                onChange={(e) => setMaxCenters(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:border-primary disabled:opacity-70 disabled:bg-muted/50 cursor-not-allowed"
              />
              {maxCenters === -1 && (
                 <Info className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              )}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Users className="w-3 h-3 text-primary" />
              <span>Apprenants max</span>
            </label>
             <div className="relative">
              <input
                type={maxStudents === -1 ? "text" : "number"}
                min={10}
                value={maxStudents === -1 ? "Illimité" : maxStudents}
                disabled={true}
                onChange={(e) => setMaxStudents(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:border-primary disabled:opacity-70 disabled:bg-muted/50 cursor-not-allowed"
              />
              {maxStudents === -1 && (
                 <Info className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>Mettre à jour la licence</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
