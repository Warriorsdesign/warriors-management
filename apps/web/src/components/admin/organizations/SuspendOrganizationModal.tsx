"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { apiFetch, ApiClientError } from "@/lib/api/client";
import { useUIStore } from "@/lib/store/useUIStore";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";

interface SuspendOrganizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  organization: {
    id: string;
    name: string;
    status: string;
  } | null;
}

export function SuspendOrganizationModal({
  isOpen,
  onClose,
  onSuccess,
  organization,
}: SuspendOrganizationModalProps) {
  const showToast = useUIStore((state) => state.showToast);
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!organization) return null;

  const isSuspending = organization.status === "actif";
  const targetStatus = isSuspending ? "suspendu" : "actif";

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    try {
      await apiFetch(`/api/admin/organizations/${organization.id}/status`, {
        method: "POST",
        body: JSON.stringify({
          status: targetStatus,
          reason,
        }),
      });

      showToast(
        isSuspending
          ? `L'organisation "${organization.name}" a été suspendue.`
          : `L'organisation "${organization.name}" a été réactivée.`,
        "success"
      );

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
      title={
        isSuspending
          ? "Confirmation de Suspension d'Organisation"
          : "Réactivation d'Organisation"
      }
    >
      <form onSubmit={handleConfirm} className="space-y-4">
        <div
          className={`p-4 rounded-xl border flex items-start gap-3 ${
            isSuspending
              ? "bg-rose-50 border-rose-200 text-rose-800"
              : "bg-emerald-50 border-emerald-200 text-emerald-800"
          }`}
        >
          {isSuspending ? (
            <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          )}
          <div className="text-xs space-y-1">
            <p className="font-semibold">
              {isSuspending
                ? `Vous êtes sur le point de suspendre "${organization.name}".`
                : `Vous êtes sur le point de réactiver "${organization.name}".`}
            </p>
            <p className="opacity-90 leading-relaxed">
              {isSuspending
                ? "Tous les administrateurs et utilisateurs de cette organisation ne pourront plus se connecter à la plateforme. Les données restent conservées de manière sécurisée."
                : "Les utilisateurs de cette organisation retrouveront immédiatement l'accès à leur tableau de bord et à leurs centres."}
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg">
            {errorMsg}
          </div>
        )}

        <div className="space-y-1">
          <label className="text-xs font-semibold text-foreground">
            Motif de l'opération (consigné dans l'audit) *
          </label>
          <textarea
            required
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={
              isSuspending
                ? "Ex: Défaut de paiement de l'abonnement ou demande explicite du client..."
                : "Ex: Régularisation de paiement confirmée..."
            }
            className="w-full p-3 bg-background border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className={`px-4 py-2 text-white text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center gap-2 ${
              isSuspending
                ? "bg-destructive hover:bg-destructive/90"
                : "bg-emerald-600 hover:bg-emerald-500"
            }`}
          >
            {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{isSuspending ? "Confirmer la Suspension" : "Confirmer la Réactivation"}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
