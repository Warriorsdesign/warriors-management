"use client";

import React, { useState } from "react";
import { Copy, KeyRound, Plus, UserPlus } from "lucide-react";
import { useUsers, createUser } from "@/lib/hooks/useUsers";
import { useRoles } from "@/lib/hooks/useRoles";
import { useCenters } from "@/lib/hooks/useCenters";
import { ApiClientError, revalidateResource } from "@/lib/api/client";
import { useUIStore } from "@/lib/store/useUIStore";
import type { Role } from "@/lib/types/enums";
import { Select } from "@/components/ui/select";
import { MultiSelect } from "@/components/ui/multi-select";
import { Modal } from "@/components/ui/modal";
import { CreatedList, Field, StepHeader, inputClass, primaryButtonClass } from "../shared";

const EMPTY = { firstName: "", lastName: "", email: "", role: "", centerIds: [] as string[] };

export function UsersStep() {
  const { users, isLoading } = useUsers();
  const { roles } = useRoles();
  const { centers } = useCenters();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [created, setCreated] = useState<{ name: string; matricule: string; password: string } | null>(null);

  const update = (patch: Partial<typeof EMPTY>) => {
    setForm((f) => ({ ...f, ...patch }));
    setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!form.firstName.trim()) next.firstName = "Le prénom est requis.";
    if (!form.lastName.trim()) next.lastName = "Le nom est requis.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = "Email invalide.";
    if (!form.role) next.role = "Le rôle est requis.";
    if (Object.keys(next).length) return setErrors(next);

    setIsSubmitting(true);
    try {
      const { user, provisionalPassword } = await createUser({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        // Les rôles personnalisés de l'organisation sont aussi acceptés par l'API.
        roles: [form.role as Role],
        centerIds: form.centerIds,
      });
      await revalidateResource("/api/onboarding");
      setCreated({ name: `${user.firstName} ${user.lastName}`, matricule: user.matricule ?? "", password: provisionalPassword });
      setForm(EMPTY);
    } catch (err) {
      useUIStore.getState().showToast(err instanceof ApiClientError ? err.message : "Une erreur est survenue.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <StepHeader
        icon={UserPlus}
        title="Votre équipe"
        description="Invitez les personnes qui utiliseront Warriors Management. Le rôle détermine ce que chacun peut voir et modifier (gérable ensuite dans Paramètres > Rôles)."
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Ajouter un utilisateur</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Prénom" error={errors.firstName}>
              <input type="text" value={form.firstName} onChange={(e) => update({ firstName: e.target.value })} className={inputClass(!!errors.firstName)} placeholder="Ex : Awa" />
            </Field>
            <Field label="Nom" error={errors.lastName}>
              <input type="text" value={form.lastName} onChange={(e) => update({ lastName: e.target.value })} className={inputClass(!!errors.lastName)} placeholder="Ex : Fotso" />
            </Field>
          </div>
          <Field label="Email" error={errors.email}>
            <input type="email" value={form.email} onChange={(e) => update({ email: e.target.value })} className={inputClass(!!errors.email)} placeholder="Ex : awa.fotso@moncentre.cm" />
          </Field>
          <Field label="Rôle" error={errors.role}>
            <Select
              value={form.role}
              onChange={(v) => update({ role: v })}
              placeholder="Sélectionner un rôle"
              options={roles.map((r) => ({ label: r.name, value: r.name }))}
            />
          </Field>
          {centers.length > 0 && (
            <Field label="Centres (optionnel)">
              <MultiSelect
                label="Tous les centres"
                options={centers.map((c) => ({ label: c.name, value: c.id }))}
                selectedValues={form.centerIds}
                onChange={(values) => update({ centerIds: values })}
                className="w-full"
              />
            </Field>
          )}
          <div className="flex justify-end">
            <button type="submit" disabled={isSubmitting} className={primaryButtonClass}>
              <Plus className="w-4 h-4" /> {isSubmitting ? "Enregistrement..." : "Créer le compte"}
            </button>
          </div>
        </form>
        <CreatedList
          title="Utilisateurs de l'organisation"
          isLoading={isLoading}
          emptyText="Aucun utilisateur."
          items={users.map((u) => ({ id: u.id, label: `${u.firstName} ${u.lastName}`, detail: `${u.roles.join(", ")} · ${u.matricule ?? u.email}` }))}
        />
      </div>

      <Modal isOpen={created !== null} onClose={() => setCreated(null)} title="Compte créé avec succès">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Transmettez ces identifiants à <span className="font-semibold text-foreground">{created?.name}</span>. Le mot de passe provisoire ne sera plus affiché ; il devra être changé à la première connexion.
          </p>
          <div className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-2 items-center rounded-lg border border-border bg-secondary/30 p-4">
            <span className="text-xs text-muted-foreground">Matricule</span>
            <span className="text-sm font-bold text-foreground font-mono">{created?.matricule}</span>
            <span className="text-xs text-muted-foreground flex items-center gap-1"><KeyRound className="w-3 h-3" /> Mot de passe</span>
            <span className="flex items-center gap-2">
              <span className="text-sm font-bold text-foreground font-mono">{created?.password}</span>
              <button
                type="button"
                onClick={() => {
                  if (created?.password) {
                    navigator.clipboard.writeText(created.password);
                    useUIStore.getState().showToast("Mot de passe copié", "success");
                  }
                }}
                className="p-1 text-muted-foreground hover:text-foreground hover:bg-secondary rounded transition-colors"
              >
                <Copy className="w-4 h-4" />
              </button>
            </span>
          </div>
          <div className="flex justify-end">
            <button type="button" onClick={() => setCreated(null)} className={primaryButtonClass}>J’ai noté les identifiants</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
