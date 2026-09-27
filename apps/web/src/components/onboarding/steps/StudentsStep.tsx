"use client";

import React, { useState } from "react";
import { FileSpreadsheet, GraduationCap, Info, Plus, UserPlus } from "lucide-react";
import { useStudents, createStudent } from "@/lib/hooks/useStudents";
import { useClasses } from "@/lib/hooks/useClasses";
import { useCenters } from "@/lib/hooks/useCenters";
import { useFormations } from "@/lib/hooks/useFormations";
import { ApiClientError, revalidateResource } from "@/lib/api/client";
import { useUIStore } from "@/lib/store/useUIStore";
import type { OnboardingStateDTO } from "@/lib/api/types";
import type { Gender, IntervalType, PaymentMethod } from "@/lib/types/enums";
import { Select } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { ImportWizard } from "@/components/import/ImportWizard";
import { cn } from "@/lib/utils";
import { CreatedList, Field, QuotaNote, StepHeader, inputClass, primaryButtonClass } from "../shared";

const PAYMENT_METHODS: PaymentMethod[] = ["Espèces", "Mobile Money", "Virement", "Chèque"];
const INTERVALS: { label: string; value: IntervalType }[] = [
  { label: "1 semaine", value: "1_semaine" }, { label: "2 semaines", value: "2_semaines" },
  { label: "1 mois", value: "1_mois" }, { label: "2 mois", value: "2_mois" },
  { label: "3 mois", value: "3_mois" }, { label: "4 mois", value: "4_mois" },
];

const EMPTY = {
  lastName: "", firstName: "", gender: "Male" as Gender, contact: "", email: "", classId: "", currentLevel: "",
  enrollmentDate: new Date() as Date | undefined, registrationFee: "", paymentMethod: "Espèces" as PaymentMethod,
  installmentsCount: "", installmentInterval: "1_mois" as IntervalType,
};

type Mode = "import" | "manual";

