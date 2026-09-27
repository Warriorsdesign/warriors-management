"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Check, X, AlertCircle } from "lucide-react";
import { useUIStore } from "@/lib/store/useUIStore";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";

interface PlanFeatures {
  available: string[];
  unavailable: string[];
}

interface Plan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  maxCenters: number;
  maxStudents: number;
  isUnlimitedCenters: boolean;
  isUnlimitedStudents: boolean;
  isPopular: boolean;
  features: string[];
  unavailableFeatures: string[];
}

export function PlanManager() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Plan>>({});
  const [newFeature, setNewFeature] = useState("");
  const { showToast } = useUIStore();

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const res = await fetch("/api/admin/plans");
      const data = await res.json();
      if (res.ok) setPlans(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (id?: string) => {
    try {
      const isNew = !id;
      const url = isNew ? "/api/admin/plans" : `/api/admin/plans/${id}`;
      const method = isNew ? "POST" : "PUT";

      const payload = {
        ...formData,
        features: formData.features || [],
        unavailableFeatures: formData.unavailableFeatures || []
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erreur lors de la sauvegarde");
      }

      showToast(isNew ? "Plan créé avec succès" : "Plan mis à jour", "success");
      setIsEditing(null);
      setFormData({});
      fetchPlans();
    } catch (error: any) {
      showToast(error.message, "error");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer ce plan ?")) return;
    try {
      const res = await fetch(`/api/admin/plans/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erreur lors de la suppression");
      }
      showToast("Plan supprimé", "success");
      fetchPlans();
    } catch (error: any) {
      showToast(error.message, "error");
    }
  };

  const startEdit = (plan: Plan) => {
    setFormData({
      ...plan,
      features: Array.isArray(plan.features) ? plan.features : [],
      unavailableFeatures: Array.isArray(plan.unavailableFeatures) ? plan.unavailableFeatures : []
    });
    setIsEditing(plan.id);
  };

  const startCreate = () => {
    setFormData({
      name: "",
      description: "",
      price: 0,
      maxCenters: 1,
      maxStudents: 50,
      isUnlimitedCenters: false,
      isUnlimitedStudents: false,
      isPopular: false,
      features: [],
      unavailableFeatures: []
    });
    setIsEditing("new");
  };

  const addFeature = (type: 'available' | 'unavailable') => {
    if (!newFeature.trim()) return;
    if (type === 'available') {
      setFormData({ ...formData, features: [...(formData.features || []), newFeature.trim()] });
    } else {
      setFormData({ ...formData, unavailableFeatures: [...(formData.unavailableFeatures || []), newFeature.trim()] });
    }
    setNewFeature("");
  };

  const removeFeature = (type: 'available' | 'unavailable', index: number) => {
    if (type === 'available') {
      const list = [...(formData.features || [])];
      list.splice(index, 1);
      setFormData({ ...formData, features: list });
    } else {
      const list = [...(formData.unavailableFeatures || [])];
      list.splice(index, 1);
      setFormData({ ...formData, unavailableFeatures: list });
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Chargement...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-900">Forfaits & Tarifications</h2>
        <button
          onClick={startCreate}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nouveau Plan
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map(plan => {
          const feats = {
            available: Array.isArray(plan.features) ? plan.features : [],
            unavailable: Array.isArray(plan.unavailableFeatures) ? plan.unavailableFeatures : []
          };
          return (
            <Card key={plan.id} className={`relative p-6 flex flex-col ${plan.isPopular ? 'ring-2 ring-primary' : ''}`}>
              {plan.isPopular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-white text-xs font-semibold rounded-full">
                  Populaire
                </span>
              )}

              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 uppercase">{plan.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => startEdit(plan)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded hover:bg-blue-50 transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(plan.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="my-4">
                <span className="text-3xl font-extrabold text-gray-900">{plan.price.toLocaleString('fr-FR')} FCFA</span>
                <span className="text-gray-500 font-medium"> / mois</span>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Check className="w-4 h-4 text-primary" />
                  <span className="font-medium">{plan.isUnlimitedCenters ? 'Illimité' : plan.maxCenters}</span> Centres max
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Check className="w-4 h-4 text-primary" />
                  <span className="font-medium">{plan.isUnlimitedStudents ? 'Illimité' : plan.maxStudents}</span> Étudiants max
                </div>
              </div>

              <div className="flex-1 space-y-2 border-t border-gray-100 pt-4">
                {feats.available?.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span>{f}</span>
                  </div>
                ))}
                {feats.unavailable?.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-gray-400">
                    <X className="w-4 h-4 text-gray-300 flex-shrink-0" />
                    <span className="line-through">{f}</span>
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>

      <Modal
        isOpen={Boolean(isEditing)}
        onClose={() => setIsEditing(null)}
        title={isEditing === "new" ? "Nouveau Plan" : "Modifier le Plan"}
        className="w-full max-w-2xl"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom du forfait (ex: PRO)</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                value={formData.name || ""}
                onChange={e => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prix (FCFA/mois)</label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                value={formData.price || 0}
                onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              value={formData.description || ""}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Centres Max</label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  disabled={formData.isUnlimitedCenters}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all disabled:bg-gray-100"
                  value={formData.isUnlimitedCenters ? '' : formData.maxCenters || 0}
                  onChange={e => setFormData({ ...formData, maxCenters: Number(e.target.value) })}
                />
                <label className="flex items-center gap-2 text-sm whitespace-nowrap">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                    checked={formData.isUnlimitedCenters || false}
                    onChange={e => setFormData({ ...formData, isUnlimitedCenters: e.target.checked })}
                  />
                  Illimité
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Étudiants Max</label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  disabled={formData.isUnlimitedStudents}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all disabled:bg-gray-100"
                  value={formData.isUnlimitedStudents ? '' : formData.maxStudents || 0}
                  onChange={e => setFormData({ ...formData, maxStudents: Number(e.target.value) })}
                />
                <label className="flex items-center gap-2 text-sm whitespace-nowrap">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                    checked={formData.isUnlimitedStudents || false}
                    onChange={e => setFormData({ ...formData, isUnlimitedStudents: e.target.checked })}
                  />
                  Illimité
                </label>
              </div>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                checked={formData.isPopular || false}
                onChange={e => setFormData({ ...formData, isPopular: e.target.checked })}
              />
              Mettre en avant (Plan Populaire)
            </label>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Avantages du Plan (Features)</h4>

            <div className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Nouvel avantage..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                value={newFeature}
                onChange={e => setNewFeature(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addFeature('available')}
              />
              <button onClick={() => addFeature('available')} className="px-3 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium hover:bg-green-100">
                + Inclus
              </button>
              <button onClick={() => addFeature('unavailable')} className="px-3 py-2 bg-gray-50 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100 border border-gray-200">
                + Non Inclus
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase">Inclus</p>
                {formData.features?.map((f, i) => (
                  <div key={i} className="flex justify-between items-center p-2 bg-green-50 rounded-lg text-sm">
                    <span className="text-green-800 flex items-center gap-2">
                      <Check className="w-3 h-3" /> {f}
                    </span>
                    <button onClick={() => removeFeature('available', i)} className="text-green-600 hover:text-green-900"><X className="w-4 h-4" /></button>
                  </div>
                ))}
                {(!formData.features || formData.features.length === 0) && (
                  <p className="text-sm text-gray-400 italic">Aucun avantage inclus</p>
                )}
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase">Non Inclus</p>
                {formData.unavailableFeatures?.map((f, i) => (
                  <div key={i} className="flex justify-between items-center p-2 bg-gray-50 border border-gray-100 rounded-lg text-sm">
                    <span className="text-gray-500 flex items-center gap-2 line-through">
                      <X className="w-3 h-3" /> {f}
                    </span>
                    <button onClick={() => removeFeature('unavailable', i)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t border-gray-100">
            <button
              onClick={() => setIsEditing(null)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={() => handleSave(isEditing === "new" ? undefined : isEditing)}
              className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors"
            >
              Enregistrer
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
