"use client";

import React, { useState } from "react";
import { FileSpreadsheet, Info, Plus, Users } from "lucide-react";
import { useClasses, createClass } from "@/lib/hooks/useClasses";
import { useCenters } from "@/lib/hooks/useCenters";
import { useFormations } from "@/lib/hooks/useFormations";
import { ApiClientError, revalidateResource } from "@/lib/api/client";
import { useUIStore } from "@/lib/store/useUIStore";
import { Select } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Modal } from "@/components/ui/modal";
import { ImportWizard } from "@/components/import/ImportWizard";
import { CreatedList, Field, StepHeader, inputClass, primaryButtonClass, secondaryButtonClass } from "../shared";

const EMPTY = { name: "", formationId: "", centerId: "", capacity: "", startDate: undefined as Date | undefined, endDate: undefined as Date | undefined };

export function ClassesStep() {
  const { classes, isLoading } = useClasses();
  const { centers } = useCenters();
  const { formations } = useFormations();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);

  const missingPrereq = centers.length === 0 || formations.length === 0;
  const centerName = (id: string) => centers.find((c) => c.id === id)?.name ?? "";
  const formationName = (id: string) => formations.find((f) => f.id === id)?.name ?? "";

  const update = (patch: Partial<typeof EMPTY>) => {
    setForm((f) => ({ ...f, ...patch }));
    setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    const capacity = parseInt(form.capacity, 10);
    if (!form.name.trim()) next.name = "Le nom est requis.";
    if (!form.formationId) next.formationId = "La formation est requise.";
    if (!form.centerId) next.centerId = "Le centre est requis.";
    if (!capacity || capacity <= 0) next.capacity = "Capacité invalide.";
    if (form.startDate && form.endDate && form.endDate < form.startDate) next.endDate = "La date de fin doit suivre la date de début.";
    if (Object.keys(next).length) return setErrors(next);

    setIsSubmitting(true);
    try {
      await createClass({
        name: form.name.trim(),
        formationId: form.formationId,
        centerId: form.centerId,
        capacity,
        startDate: form.startDate?.toISOString(),
        endDate: form.endDate?.toISOString(),
      });
      await revalidateResource("/api/onboarding");
      setForm({ ...EMPTY, formationId: form.formationId, centerId: form.centerId });
      useUIStore.getState().showToast("La classe a été créée avec succès.", "success");
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
          icon={Users}
          title="Vos classes"
          description="Une classe (cohorte) regroupe des étudiants d'une même formation dans un centre donné, avec une capacité maximale."
        />
        <button type="button" onClick={() => setIsImportOpen(true)} disabled={missingPrereq} className={secondaryButtonClass}>
          <FileSpreadsheet className="w-4 h-4" /> Importer depuis Excel
        </button>
      </div>

      {missingPrereq && (
        <div className="flex gap-2 p-3 text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-md">
          <Info className="w-4 h-4 mt-0.5 shrink-0" />
          <span>
            Une classe est rattachée à une formation et à un centre. Créez d’abord
            {centers.length === 0 && " au moins un centre"}
            {centers.length === 0 && formations.length === 0 && " et"}
            {formations.length === 0 && " au moins une formation"} (étapes précédentes), ou passez cette étape.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Ajouter une classe</h3>
          <Field label="Nom de la classe" error={errors.name}>
            <input type="text" value={form.name} disabled={missingPrereq} onChange={(e) => update({ name: e.target.value })} className={inputClass(!!errors.name)} placeholder="Ex : Informatique - Promo Janvier" />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Formation" error={errors.formationId}>
              <Select
                value={form.formationId}
                disabled={missingPrereq}
                // Le centre est choisi parmi ceux où la formation est proposée.
                onChange={(v) => update({ formationId: v, centerId: formations.find((f) => f.id === v)?.centers[0]?.id ?? "" })}
                placeholder="Sélectionner"
                isSearchable
                options={formations.map((f) => ({ label: f.name, value: f.id }))}
              />
            </Field>
            <Field label="Centre" error={errors.centerId}>
              <Select
                value={form.centerId}
                disabled={missingPrereq || !form.formationId}
                onChange={(v) => update({ centerId: v })}
                placeholder={form.formationId ? "Sélectionner" : "Choisissez d'abord la formation"}
                options={(formations.find((f) => f.id === form.formationId)?.centers ?? []).map((c) => ({ label: c.name, value: c.id }))}
              />
            </Field>
          </div>
          <Field label="Capacité (nombre de places)" error={errors.capacity}>
            <input type="number" min={1} value={form.capacity} disabled={missingPrereq} onChange={(e) => update({ capacity: e.target.value })} className={inputClass(!!errors.capacity)} placeholder="Ex : 30" />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Date de début (optionnel)">
              <DatePicker value={form.startDate} onChange={(d) => update({ startDate: d })} />
            </Field>
            <Field label="Date de fin (optionnel)" error={errors.endDate}>
              <DatePicker value={form.endDate} onChange={(d) => update({ endDate: d })} minDate={form.startDate} align="right" />
            </Field>
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={isSubmitting || missingPrereq} className={primaryButtonClass}>
              <Plus className="w-4 h-4" /> {isSubmitting ? "Enregistrement..." : "Ajouter la classe"}
            </button>
          </div>
        </form>
        <CreatedList
          title="Classes configurées"
          isLoading={isLoading}
          emptyText="Aucune classe pour le moment."
          items={classes.map((c) => ({
            id: c.id,
            label: c.name,
            detail: `${formationName(c.formationId)} · ${centerName(c.centerId)} · ${c.capacity} places`,
          }))}
        />
      </div>

      <Modal isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} title="Importer des classes" className="sm:max-w-3xl">
        <ImportWizard types={["classes"]} />
      </Modal>
    </div>
  );
}
