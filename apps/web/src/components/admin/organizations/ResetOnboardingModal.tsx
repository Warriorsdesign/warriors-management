"use client";

import React, { useState } from "react";
import { RotateCcw } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { apiFetch, ApiClientError } from "@/lib/api/client";

interface ResetOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  organization: { id: string; name: string };
  onSuccess: () => void;
}

/** Relance l'assistant de configuration côté client ; aucune donnée de l'organisation n'est supprimée. */
export function ResetOnboardingModal({ isOpen, onClose, organization, onSuccess }: ResetOnboardingModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleConfirm = async () => {
    setIsSubmitting(true);
    setError("");
    try {
      await apiFetch(`/api/admin/organizations/${organization.id}/onboarding`, { method: "POST", body: JSON.stringify({}) });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Une erreur est survenue.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={() => !isSubmitting && onClose()} title="Relancer l'onboarding">
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <RotateCcw className="w-5 h-5" />
          </div>
          <p className="text-sm text-muted-foreground">
            L’assistant de configuration sera de nouveau proposé aux administrateurs de{" "}
            <span className="font-semibold text-foreground">{organization.name}</span> à leur prochaine connexion. Les données
            existantes (centres, formations, classes, utilisateurs, étudiants) sont conservées.
          </p>
        </div>
        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">{error}</p>}
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Annuler
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50"
          >
            {isSubmitting ? "Relance..." : "Relancer l'onboarding"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
