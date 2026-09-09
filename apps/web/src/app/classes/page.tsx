"use client";

import React, { useState } from "react";
import { Plus, MoreHorizontal, Edit, Trash2, Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { TableSkeleton } from "@/components/ui/skeleton";
import { useClasses, createClass, updateClass, deleteClass } from "@/lib/hooks/useClasses";
import { useFormations } from "@/lib/hooks/useFormations";
import { useCenters } from "@/lib/hooks/useCenters";
import { useCan } from "@/lib/hooks/useSession";
import { ApiClientError } from "@/lib/api/client";
import { useUIStore } from "@/lib/store/useUIStore";
import type { ClassDTO } from "@/lib/api/types";
import { cn } from "@/lib/utils";

export default function ClassesPage() {
  const { classes, isLoading } = useClasses();
  const { formations } = useFormations();
  const { centers } = useCenters();
  const canWrite = useCan("classes", "write");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassDTO | null>(null);
  const [classToDelete, setClassToDelete] = useState<ClassDTO | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    formationId: "",
    centerId: "",
    capacity: "30",
  });

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if ((e.target as Element).closest('.action-dropdown-container')) return;
      setOpenDropdownId(null);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const openAddModal = () => {
    setEditingClass(null);
    setFormData({
      name: "",
      formationId: formations.length > 0 ? formations[0].id : "",
      centerId: centers.length > 0 ? centers[0].id : "",
      capacity: "30",
    });
    setErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (c: ClassDTO) => {
    setEditingClass(c);
    setFormData({
      name: c.name,
      formationId: c.formationId,
      centerId: c.centerId,
      capacity: c.capacity.toString(),
    });
    setErrors({});
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "Veuillez renseigner le nom de la classe.";
    if (!formData.formationId) newErrors.formationId = "Veuillez sélectionner une formation.";
    if (!formData.centerId) newErrors.centerId = "Veuillez sélectionner un centre.";
    if (!formData.capacity || parseInt(formData.capacity) <= 0) newErrors.capacity = "Capacité invalide.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingClass) {
        await updateClass(editingClass.id, {
          name: formData.name,
          capacity: parseInt(formData.capacity, 10),
        });
        useUIStore.getState().showToast("Classe modifiée avec succès.", "success");
      } else {
        await createClass({
          name: formData.name,
          formationId: formData.formationId,
          centerId: formData.centerId,
          capacity: parseInt(formData.capacity, 10),
        });
        useUIStore.getState().showToast("Classe créée avec succès.", "success");
      }
      setIsModalOpen(false);
    } catch (err) {
      useUIStore.getState().showToast(err instanceof ApiClientError ? err.message : "Une erreur est survenue.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!classToDelete) return;
    try {
      await deleteClass(classToDelete.id);
      useUIStore.getState().showToast("Classe supprimée avec succès.", "success");
      setClassToDelete(null);
    } catch (err) {
      useUIStore.getState().showToast(err instanceof ApiClientError ? err.message : "Une erreur est survenue.", "error");
      setClassToDelete(null);
    }
  };

  const getFormationName = (id: string) => {
    const f = formations.find(f => f.id === id);
    return f ? f.name : 'Inconnue';
  };

  const formationOptions = formations.map(f => ({ label: f.name, value: f.id }));
  const centerOptions = centers.map(c => ({ label: c.name, value: c.id }));

  const filteredClasses = classes.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Classes</h1>
          <p className="text-sm text-muted-foreground mt-1">Gérez les cohortes et classes.</p>
        </div>
        {canWrite && (
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Nouvelle classe
          </button>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
        <div className="relative w-full md:w-1/2">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher une classe..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-10 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary transition-all duration-300 hover:shadow-md hover:border-primary/50 focus:shadow-md"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-none overflow-hidden">
        {!isLoading && classes.length === 0 ? (
          <div className="p-8 text-center">
            <h3 className="text-lg font-medium text-foreground mb-2">Aucune classe</h3>
            <p className="text-sm text-muted-foreground">Il n'y a actuellement aucune classe enregistrée.</p>
          </div>
        ) : (
          <div className="overflow-x-auto pb-24 min-h-[250px]">
            <table className="w-full text-sm text-left">
              <thead className="bg-secondary/50 text-muted-foreground">
                <tr>
                  <th className="px-6 py-3 font-medium">Nom de la classe</th>
                  <th className="px-6 py-3 font-medium">Formation</th>
                  <th className="px-6 py-3 font-medium">Statut</th>
                  <th className="px-6 py-3 font-medium text-right">Étudiants</th>
                  {canWrite && <th className="px-6 py-3 font-medium w-16"></th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? <TableSkeleton rows={5} columns={canWrite ? 5 : 4} /> : filteredClasses.map((c) => (
                  <tr key={c.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground">{c.name}</td>
                    <td className="px-6 py-4 text-muted-foreground">{getFormationName(c.formationId)}</td>
                    <td className="px-6 py-4">
                      {c.status === 'ouverte' ? (
                        <Badge variant="success" className="px-2 py-0.5 text-[11px] whitespace-nowrap"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>Ouverte</Badge>
                      ) : c.status === 'cloturee' ? (
                        <Badge variant="outline" className="px-2 py-0.5 text-[11px] whitespace-nowrap"><span className="w-1.5 h-1.5 rounded-full bg-muted-foreground mr-1.5"></span>Clôturée</Badge>
                      ) : (
                        <Badge variant="destructive" className="px-2 py-0.5 text-[11px] whitespace-nowrap"><span className="w-1.5 h-1.5 rounded-full bg-destructive mr-1.5"></span>Complète</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-medium text-foreground">{c.enrolledCount}</span>
                      <span className="text-muted-foreground"> / {c.capacity}</span>
                    </td>
                    {canWrite && (
                      <td className="px-6 py-4 text-right relative action-dropdown-container">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenDropdownId(openDropdownId === c.id ? null : c.id);
                          }}
                          className="p-2 hover:bg-secondary rounded-md text-muted-foreground transition-colors"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>

                        {openDropdownId === c.id && (
                          <div className="absolute right-6 top-10 mt-1 w-48 bg-card border border-border rounded-lg shadow-lg py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                            <button
                              onClick={() => {
                                openEditModal(c);
                                setOpenDropdownId(null);
                              }}
                              className="flex items-center gap-2 px-3 py-1.5 text-sm text-foreground hover:bg-secondary w-full text-left"
                            >
                              <Edit className="w-4 h-4" /> Modifier
                            </button>
                            <button
                              onClick={() => {
                                setClassToDelete(c);
                                setOpenDropdownId(null);
                              }}
                              className="flex items-center gap-2 px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10 w-full text-left"
                            >
                              <Trash2 className="w-4 h-4" /> Supprimer
                            </button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => !isSubmitting && setIsModalOpen(false)}
        title={editingClass ? "Modifier la classe" : "Créer une nouvelle classe"}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nom de la classe</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                if (errors.name) setErrors({ ...errors, name: '' });
              }}
              className={cn(
                "w-full p-2 border rounded-md bg-background focus:outline-none focus:ring-2 transition-all text-sm",
                errors.name ? "border-red-500 focus:ring-red-500/50 animate-shake" : "border-border focus:ring-primary/50"
              )}
              placeholder="Ex: Cohorte 2026 - A"
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Formation</label>
            <Select
              options={formationOptions}
              value={formData.formationId}
              onChange={(val) => {
                setFormData({ ...formData, formationId: val });
                if (errors.formationId) setErrors({ ...errors, formationId: '' });
              }}
              placeholder="Sélectionner une formation"
              disabled={!!editingClass}
              className={errors.formationId ? "border-red-500 animate-shake" : ""}
            />
            {errors.formationId && <p className="text-xs text-red-500">{errors.formationId}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Centre</label>
            <Select
              options={centerOptions}
              value={formData.centerId}
              onChange={(val) => {
                setFormData({ ...formData, centerId: val });
                if (errors.centerId) setErrors({ ...errors, centerId: '' });
              }}
              placeholder="Sélectionner un centre"
              disabled={!!editingClass}
              className={errors.centerId ? "border-red-500 animate-shake" : ""}
            />
            {errors.centerId && <p className="text-xs text-red-500">{errors.centerId}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Capacité maximale</label>
            <input
              type="number"
              value={formData.capacity}
              onChange={(e) => {
                setFormData({ ...formData, capacity: e.target.value });
                if (errors.capacity) setErrors({ ...errors, capacity: '' });
              }}
              min="1"
              className={cn(
                "w-full p-2 border rounded-md bg-background focus:outline-none focus:ring-2 transition-all text-sm",
                errors.capacity ? "border-red-500 focus:ring-red-500/50 animate-shake" : "border-border focus:ring-primary/50"
              )}
            />
            {errors.capacity && <p className="text-xs text-red-500 mt-1">{errors.capacity}</p>}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium border border-border rounded-md hover:bg-secondary transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Enregistrement..." : (editingClass ? "Enregistrer" : "Créer la classe")}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!classToDelete}
        onClose={() => setClassToDelete(null)}
        title="Supprimer cette classe ?"
      >
        <div className="space-y-6 py-2">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
              <Trash2 className="w-8 h-8 text-red-500" />
            </div>
            <p className="text-sm text-muted-foreground max-w-sm">
              Vous êtes sur le point de supprimer <span className="font-semibold text-foreground">{classToDelete?.name}</span>.
              <br />Cette action est <span className="text-destructive font-medium">définitive</span>.
            </p>
          </div>

          <div className="flex justify-center gap-3 pt-4">
            <button
              onClick={() => setClassToDelete(null)}
              className="px-5 py-2.5 rounded-md text-sm font-medium border border-border hover:bg-secondary transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleDelete}
              className="px-5 py-2.5 rounded-md text-sm font-medium bg-red-600 text-white hover:bg-red-700 shadow-sm transition-colors"
            >
              Oui, supprimer
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
