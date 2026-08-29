"use client";

import React, { useState, useEffect } from "react";
import { Plus, Edit, Search, X, Check } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { 
  mockFormations, Formation, 
  mockClasses, ClassGroup, 
  mockCenters, Center,
  mockStudents, Student 
} from "@/lib/data/mockData";
import { useUIStore } from "@/lib/store/useUIStore";

export default function FormationsPage() {
  const [formations, setFormations] = useState<Formation[]>([]);
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [centers, setCenters] = useState<Center[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFormation, setEditingFormation] = useState<Formation | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFormationId, setSelectedFormationId] = useState<string | null>(null);
  const showToast = useUIStore(state => state.showToast);
  
  // For inline level editing
  const [editingLevelId, setEditingLevelId] = useState<string | null>(null);
  const [editingLevelName, setEditingLevelName] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    duration: "",
    totalCost: "",
    hasLevels: false,
    levelCount: "",
    status: "actif"
  });

  useEffect(() => {
    try {
      const storedFormations = localStorage.getItem('warriors_mock_formations');
      if (storedFormations) {
        setFormations(JSON.parse(storedFormations));
      } else {
        setFormations(mockFormations);
        localStorage.setItem('warriors_mock_formations', JSON.stringify(mockFormations));
      }

      const storedClasses = localStorage.getItem('warriors_mock_classes');
      if (storedClasses) setClasses(JSON.parse(storedClasses));
      else setClasses(mockClasses);

      const storedCenters = localStorage.getItem('warriors_mock_centers');
      if (storedCenters) setCenters(JSON.parse(storedCenters));
      else setCenters(mockCenters);

      const storedStudents = localStorage.getItem('warriors_mock_students');
      if (storedStudents) setStudents(JSON.parse(storedStudents));
      else setStudents(mockStudents);

    } catch (e) {
      console.error("Failed to load local data", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const openAddModal = () => {
    setEditingFormation(null);
    setFormData({
      name: "",
      duration: "",
      totalCost: "",
      hasLevels: false,
      levelCount: "",
      status: "actif"
    });
    setIsModalOpen(true);
  };

  const openEditModal = (f: Formation) => {
    setEditingFormation(f);
    setFormData({
      name: f.name,
      duration: f.duration,
      totalCost: f.totalCost.toString(),
      hasLevels: f.hasLevels || false,
      levelCount: f.levelCount ? f.levelCount.toString() : "",
      status: f.status || "actif"
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let updated;
    const levelCount = formData.hasLevels && formData.levelCount ? parseInt(formData.levelCount) : 0;
    
    if (editingFormation) {
      updated = formations.map(f => {
        if (f.id === editingFormation.id) {
          let newLevels = f.levels || [];
          if (formData.hasLevels && levelCount > 0) {
             const updatedLevels = [];
             for (let i = 1; i <= levelCount; i++) {
               const existing = newLevels.find(l => l.id === `lvl_${i}`);
               if (existing) {
                 updatedLevels.push(existing);
               } else {
                 updatedLevels.push({ id: `lvl_${i}`, name: `Niveau ${i}` });
               }
             }
             newLevels = updatedLevels;
          } else {
             newLevels = [];
          }

          return {
            ...f,
            name: formData.name,
            duration: formData.duration,
            totalCost: parseInt(formData.totalCost),
            hasLevels: formData.hasLevels,
            levelCount: levelCount > 0 ? levelCount : undefined,
            levels: newLevels,
            status: formData.status as "actif" | "inactif"
          };
        }
        return f;
      });
    } else {
      const initialLevels: {id: string, name: string}[] = [];
      if (formData.hasLevels && levelCount > 0) {
        for (let i = 1; i <= levelCount; i++) {
          initialLevels.push({ id: `lvl_${i}`, name: `Niveau ${i}` });
        }
      }
      
      const newFormation: Formation = {
        id: `form_${Date.now()}`,
        name: formData.name,
        duration: formData.duration,
        totalCost: parseInt(formData.totalCost),
        hasLevels: formData.hasLevels,
        levelCount: levelCount > 0 ? levelCount : undefined,
        levels: initialLevels,
        status: formData.status as "actif" | "inactif"
      };
      updated = [newFormation, ...formations];
    }
    setFormations(updated);
    localStorage.setItem('warriors_mock_formations', JSON.stringify(updated));
    setIsModalOpen(false);
    showToast(editingFormation ? "Formation modifiée avec succès." : "Formation ajoutée avec succès.");
  };

  const handleDelete = (id: string) => {
    const updated = formations.filter(f => f.id !== id);
    setFormations(updated);
    localStorage.setItem('warriors_mock_formations', JSON.stringify(updated));
    showToast("Formation supprimée.");
  };

  const saveLevelName = (formationId: string, levelId: string) => {
    if (!editingLevelName.trim()) return;
    const updated = formations.map(f => {
      if (f.id === formationId) {
        const updatedLevels = (f.levels || []).map(l => 
          l.id === levelId ? { ...l, name: editingLevelName } : l
        );
        return { ...f, levels: updatedLevels };
      }
      return f;
    });
    setFormations(updated);
    localStorage.setItem('warriors_mock_formations', JSON.stringify(updated));
    setEditingLevelId(null);
    showToast("Nom du niveau mis à jour.");
  };

  const filteredFormations = formations.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getCentersForFormation = (formationId: string) => {
    const formationClasses = classes.filter(c => c.formationId === formationId);
    const centerIds = Array.from(new Set(formationClasses.map(c => c.centerId)));
    const formationCenters = centers.filter(c => centerIds.includes(c.id));
    return formationCenters.map(c => c.name).join(', ') || '-';
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Formations</h1>
          <p className="text-sm text-muted-foreground mt-1">Gérez le catalogue des formations proposées et leurs niveaux.</p>
        </div>
        <button 
          onClick={openAddModal}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Créer une formation
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Rechercher une formation..." 
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
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Chargement...</div>
        ) : formations.length === 0 ? (
          <div className="p-8 text-center">
            <h3 className="text-lg font-medium text-foreground mb-2">Aucune formation</h3>
            <p className="text-sm text-muted-foreground">Il n'y a actuellement aucune formation enregistrée.</p>
          </div>
        ) : (
          <div className="overflow-x-auto pb-24 min-h-[250px]">
            <table className="w-full text-sm text-left">
              <thead className="bg-secondary/50 text-muted-foreground uppercase text-xs tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-medium">Formation</th>
                  <th className="px-6 py-4 font-medium">Durée</th>
                  <th className="px-6 py-4 font-medium">Niveaux</th>
                  <th className="px-6 py-4 font-medium">Frais</th>
                  <th className="px-6 py-4 font-medium">Centres</th>
                  <th className="px-6 py-4 font-medium">Statut</th>
                  <th className="px-6 py-4 font-medium text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredFormations.map((f) => (
                  <React.Fragment key={f.id}>
                    <tr 
                      onClick={() => setSelectedFormationId(selectedFormationId === f.id ? null : f.id)}
                      className={`hover:bg-secondary/30 transition-colors cursor-pointer ${selectedFormationId === f.id ? 'bg-secondary/20' : ''}`}
                    >
                      <td className="px-6 py-4 font-medium text-foreground">{f.name}</td>
                      <td className="px-6 py-4 text-muted-foreground">{f.duration}</td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {f.hasLevels ? `${f.levelCount || f.levels?.length || 0} niveaux` : '-'}
                      </td>
                      <td className="px-6 py-4 font-medium">{formatCurrency(f.totalCost)}</td>
                      <td className="px-6 py-4 text-muted-foreground">{getCentersForFormation(f.id)}</td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className={`font-normal ${f.status === 'inactif' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-green-50 text-green-600 border-green-200'}`}>
                          {f.status === 'inactif' ? 'Inactif' : 'Actif'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(f);
                          }}
                          className="text-foreground font-medium text-sm hover:underline"
                        >
                          Modifier
                        </button>
                      </td>
                    </tr>
                    
                    {/* Inline Expandable Levels Panel */}
                    {selectedFormationId === f.id && f.hasLevels && f.levels && f.levels.length > 0 && (
                      <tr className="bg-secondary/5 border-b border-border">
                        <td colSpan={7} className="p-0">
                          <div className="p-6 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="bg-background border border-border rounded-lg p-5 max-w-3xl">
                              <h3 className="text-sm font-semibold text-foreground mb-3 pb-2 border-b border-border flex items-center justify-between">
                                <span>Niveaux — {f.name}</span>
                              </h3>
                              <div className="space-y-0">
                                {f.levels.map((level) => {
                                  const enrolledCount = students.filter(s => {
                                    const c = classes.find(cls => cls.id === s.classId);
                                    return c?.formationId === f.id && s.currentLevel === level.id;
                                  }).length;

                                  return (
                                    <div key={level.id} className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0 group">
                                      <div className="flex items-center gap-2 flex-1">
                                        {editingLevelId === level.id ? (
                                          <div className="flex items-center gap-2 w-full max-w-sm">
                                            <input
                                              type="text"
                                              value={editingLevelName}
                                              onChange={(e) => setEditingLevelName(e.target.value)}
                                              className="flex-1 px-3 py-1 text-sm border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary bg-background"
                                              autoFocus
                                              onKeyDown={(e) => {
                                                if (e.key === 'Enter') saveLevelName(f.id, level.id);
                                                if (e.key === 'Escape') setEditingLevelId(null);
                                              }}
                                            />
                                            <button
                                              onClick={() => saveLevelName(f.id, level.id)}
                                              className="p-1 text-primary hover:bg-primary/10 rounded"
                                            >
                                              <Check className="w-4 h-4" />
                                            </button>
                                            <button
                                              onClick={() => setEditingLevelId(null)}
                                              className="p-1 text-muted-foreground hover:bg-secondary rounded"
                                            >
                                              <X className="w-4 h-4" />
                                            </button>
                                          </div>
                                        ) : (
                                          <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-foreground">{level.name}</span>
                                            <button
                                              onClick={() => {
                                                setEditingLevelId(level.id);
                                                setEditingLevelName(level.name);
                                              }}
                                              className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-primary transition-opacity"
                                              title="Modifier le nom du niveau"
                                            >
                                              <Edit className="w-3.5 h-3.5" />
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                      <div className="text-sm text-muted-foreground">
                                        {enrolledCount} inscrit{enrolledCount > 1 ? 's' : ''}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={editingFormation ? "Éditer la formation" : "Créer une formation"}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nom de la formation</label>
            <input 
              type="text" 
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              required
              className="w-full p-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm" 
              placeholder="Ex: Anglais professionnel"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Durée</label>
              <input 
                type="text" 
                value={formData.duration}
                onChange={e => setFormData({...formData, duration: e.target.value})}
                required
                className="w-full p-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm" 
                placeholder="Ex: 9 mois"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Frais (FCFA)</label>
              <input 
                type="number" 
                value={formData.totalCost}
                onChange={e => setFormData({...formData, totalCost: e.target.value})}
                required
                min="0"
                className="w-full p-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm" 
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Statut</label>
            <Select
              value={formData.status}
              onChange={(val) => setFormData({...formData, status: val})}
              options={[
                { value: "actif", label: "Actif" },
                { value: "inactif", label: "Inactif" }
              ]}
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input 
              type="checkbox" 
              checked={formData.hasLevels}
              onChange={e => setFormData({...formData, hasLevels: e.target.checked})}
              id="has_levels"
              className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
            />
            <label htmlFor="has_levels" className="text-sm font-medium">Cette formation a des niveaux (ex: Débutant, Avancé)</label>
          </div>

          {formData.hasLevels && (
            <div className="space-y-2 pt-2 animate-in fade-in">
              <label className="text-sm font-medium text-muted-foreground">Nombre de niveaux</label>
              <input 
                type="number" 
                value={formData.levelCount}
                onChange={e => setFormData({...formData, levelCount: e.target.value})}
                min="1"
                required={formData.hasLevels}
                className="w-full p-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm" 
              />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
            <button 
              type="button" 
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm font-medium border border-border rounded-md hover:bg-secondary transition-colors"
            >
              Annuler
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors"
            >
              {editingFormation ? "Enregistrer" : "Créer"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

