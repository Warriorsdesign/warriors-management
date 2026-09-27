"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Check, X, AlertCircle } from "lucide-react";
import { useUIStore } from "@/lib/store/useUIStore";
import { Card } from "@/components/ui/card";

interface Plan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  maxCenters: number;
  maxStudents: number;
  isPopular: boolean;
  features: string[];
}

export function PlanManager() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Plan>>({});
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
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
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
    setFormData(plan);
    setIsEditing(plan.id);
  };

  const startCreate = () => {
    setFormData({
      name: "",
      description: "",
      price: 0,
      maxCenters: 1,
      maxStudents: 50,
      isPopular: false,
      features: []
    });
    setIsEditing("new");
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
        {plans.map(plan => (
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

            <div className="space-y-3 flex-1 mb-6">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Check className="w-4 h-4 text-primary" />
                <span className="font-medium">{plan.maxCenters}</span> Centres max
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Check className="w-4 h-4 text-primary" />
                <span className="font-medium">{plan.maxStudents}</span> Étudiants max
              </div>
            </div>
          </Card>
        ))}
      </div>

      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-fade-in-up">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-semibold text-gray-900">
                {isEditing === "new" ? "Nouveau Plan" : "Modifier le Plan"}
              </h3>
              <button onClick={() => setIsEditing(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom du forfait (ex: PRO)</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  value={formData.name || ""}
                  onChange={e => setFormData({...formData, name: e.target.value.toUpperCase()})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  value={formData.description || ""}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prix (FCFA/mois)</label>
                  <input 
                    type="number" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    value={formData.price || 0}
                    onChange={e => setFormData({...formData, price: Number(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 mt-8 text-sm font-medium text-gray-700 cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                      checked={formData.isPopular || false}
                      onChange={e => setFormData({...formData, isPopular: e.target.checked})}
                    />
                    Mettre en avant (Populaire)
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Centres Max</label>
                  <input 
                    type="number" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    value={formData.maxCenters || 0}
                    onChange={e => setFormData({...formData, maxCenters: Number(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Étudiants Max</label>
                  <input 
                    type="number" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    value={formData.maxStudents || 0}
                    onChange={e => setFormData({...formData, maxStudents: Number(e.target.value)})}
                  />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 rounded-b-xl border-t border-gray-100">
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
        </div>
      )}
    </div>
  );
}