export function StudentsStep({ limits, studentCount }: { limits: OnboardingStateDTO["limits"]; studentCount: number }) {
  const { data: students, meta, isLoading } = useStudents({ page: 1, pageSize: 8 });
  const { classes } = useClasses();
  const { centers } = useCenters();
  const { formations } = useFormations();
  const [mode, setMode] = useState<Mode>("import");
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedClass = classes.find((c) => c.id === form.classId);
  const selectedFormation = formations.find((f) => f.id === selectedClass?.formationId);
  const centerName = (id: string) => centers.find((c) => c.id === id)?.name ?? "";

  const update = (patch: Partial<typeof EMPTY>) => {
    setForm((f) => ({ ...f, ...patch }));
    setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    const registrationFee = form.registrationFee ? Number(form.registrationFee) : 0;
    const installmentsCount = form.installmentsCount ? parseInt(form.installmentsCount, 10) : 0;
    if (!form.lastName.trim()) next.lastName = "Le nom est requis.";
    if (!form.firstName.trim()) next.firstName = "Le prénom est requis.";
    if (!form.contact.trim()) next.contact = "Le contact est requis.";
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = "Email invalide.";
    if (!form.classId) next.classId = "La classe est requise.";
    if (!form.enrollmentDate) next.enrollmentDate = "La date d'inscription est requise.";
    if (Number.isNaN(registrationFee) || registrationFee < 0) next.registrationFee = "Montant invalide.";
    if (selectedFormation && registrationFee > selectedFormation.totalCost) next.registrationFee = "Supérieur au coût de la formation.";
    if (Number.isNaN(installmentsCount) || installmentsCount < 0) next.installmentsCount = "Nombre invalide.";
    if (Object.keys(next).length) return setErrors(next);

    setIsSubmitting(true);
    try {
      await createStudent({
        lastName: form.lastName.trim(),
        firstName: form.firstName.trim(),
        gender: form.gender,
        contact: form.contact.trim(),
        email: form.email.trim() || undefined,
        classId: form.classId,
        currentLevel: form.currentLevel || undefined,
        enrollmentDate: form.enrollmentDate!.toISOString(),
        registrationFee,
        paymentMethod: form.paymentMethod,
        installmentsCount,
        installmentInterval: form.installmentInterval,
      });
      await revalidateResource("/api/onboarding");
      setForm({ ...EMPTY, classId: form.classId });
      useUIStore.getState().showToast("L'étudiant a été inscrit avec succès.", "success");
    } catch (err) {
      useUIStore.getState().showToast(err instanceof ApiClientError ? err.message : "Une erreur est survenue.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <StepHeader
        icon={GraduationCap}
        title="Vos étudiants"
        description="Inscrivez vos premiers apprenants. Chaque étudiant est rattaché à une classe et reçoit automatiquement son échéancier de paiement."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {([
          { key: "import", icon: FileSpreadsheet, title: "Vous avez déjà vos données ?", text: "Importez-les depuis Excel et évitez la saisie manuelle." },
          { key: "manual", icon: UserPlus, title: "Ajouter manuellement", text: "Saisissez vos étudiants un par un." },
        ] as const).map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => setMode(option.key)}
            className={cn(
              "flex items-start gap-3 text-left rounded-xl border p-4 transition-all",
              mode === option.key ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border bg-card hover:border-primary/50 hover:shadow-md"
            )}
          >
            <option.icon className={cn("w-5 h-5 mt-0.5 shrink-0", mode === option.key ? "text-primary" : "text-muted-foreground")} />
            <span>
              <span className="block text-sm font-semibold text-foreground">{option.title}</span>
              <span className="block text-xs text-muted-foreground mt-0.5">{option.text}</span>
            </span>
          </button>
        ))}
      </div>

      <QuotaNote used={studentCount} max={limits?.maxStudents} noun="étudiants" />

      {classes.length === 0 && (
        <div className="flex gap-2 p-3 text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-md">
          <Info className="w-4 h-4 mt-0.5 shrink-0" />
          <span>
            Chaque étudiant doit appartenir à une classe. Créez vos classes à l’étape précédente, ou importez successivement
            vos formations, puis vos classes, puis vos étudiants ci-dessous.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        <div className="lg:col-span-3 rounded-xl border border-border bg-card p-5">
          {mode === "import" ? (
            <ImportWizard types={["students", "classes", "formations"]} defaultType={classes.length === 0 ? "formations" : "students"} />
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Nom" error={errors.lastName}>
                  <input type="text" value={form.lastName} onChange={(e) => update({ lastName: e.target.value })} className={inputClass(!!errors.lastName)} placeholder="Ex : Mbarga" />
                </Field>
                <Field label="Prénom" error={errors.firstName}>
                  <input type="text" value={form.firstName} onChange={(e) => update({ firstName: e.target.value })} className={inputClass(!!errors.firstName)} placeholder="Ex : Jean-Paul" />
                </Field>
                <Field label="Genre">
                  <Select value={form.gender} onChange={(v) => update({ gender: v as Gender })} options={[{ label: "Masculin", value: "Male" }, { label: "Féminin", value: "Female" }]} />
                </Field>
                <Field label="Contact" error={errors.contact}>
                  <input type="tel" value={form.contact} onChange={(e) => update({ contact: e.target.value })} className={inputClass(!!errors.contact)} placeholder="Ex : 699 11 22 33" />
                </Field>
                <Field label="Email (optionnel)" error={errors.email} className="sm:col-span-2">
                  <input type="email" value={form.email} onChange={(e) => update({ email: e.target.value })} className={inputClass(!!errors.email)} placeholder="Ex : jp.mbarga@gmail.com" />
                </Field>
                <Field label="Classe" error={errors.classId}>
                  <Select
                    value={form.classId}
                    onChange={(v) => update({ classId: v, currentLevel: "" })}
                    placeholder="Sélectionner une classe"
                    isSearchable
                    options={classes.map((c) => ({ label: `${c.name} (${centerName(c.centerId)})`, value: c.id }))}
                  />
                </Field>
                {selectedFormation?.hasLevels ? (
                  <Field label="Niveau initial">
                    <Select value={form.currentLevel} onChange={(v) => update({ currentLevel: v })} placeholder="Sélectionner un niveau" options={selectedFormation.levels.map((l) => ({ label: l.name, value: l.id }))} />
                  </Field>
                ) : (
                  <div className="hidden sm:block" />
                )}
                <Field label="Date d'inscription" error={errors.enrollmentDate}>
                  <DatePicker value={form.enrollmentDate} onChange={(d) => update({ enrollmentDate: d })} />
                </Field>
                <Field label="Frais d'inscription payés (FCFA)" error={errors.registrationFee}>
                  <input type="number" min={0} value={form.registrationFee} onChange={(e) => update({ registrationFee: e.target.value })} className={inputClass(!!errors.registrationFee)} placeholder="0" />
                </Field>
                <Field label="Mode de paiement">
                  <Select value={form.paymentMethod} onChange={(v) => update({ paymentMethod: v as PaymentMethod })} options={PAYMENT_METHODS.map((m) => ({ label: m, value: m }))} />
                </Field>
                <Field label="Nombre d'échéances" error={errors.installmentsCount}>
                  <input type="number" min={0} value={form.installmentsCount} onChange={(e) => update({ installmentsCount: e.target.value })} className={inputClass(!!errors.installmentsCount)} placeholder="0" />
                </Field>
                <Field label="Intervalle des échéances">
                  <Select value={form.installmentInterval} onChange={(v) => update({ installmentInterval: v as IntervalType })} options={INTERVALS} />
                </Field>
              </div>
              <div className="flex justify-end">
                <button type="submit" disabled={isSubmitting || classes.length === 0} className={primaryButtonClass}>
                  <Plus className="w-4 h-4" /> {isSubmitting ? "Enregistrement..." : "Inscrire l'étudiant"}
                </button>
              </div>
            </form>
          )}
        </div>
        <div className="lg:col-span-2">
          <CreatedList
            title={`Étudiants inscrits${meta && meta.total > students.length ? ` (${students.length} derniers)` : ""}`}
            isLoading={isLoading}
            emptyText="Aucun étudiant pour le moment."
            items={students.map((s) => ({ id: s.id, label: `${s.firstName} ${s.lastName}`, detail: `${s.matricule} · ${s.contact}` }))}
          />
          {meta && meta.total > students.length && (
            <p className="text-xs text-muted-foreground mt-2 text-right">{new Intl.NumberFormat("fr-FR").format(meta.total)} étudiants au total</p>
          )}
        </div>
      </div>
    </div>
  );
}
