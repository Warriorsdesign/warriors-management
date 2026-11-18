"use client";

import React, { useState } from "react";
import { Building, Plus } from "lucide-react";
import { useCenters, createCenter } from "@/lib/hooks/useCenters";
import { ApiClientError, revalidateResource } from "@/lib/api/client";
import { useUIStore } from "@/lib/store/useUIStore";
import type { OnboardingStateDTO } from "@/lib/api/types";
import { CreatedList, Field, QuotaNote, StepHeader, inputClass, primaryButtonClass } from "../shared";

export function CentersStep({ limits }: { limits: OnboardingStateDTO["limits"] }) {
  const { centers, isLoading } = useCenters();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const max = limits?.maxCenters;
  const reached = max !== undefined && max !== -1 && centers.length >= max;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError("Veuillez renseigner le nom du centre.");
    setIsSubmitting(true);
    try {
      await createCenter({ name: name.trim(), address: address.trim() || undefined, status: "actif" });
      await revalidateResource("/api/onboarding");
      setName("");
      setAddress("");
      useUIStore.getState().showToast("Le centre a été créé avec succès.", "success");
    } catch (err) {
      useUIStore.getState().showToast(err instanceof ApiClientError ? err.message : "Une erreur est survenue.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <StepHeader
        icon={Building}
        title="Vos centres de formation"
        description="Un centre est un site physique où se déroulent vos formations. Vos classes, dépenses et utilisateurs y seront rattachés."
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Ajouter un centre</h3>
          <Field label="Nom du centre" error={error}>
            <input
              type="text"
              value={name}
              disabled={reached}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError("");
              }}
              className={inputClass(!!error)}
              placeholder="Ex : Centre de Formation Douala"
            />
          </Field>
          <Field label="Adresse (optionnel)">
            <input
              type="text"
              value={address}
              disabled={reached}
              onChange={(e) => setAddress(e.target.value)}
              className={inputClass()}
              placeholder="Ex : Rue Joss, Akwa, Douala"
            />
          </Field>
          <QuotaNote used={centers.length} max={max} noun="centres" />
          <div className="flex justify-end">
            <button type="submit" disabled={isSubmitting || reached} className={primaryButtonClass}>
              <Plus className="w-4 h-4" /> {isSubmitting ? "Enregistrement..." : "Ajouter le centre"}
            </button>
          </div>
        </form>
        <CreatedList
          title="Centres configurés"
          isLoading={isLoading}
          emptyText="Aucun centre pour le moment. Exemples : Centre Akwa, Centre Yaoundé, Centre Bafoussam."
          items={centers.map((c) => ({ id: c.id, label: c.name, detail: c.address ?? undefined }))}
        />
      </div>
    </div>
  );
}
