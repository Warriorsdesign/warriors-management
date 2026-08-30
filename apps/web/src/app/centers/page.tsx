"use client";

import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { mockCenters, Center } from "@/lib/data/mockData";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/lib/store/useUIStore";
import { Select } from "@/components/ui/select";

export default function CentersPage() {
  const [centers, setCenters] = useState<Center[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingCenter, setEditingCenter] = useState<Center | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    status: "actif",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('warriors_mock_centers');
      if (stored) {
        setCenters(JSON.parse(stored));
      } else {
        setCenters(mockCenters);
        localStorage.setItem('warriors_mock_centers', JSON.stringify(mockCenters));
      }
    } catch (e) {
      console.error("Failed to load local data", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const openAddModal = () => {
    setEditingCenter(null);
    setFormData({
      name: "",
      address: "",
      status: "actif",
    });
    setErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (center: Center) => {
    setEditingCenter(center);
    setFormData({
      name: center.name,
      address: center.address || "",
      status: center.status,
    });
    setErrors({});
    setIsModalOpen(true);
  };

  const confirmDelete = (center: Center) => {
    setEditingCenter(center);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = () => {
    if (!editingCenter) return;
    
    const updatedCenters = centers.filter(c => c.id !== editingCenter.id);
    setCenters(updatedCenters);
    localStorage.setItem('warriors_mock_centers', JSON.stringify(updatedCenters));
    
    // Announce to other components if needed
    window.dispatchEvent(new Event('mockDataChanged'));
    
    setIsDeleteModalOpen(false);
    useUIStore.getState().showToast("Le centre a été supprimé avec succès.", "success");
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "Veuillez renseigner le nom du centre.";
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      let updatedCenters;
      if (editingCenter) {
        updatedCenters = centers.map(c => 
          c.id === editingCenter.id ? {
            ...c,
            name: formData.name,
            address: formData.address,
            status: formData.status as 'actif' | 'inactif'
          } : c
        );
        useUIStore.getState().showToast("Le centre a été modifié avec succès.", "success");
      } else {
        const newCenter: Center = {
          id: `c-${Date.now()}`,
          name: formData.name,
          address: formData.address,
          status: formData.status as 'actif' | 'inactif',
          organizationId: centers.length > 0 ? centers[0].organizationId : "org-1"
        };
        updatedCenters = [...centers, newCenter];
        useUIStore.getState().showToast("Le centre a été créé avec succès.", "success");
      }

      setCenters(updatedCenters);
      localStorage.setItem('warriors_mock_centers', JSON.stringify(updatedCenters));
      
      // Announce to other components if needed
      window.dispatchEvent(new Event('mockDataChanged'));

      setIsSubmitting(false);
      setIsModalOpen(false);
    }, 600);
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Centres</h1>
          <p className="text-sm text-muted-foreground mt-1">Gérez les centres de formation.</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Nouveau centre
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-none overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Chargement...</div>
        ) : centers.length === 0 ? (
          <div className="p-8 text-center">
            <h3 className="text-lg font-medium text-foreground mb-2">Aucun centre</h3>
            <p className="text-sm text-muted-foreground">Il n'y a actuellement aucun centre enregistré.</p>
          </div>
        ) : (
          <div className="overflow-x-auto pb-24 min-h-[250px]">
            <table className="w-full text-sm text-left">
              <thead className="bg-secondary/50 text-muted-foreground">
                <tr>
                  <th className="px-6 py-3 font-medium">Nom du centre</th>
                  <th className="px-6 py-3 font-medium">Adresse</th>
                  <th className="px-6 py-3 font-medium">Statut</th>
                  <th className="px-6 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {centers.map((c) => (
                  <tr key={c.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground">{c.name}</td>
                    <td className="px-6 py-4 text-muted-foreground">{c.address || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${c.status === 'actif' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        {c.status === 'actif' ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEditModal(c)}
                          className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-colors"
                          title="Modifier"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => confirmDelete(c)}
                          className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
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
        title={editingCenter ? "Modifier le centre" : "Ajouter un centre"}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4 mt-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Nom du centre</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                if (errors.name) setErrors({ ...errors, name: '' });
              }}
              className={cn(
                "w-full bg-background border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 transition-all",
                errors.name ? "border-red-500 focus:ring-red-500/50 animate-shake" : "border-border focus:ring-primary"
              )}
              placeholder="Ex: Campus Paris Centre"
            />
            {errors.name && (
              <p className="text-xs text-red-500 mt-1 animate-fade-in">{errors.name}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Adresse complète (optionnel)</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full bg-background border border-border focus:ring-primary rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 transition-all"
              placeholder="Ex: 15 rue de la Paix, 75000 Paris"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Statut</label>
            <Select
              value={formData.status}
              onChange={(val) => setFormData({ ...formData, status: val })}
              options={[
                { label: 'Actif', value: 'actif' },
                { label: 'Inactif', value: 'inactif' },
              ]}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? "Enregistrement..." : (editingCenter ? "Enregistrer" : "Créer le centre")}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirmer la suppression"
      >
        <div className="p-4 space-y-4">
          <div className="flex flex-col items-center justify-center text-center space-y-4 py-4">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
              <Trash2 className="w-8 h-8 text-red-500" />
            </div>
            <p className="text-sm text-muted-foreground max-w-sm">
              Vous êtes sur le point de supprimer le centre <span className="font-semibold text-foreground">{editingCenter?.name}</span>.
              <br />Cette action est <span className="text-destructive font-medium">définitive</span> et supprimera toutes les données associées.
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
