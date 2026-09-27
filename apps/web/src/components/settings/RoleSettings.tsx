"use client";

import React, { useState } from "react";
import { Plus, Edit2, Trash2, Shield, AlertCircle } from "lucide-react";
import { useRoles, createRole, updateRole, deleteRole, type Role, type RolePermission } from "@/lib/hooks/useRoles";
import { useCan } from "@/lib/hooks/useSession";
import { ApiClientError } from "@/lib/api/client";
import { useUIStore } from "@/lib/store/useUIStore";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";

const AVAILABLE_RESOURCES = [
  { id: 'students', label: 'Étudiants' },
  { id: 'classes', label: 'Classes & Cohortes' },
  { id: 'formations', label: 'Formations' },
  { id: 'centers', label: 'Centres' },
  { id: 'payments', label: 'Paiements' },
  { id: 'expenses', label: 'Dépenses' },
  { id: 'users', label: 'Utilisateurs' },
  { id: 'organization', label: 'Organisation' },
  { id: 'dashboard', label: 'Tableau de bord' },
];

export function RoleSettings() {
  const { roles, isLoading, mutate } = useRoles();
  const canWrite = useCan("users", "write"); // Assumes users write perm allows role editing
  const showToast = useUIStore(state => state.showToast);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    permissions: Record<string, { canRead: boolean; canWrite: boolean }>;
  }>({
    name: "",
    description: "",
    permissions: AVAILABLE_RESOURCES.reduce((acc, res) => ({ ...acc, [res.id]: { canRead: false, canWrite: false } }), {})
  });

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const openAddModal = () => {
    setEditingRole(null);
    setFormData({
      name: "",
      description: "",
      permissions: AVAILABLE_RESOURCES.reduce((acc, res) => ({ ...acc, [res.id]: { canRead: false, canWrite: false } }), {})
    });
    setIsModalOpen(true);
  };

  const openEditModal = (role: Role) => {
    if (role.isSystem) {
      showToast("Les rôles systèmes ne peuvent pas être modifiés.", "error");
      return;
    }
    setEditingRole(role);
    
    const perms = AVAILABLE_RESOURCES.reduce((acc, res) => ({ ...acc, [res.id]: { canRead: false, canWrite: false } }), {} as Record<string, { canRead: boolean, canWrite: boolean }>);
    role.permissions.forEach(p => {
      if (perms[p.resource]) {
        perms[p.resource] = { canRead: p.canRead, canWrite: p.canWrite };
      }
    });

    setFormData({
      name: role.name,
      description: role.description || "",
      permissions: perms
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast("Le nom du rôle est requis", "error");
      return;
    }

    const permissionsArray = Object.entries(formData.permissions)
      .filter(([_, perms]) => perms.canRead || perms.canWrite)
      .map(([resource, perms]) => ({
        resource,
        canRead: perms.canRead,
        canWrite: perms.canWrite
      }));

    setIsSubmitting(true);
    try {
      if (editingRole) {
        await updateRole(editingRole.id, {
          name: formData.name,
          description: formData.description,
          permissions: permissionsArray
        });
        showToast("Rôle mis à jour avec succès", "success");
      } else {
        await createRole({
          name: formData.name,
          description: formData.description,
          permissions: permissionsArray
        });
        showToast("Rôle créé avec succès", "success");
      }
      mutate();
      setIsModalOpen(false);
    } catch (err) {
      showToast(err instanceof ApiClientError ? err.message : "Une erreur est survenue", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!editingRole) return;
    setIsSubmitting(true);
    try {
      await deleteRole(editingRole.id);
      showToast("Rôle supprimé avec succès", "success");
      mutate();
      setIsDeleteModalOpen(false);
    } catch (err) {
      showToast(err instanceof ApiClientError ? err.message : "Une erreur est survenue", "error");
      setIsDeleteModalOpen(false);
    } finally {
      setIsSubmitting(false);
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
          <p className="text-sm text-muted-foreground mt-1">Configurez les rôles et les permissions pour les membres de l'organisation.</p>
        </div>
        {canWrite && (
          <button
            onClick={openAddModal}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nouveau rôle
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {roles.map((role) => (
          <div key={role.id} className="bg-card border border-border rounded-xl p-5 hover:shadow-sm transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                <div className={cn(
                  "p-2 rounded-md",
                  role.isSystem ? "bg-amber-100 text-amber-700" : "bg-blue-50 text-blue-600"
                )}>
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    {role.name}
                    {role.isSystem && (
                      <span className="text-[10px] font-medium bg-secondary text-muted-foreground px-2 py-0.5 rounded-full">Système</span>
                    )}
                  </h3>
                  {role.description && <p className="text-xs text-muted-foreground mt-0.5">{role.description}</p>}
                </div>
              </div>
              
              {canWrite && !role.isSystem && (
                <div className="flex gap-1">
                  <button onClick={() => openEditModal(role)} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => { setEditingRole(role); setIsDeleteModalOpen(true); }} className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-xs font-medium text-muted-foreground mb-2">Permissions principales :</p>
              <div className="flex flex-wrap gap-1.5">
                {role.permissions.slice(0, 5).map((p, i) => (
                  <span key={i} className="text-[10px] bg-secondary/70 text-secondary-foreground px-2 py-1 rounded border border-border/50">
                    {AVAILABLE_RESOURCES.find(r => r.id === p.resource)?.label || p.resource}
                    <span className="ml-1 opacity-70">
                      ({p.canWrite ? 'Écriture' : (p.canRead ? 'Lecture' : 'Aucun')})
                    </span>
                  </span>
                ))}
                {role.permissions.length > 5 && (
                  <span className="text-[10px] bg-secondary/70 text-muted-foreground px-2 py-1 rounded border border-border/50">
                    +{role.permissions.length - 5} autres
                  </span>
                )}
                {role.permissions.length === 0 && (
                  <span className="text-[10px] text-muted-foreground italic">Aucune permission</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => !isSubmitting && setIsModalOpen(false)}
        title={editingRole ? "Modifier le rôle" : "Nouveau rôle"}
      >
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Nom du rôle</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-2.5 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm"
                placeholder="Ex: MANAGER RH"
                required
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Description (optionnel)</label>
              <input
                type="text"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-2.5 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm"
                placeholder="Ex: Gestion du personnel et de la paie"
              />
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-foreground mb-3">Permissions d'accès</h4>
            <div className="border border-border rounded-md overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-secondary/50 text-xs uppercase font-semibold text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2 border-b border-border">Ressource</th>
                    <th className="px-4 py-2 border-b border-border text-center">Lecture</th>
                    <th className="px-4 py-2 border-b border-border text-center">Écriture</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-background">
                  {AVAILABLE_RESOURCES.map((res) => {
                    const canRead = formData.permissions[res.id]?.canRead || false;
                    const canWrite = formData.permissions[res.id]?.canWrite || false;
                    
                    return (
                      <tr key={res.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-2.5 font-medium text-foreground">{res.label}</td>
                        <td className="px-4 py-2.5 text-center">
                          <input 
                            type="checkbox" 
                            checked={canRead}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              permissions: {
                                ...prev.permissions,
                                [res.id]: {
                                  ...prev.permissions[res.id],
                                  canRead: e.target.checked,
                                  // Si on décoche lecture, on décoche écriture
                                  canWrite: !e.target.checked ? false : prev.permissions[res.id]?.canWrite
                                }
                              }
                            }))}
                            className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                          />
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <input 
                            type="checkbox" 
                            checked={canWrite}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              permissions: {
                                ...prev.permissions,
                                [res.id]: {
                                  ...prev.permissions[res.id],
                                  canWrite: e.target.checked,
                                  // Si on coche écriture, on coche automatiquement lecture
                                  canRead: e.target.checked ? true : prev.permissions[res.id]?.canRead
                                }
                              }
                            }))}
                            className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
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

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Supprimer le rôle"
      >
        <div className="space-y-6 py-2">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <p className="text-sm text-muted-foreground max-w-sm">
              Vous êtes sur le point de supprimer le rôle <span className="font-semibold text-foreground">{editingRole?.name}</span>.
              <br />Veuillez vous assurer qu'aucun utilisateur n'y est actuellement assigné.
            </p>
          </div>

          <div className="flex justify-center gap-3 pt-4">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-5 py-2.5 rounded-md text-sm font-medium border border-border hover:bg-secondary transition-colors"
            >
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
    </div>
  );
}
