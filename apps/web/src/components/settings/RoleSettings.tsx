"use client";

import React, { useMemo, useState } from "react";
import { Plus, Edit2, Trash2, Shield, AlertCircle, Copy, RotateCcw, Lock, AlertTriangle, Eye, Users } from "lucide-react";
import { useRoles, createRole, updateRole, deleteRole, resetRole, type Role } from "@/lib/hooks/useRoles";
import { useCan } from "@/lib/hooks/useSession";
import { ApiClientError, revalidateResource } from "@/lib/api/client";
import { useUIStore } from "@/lib/store/useUIStore";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import { emptyGrants, grantsToRows, studentFinanceLevel, type PermissionGrants } from "@/lib/auth/permissionCatalog";
import type { StudentFinanceLevel } from "@/lib/auth/permissionCatalog";
import {
  ACCESS_LABELS,
  EDITOR_SECTIONS,
  FINANCE_LEVEL_LABELS,
  accessLevel,
  grantsFromRows,
  menuPreview,
  sensitiveSummary,
  setAccess,
  setCollect,
  setDashboardFinance,
  setStudentFinance,
  type AccessLevel,
} from "@/lib/auth/roleEditorModel";

type EditorMode = { kind: "create" } | { kind: "edit"; role: Role };

interface EditorState {
  name: string;
  description: string;
  grants: PermissionGrants;
}

function Segmented<T extends string>({
  value,
  options,
  labels,
  onChange,
  disabled,
}: {
  value: T;
  options: T[];
  labels: Record<T, string>;
  onChange: (v: T) => void;
  disabled?: boolean;
}) {
  return (
    <div className={cn("inline-flex rounded-lg border border-border bg-secondary/40 p-0.5", disabled && "opacity-50")}>
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          disabled={disabled}
          onClick={() => onChange(opt)}
          className={cn(
            "px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap",
            value === opt ? "bg-foreground text-background shadow-sm" : "text-muted-foreground hover:text-foreground",
            disabled && "cursor-not-allowed"
          )}
        >
          {labels[opt]}
        </button>
      ))}
    </div>
  );
}

/** Résumé lisible des accès d'un rôle, pour les cartes. */
function roleChips(grants: PermissionGrants): { label: string; tone: "default" | "money" }[] {
  const chips: { label: string; tone: "default" | "money" }[] = [];
  for (const section of EDITOR_SECTIONS) {
    for (const m of section.modules) {
      const level = accessLevel(grants, m.resource);
      if (level === "none") continue;
      chips.push({ label: `${m.label} · ${ACCESS_LABELS[level]}`, tone: section.title === "Finances" ? "money" : "default" });
    }
  }
  const finance = studentFinanceLevel(grants);
  if (finance !== "none") chips.push({ label: `Finances étudiant · ${FINANCE_LEVEL_LABELS[finance]}`, tone: finance === "full" ? "money" : "default" });
  if (grants["students.collect"].write) chips.push({ label: "Encaisse depuis la fiche", tone: "money" });
  if (grants["dashboard.finance"].read) chips.push({ label: "Indicateurs financiers", tone: "money" });
  return chips;
}

