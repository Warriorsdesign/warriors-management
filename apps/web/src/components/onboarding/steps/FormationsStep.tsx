"use client";

import React, { useEffect, useState } from "react";
import { FileSpreadsheet, Layers, Plus } from "lucide-react";
import { useFormations, createFormation } from "@/lib/hooks/useFormations";
import { useCenters } from "@/lib/hooks/useCenters";
import { FormationCentersField, defaultFormationCenters } from "@/components/formations/FormationCentersField";
import { ApiClientError, revalidateResource } from "@/lib/api/client";
import { useUIStore } from "@/lib/store/useUIStore";
import { Modal } from "@/components/ui/modal";
import { ImportWizard } from "@/components/import/ImportWizard";
import { CreatedList, Field, StepHeader, inputClass, primaryButtonClass, secondaryButtonClass } from "../shared";

const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(n);
const EMPTY = { name: "", duration: "", totalCost: "", hasLevels: false, levelCount: "" };

export function FormationsStep() {
  const { formations, isLoading } = useFormations();
  const { centers } = useCenters();
  const [centerIds, setCenterIds] = useState<string[]>([]);
  // Un seul centre créé à l'étape précédente : pré-sélectionné.
  useEffect(() => {
    if (centerIds.length === 0) setCenterIds(defaultFormationCenters(centers));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [centers]);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);

  const update = (patch: Partial<typeof EMPTY>) => {
    setForm((f) => ({ ...f, ...patch }));
    setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    const duration = parseInt(form.duration, 10);
    const totalCost = Number(form.totalCost.replace(/\s/g, ""));
    const levelCount = parseInt(form.levelCount, 10);
    if (!form.name.trim()) next.name = "Veuillez renseigner le nom de la formation.";
    if (!duration || duration <= 0) next.duration = "Durée invalide.";
    if (form.totalCost === "" || Number.isNaN(totalCost) || totalCost < 0) next.totalCost = "Coût total invalide.";
    if (form.hasLevels && (!levelCount || levelCount <= 0)) next.levelCount = "Nombre de niveaux invalide.";
    if (centerIds.length === 0) next.centerIds = "Veuillez choisir au moins un centre.";
    if (Object.keys(next).length) return setErrors(next);

    setIsSubmitting(true);
    try {
      await createFormation({
        name: form.name.trim(),
        duration,
        totalCost,
        hasLevels: form.hasLevels,
        levelCount: form.hasLevels ? levelCount : undefined,
        centerIds,
      });
      await revalidateResource("/api/onboarding");
      setForm(EMPTY);
      setCenterIds(defaultFormationCenters(centers));
      useUIStore.getState().showToast("La formation a été créée avec succès.", "success");
    } catch (err) {
      useUIStore.getState().showToast(err instanceof ApiClientError ? err.message : "Une erreur est survenue.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <StepHeader
          icon={Layers}
          title="Vos formations"
          description="Les programmes que vous proposez, avec leur durée et leur coût. Le coût sert de base aux échéanciers de paiement des étudiants."
        />
        <button type="button" onClick={() => setIsImportOpen(true)} className={secondaryButtonClass}>
          <FileSpreadsheet className="w-4 h-4" /> Importer depuis Excel
        </button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Ajouter une formation</h3>
          <Field label="Nom de la formation" error={errors.name}>
            <input type="text" value={form.name} onChange={(e) => update({ name: e.target.value })} className={inputClass(!!errors.name)} placeholder="Ex : Formation en Comptabilité" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Durée (mois)" error={errors.duration}>
              <input type="number" min={1} value={form.duration} onChange={(e) => update({ duration: e.target.value })} className={inputClass(!!errors.duration)} placeholder="Ex : 12" />
            </Field>
            <Field label="Coût total (FCFA)" error={errors.totalCost}>
              <input type="number" min={0} value={form.totalCost} onChange={(e) => update({ totalCost: e.target.value })} className={inputClass(!!errors.totalCost)} placeholder="Ex : 350000" />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
            <input type="checkbox" checked={form.hasLevels} onChange={(e) => update({ hasLevels: e.target.checked })} className="rounded border-border accent-[var(--primary)]" />
            Formation découpée en niveaux
          </label>
          {form.hasLevels && (
            <Field label="Nombre de niveaux" error={errors.levelCount}>
              <input type="number" min={1} value={form.levelCount} onChange={(e) => update({ levelCount: e.target.value })} className={inputClass(!!errors.levelCount)} placeholder="Ex : 3" />
            </Field>
          )}
          <FormationCentersField
            centers={centers}
            value={centerIds}
            locked={false}
            error={errors.centerIds}
            onChange={(ids) => {
              setCenterIds(ids);
              setErrors({});
            }}
          />
          <div className="flex justify-end">
            <button type="submit" disabled={isSubmitting} className={primaryButtonClass}>
              <Plus className="w-4 h-4" /> {isSubmitting ? "Enregistrement..." : "Ajouter la formation"}
            </button>
          </div>
        </form>
        <CreatedList
          title="Formations configurées"
          isLoading={isLoading}
          emptyText="Aucune formation pour le moment. Exemples : Informatique, Comptabilité, Marketing Digital, Gestion."
          items={formations.map((f) => ({
            id: f.id,
            label: f.name,
            detail: `${f.duration} mois · ${fmt(f.totalCost)} FCFA${f.hasLevels ? ` · ${f.levelCount} niveau(x)` : ""} · ${f.centers.map((c) => c.name).join(", ")}`,
          }))}
        />
      </div>

      <Modal isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} title="Importer des formations" className="sm:max-w-3xl">
        <ImportWizard types={["formations"]} />
      </Modal>
    </div>
  );
}