export function RoleSettings() {
  const { roles, isLoading, mutate } = useRoles();
  const canWrite = useCan("organization", "write"); // gestion des rôles : administrateur uniquement
  const showToast = useUIStore((state) => state.showToast);

  const [mode, setMode] = useState<EditorMode | null>(null);
  const [form, setForm] = useState<EditorState>({ name: "", description: "", grants: emptyGrants() });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  const [roleToReset, setRoleToReset] = useState<Role | null>(null);

  const refresh = async () => {
    await mutate();
    await revalidateResource("/api/auth/me");
  };

  const openCreate = () => {
    setForm({ name: "", description: "", grants: emptyGrants() });
    setMode({ kind: "create" });
  };

  const openDuplicate = (role: Role) => {
    setForm({
      name: `COPIE DE ${role.name}`.slice(0, 40),
      description: role.description ?? "",
      grants: grantsFromRows(role.permissions),
    });
    setMode({ kind: "create" });
  };

  const openEdit = (role: Role) => {
    setForm({ name: role.name, description: role.description ?? "", grants: grantsFromRows(role.permissions) });
    setMode({ kind: "edit", role });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      showToast("Le nom du rôle est requis.", "error");
      return;
    }
    const payload = { name: form.name, description: form.description, permissions: grantsToRows(form.grants) };
    setIsSubmitting(true);
    try {
      if (mode?.kind === "edit") {
        await updateRole(mode.role.id, mode.role.systemKey ? { description: payload.description, permissions: payload.permissions } : payload);
        showToast("Rôle mis à jour.", "success");
      } else {
        await createRole(payload);
        showToast("Rôle créé.", "success");
      }
      await refresh();
      setMode(null);
    } catch (err) {
      showToast(err instanceof ApiClientError ? err.message : "Une erreur est survenue.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!roleToDelete) return;
    setIsSubmitting(true);
    try {
      await deleteRole(roleToDelete.id);
      showToast("Rôle supprimé.", "success");
      await refresh();
    } catch (err) {
      showToast(err instanceof ApiClientError ? err.message : "Une erreur est survenue.", "error");
    } finally {
      setIsSubmitting(false);
      setRoleToDelete(null);
    }
  };

  const handleReset = async () => {
    if (!roleToReset) return;
    setIsSubmitting(true);
    try {
      await resetRole(roleToReset.id);
      showToast(`Réglages d'origine rétablis pour ${roleToReset.name}.`, "success");
      await refresh();
    } catch (err) {
      showToast(err instanceof ApiClientError ? err.message : "Une erreur est survenue.", "error");
    } finally {
      setIsSubmitting(false);
      setRoleToReset(null);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Chargement des rôles...</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Gestion des Rôles</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Choisissez ce que chaque rôle voit et peut faire. Le centre de rattachement de l&apos;utilisateur limite ensuite où il le fait.
          </p>
        </div>
        {canWrite && (
          <button
            onClick={openCreate}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nouveau rôle
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {roles.map((role) => {
          const grants = grantsFromRows(role.permissions);
          const chips = role.locked ? [{ label: "Tous les droits", tone: "default" as const }] : roleChips(grants);
          return (
            <div key={role.id} className="bg-card border border-border rounded-xl p-5 hover:shadow-sm transition-shadow flex flex-col">
              <div className="flex justify-between items-start gap-3 mb-3">
                <div className="flex items-start gap-2 min-w-0">
                  <div className={cn("p-2 rounded-md shrink-0", role.isSystem ? "bg-amber-100 text-amber-700" : "bg-blue-50 text-blue-600")}>
                    {role.locked ? <Lock className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground flex items-center gap-2 flex-wrap">
                      {role.name}
                      {role.isSystem && (
                        <span className="text-[10px] font-medium bg-secondary text-muted-foreground px-2 py-0.5 rounded-full">Système</span>
                      )}
                    </h3>
                    {role.description && <p className="text-xs text-muted-foreground mt-0.5">{role.description}</p>}
                    <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {role.userCount} utilisateur{role.userCount > 1 ? "s" : ""}
                    </p>
                  </div>
                </div>

                {canWrite && !role.locked && (
                  <div className="flex gap-1 shrink-0">
                    <button title="Modifier" aria-label={`Modifier ${role.name}`} onClick={() => openEdit(role)} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button title="Dupliquer" aria-label={`Dupliquer ${role.name}`} onClick={() => openDuplicate(role)} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-colors">
                      <Copy className="w-4 h-4" />
                    </button>
                    {role.systemKey ? (
                      <button title="Rétablir les réglages d'origine" aria-label={`Rétablir ${role.name}`} onClick={() => setRoleToReset(role)} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-colors">
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    ) : (
                      <button title="Supprimer" aria-label={`Supprimer ${role.name}`} onClick={() => setRoleToDelete(role)} className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-auto pt-4 border-t border-border">
                <div className="flex flex-wrap gap-1.5">
                  {chips.map((c) => (
                    <span
                      key={c.label}
                      className={cn(
                        "text-[10px] px-2 py-1 rounded border",
                        c.tone === "money" ? "bg-amber-50 text-amber-800 border-amber-200" : "bg-secondary/70 text-secondary-foreground border-border/50"
                      )}
                    >
                      {c.label}
                    </span>
                  ))}
                  {chips.length === 0 && <span className="text-[10px] text-muted-foreground italic">Aucun accès</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {mode && (
        <RoleEditorModal
          mode={mode}
          form={form}
          setForm={setForm}
          isSubmitting={isSubmitting}
          onClose={() => !isSubmitting && setMode(null)}
          onSubmit={handleSubmit}
        />
      )}

      <Modal isOpen={!!roleToDelete} onClose={() => !isSubmitting && setRoleToDelete(null)} title="Supprimer le rôle">
        <div className="space-y-6 py-2">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <p className="text-sm text-muted-foreground max-w-sm">
              Vous êtes sur le point de supprimer le rôle <span className="font-semibold text-foreground">{roleToDelete?.name}</span>.
              {roleToDelete && roleToDelete.userCount > 0 && (
                <><br />Il est attribué à {roleToDelete.userCount} utilisateur{roleToDelete.userCount > 1 ? "s" : ""} : retirez-le d&apos;abord de leurs comptes.</>
              )}
            </p>
          </div>
          <div className="flex justify-center gap-3 pt-4">
            <button onClick={() => setRoleToDelete(null)} className="px-5 py-2.5 rounded-md text-sm font-medium border border-border hover:bg-secondary transition-colors">
              Annuler
            </button>
            <button
              onClick={handleDelete}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-md text-sm font-medium bg-red-600 text-white hover:bg-red-700 shadow-sm transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Suppression..." : "Oui, supprimer"}
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!roleToReset} onClose={() => !isSubmitting && setRoleToReset(null)} title="Rétablir les réglages d'origine">
        <div className="space-y-6 py-2">
          <p className="text-sm text-muted-foreground">
            Les permissions du rôle <span className="font-semibold text-foreground">{roleToReset?.name}</span> vont revenir aux réglages
            proposés par Warriors Management. Vos adaptations seront perdues.
            {roleToReset && roleToReset.userCount > 0 && (
              <> Le changement s&apos;applique immédiatement à {roleToReset.userCount} utilisateur{roleToReset.userCount > 1 ? "s" : ""}.</>
            )}
          </p>
          <div className="flex justify-end gap-3">
            <button onClick={() => setRoleToReset(null)} className="px-4 py-2 rounded-md text-sm font-medium border border-border hover:bg-secondary transition-colors">
              Annuler
            </button>
            <button
              onClick={handleReset}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Rétablissement..." : "Rétablir"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function RoleEditorModal({
  mode,
  form,
  setForm,
  isSubmitting,
  onClose,
  onSubmit,
}: {
  mode: EditorMode;
  form: EditorState;
  setForm: React.Dispatch<React.SetStateAction<EditorState>>;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  const editedRole = mode.kind === "edit" ? mode.role : null;
  const nameLocked = !!editedRole?.systemKey;
  const { grants } = form;
  const update = (fn: (g: PermissionGrants) => PermissionGrants) => setForm((prev) => ({ ...prev, grants: fn(prev.grants) }));

  const preview = useMemo(() => menuPreview(grants), [grants]);
  const sensitive = useMemo(() => sensitiveSummary(grants), [grants]);
  const financeLevel = studentFinanceLevel(grants);
  const studentsEnabled = grants.students.read;

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={editedRole ? `Modifier le rôle ${editedRole.name}` : "Nouveau rôle"}
      className="sm:max-w-5xl"
    >
      <form onSubmit={onSubmit} className="flex flex-col min-h-0">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-6 overflow-y-auto pt-4 pb-2">
          <div className="space-y-5 min-w-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="role-name" className="text-sm font-medium text-foreground">Nom du rôle</label>
                <input
                  id="role-name"
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  disabled={nameLocked}
                  maxLength={40}
                  className="w-full p-2.5 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm uppercase disabled:opacity-60"
                  placeholder="Ex : GESTIONNAIRE CAISSE"
                  required
                />
                {nameLocked && <p className="text-[11px] text-muted-foreground">Le nom d&apos;un rôle système ne change pas.</p>}
              </div>
              <div className="space-y-1.5">
                <label htmlFor="role-description" className="text-sm font-medium text-foreground">Description (optionnel)</label>
                <input
                  id="role-description"
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  maxLength={200}
                  className="w-full p-2.5 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                  placeholder="Ex : Inscriptions et encaissements au guichet"
                />
              </div>
            </div>

            {EDITOR_SECTIONS.map((section) => (
              <div key={section.title}>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">{section.title}</p>
                <div className="border border-border rounded-lg divide-y divide-border bg-background">
                  {section.modules.map((m) => (
                    <div key={m.resource} className="px-4 py-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground">{m.label}</p>
                          {m.hint && <p className="text-[11px] text-muted-foreground mt-0.5">{m.hint}</p>}
                        </div>
                        <Segmented<AccessLevel>
                          value={accessLevel(grants, m.resource)}
                          options={m.levels}
                          labels={ACCESS_LABELS}
                          onChange={(level) => update((g) => setAccess(g, m.resource, level))}
                        />
                      </div>

                      {m.resource === "dashboard" && (
                        <label className={cn("mt-3 ml-3 pl-3 border-l-2 border-border flex items-center gap-2 text-sm", !grants.dashboard.read && "opacity-50")}>
                          <input
                            type="checkbox"
                            className="w-4 h-4 rounded border-border"
                            disabled={!grants.dashboard.read}
                            checked={grants["dashboard.finance"].read}
                            onChange={(e) => update((g) => setDashboardFinance(g, e.target.checked))}
                          />
                          Inclure les indicateurs financiers (CA, dépenses, impayés, courbe)
                        </label>
                      )}

                      {m.resource === "students" && (
                        <div className={cn("mt-3 ml-3 pl-3 border-l-2 border-border space-y-3", !studentsEnabled && "opacity-50")}>
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <p className="text-sm text-foreground">Situation financière</p>
                              <p className="text-[11px] text-muted-foreground">
                                {financeLevel === "status"
                                  ? "Voit « À jour » ou « En retard », sans aucun montant."
                                  : financeLevel === "full"
                                    ? "Voit montants, échéancier et historique des paiements."
                                    : "Aucune information financière sur la fiche ni dans la liste."}
                              </p>
                            </div>
                            <Segmented<StudentFinanceLevel>
                              value={financeLevel}
                              options={["none", "status", "full"]}
                              labels={FINANCE_LEVEL_LABELS}
                              disabled={!studentsEnabled}
                              onChange={(level) => update((g) => setStudentFinance(g, level))}
                            />
                          </div>
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              className="w-4 h-4 rounded border-border"
                              disabled={!studentsEnabled}
                              checked={grants["students.collect"].write}
                              onChange={(e) => update((g) => setCollect(g, e.target.checked))}
                            />
                            Encaisser un paiement depuis la fiche
                            <span className="text-[11px] text-muted-foreground">(active le détail complet)</span>
                          </label>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Aperçu en direct */}
          <aside className="space-y-4 lg:sticky lg:top-0 self-start">
            <div className="border border-border rounded-lg p-4 bg-secondary/20">
              <p className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-3">
                <Eye className="w-3.5 h-3.5" /> Menu vu par ce rôle
              </p>
              {preview.map((s) => (
                <div key={s.section} className="mb-3 last:mb-0">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{s.section}</p>
                  <ul className="mt-1 space-y-0.5">
                    {s.items.map((item) => (
                      <li key={item} className="text-sm text-foreground">{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {sensitive.level === "money" && (
              <div className="border border-amber-200 bg-amber-50 text-amber-900 rounded-lg p-3 text-xs">
                <p className="font-semibold flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" /> Ce rôle voit des montants financiers</p>
                <p className="mt-1">Accès à {sensitive.details.join(", ")}.</p>
              </div>
            )}
            {sensitive.level === "status" && (
              <div className="border border-border bg-background rounded-lg p-3 text-xs text-muted-foreground">
                Ce rôle voit uniquement le statut de paiement des étudiants, sans montant.
              </div>
            )}
            {sensitive.level === "none" && (
              <div className="border border-border bg-background rounded-lg p-3 text-xs text-muted-foreground">
                Ce rôle n&apos;a accès à aucune information financière.
              </div>
            )}

            {editedRole && editedRole.userCount > 0 && (
              <p className="text-[11px] text-muted-foreground">
                Le changement s&apos;applique immédiatement à {editedRole.userCount} utilisateur{editedRole.userCount > 1 ? "s" : ""}.
              </p>
            )}
          </aside>
        </div>

        <div className="flex justify-end gap-3 pt-4 mt-2 border-t border-border/50">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-muted-foreground bg-muted/50 hover:bg-muted rounded-md transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-md transition-colors disabled:opacity-50"
          >
            {isSubmitting ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
