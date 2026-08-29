"use client";

import React, { useState, useEffect } from "react";
import { Plus, MoreHorizontal, Edit, Trash2, Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { mockClasses, mockFormations, mockCenters, ClassGroup, Formation, Center, getComputedClassStatus, mockStudents } from "@/lib/data/mockData";
import { useUIStore } from "@/lib/store/useUIStore";

export default function ClassesPage() {
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [formations, setFormations] = useState<Formation[]>([]);
  const [centers, setCenters] = useState<Center[]>([]);
  const [studentsCountMap, setStudentsCountMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassGroup | null>(null);
  const [classToDelete, setClassToDelete] = useState<ClassGroup | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const showToast = useUIStore(state => state.showToast);
  const [selectedFormation, setSelectedFormation] = useState<string>("Toutes");
  const [selectedCenter, setSelectedCenter] = useState<string>("Tous");

  const [formData, setFormData] = useState({
    name: "",
    formationId: "",
    centerId: "center_1",
    capacity: "30",
  });

  useEffect(() => {
    try {
      // Load formations
      const storedFormations = localStorage.getItem('warriors_mock_formations');
      const loadedFormations = storedFormations ? JSON.parse(storedFormations) : mockFormations;
      setFormations(loadedFormations);
      
      // Load classes
      const storedClasses = localStorage.getItem('warriors_mock_classes');
      const loadedClasses = storedClasses ? JSON.parse(storedClasses) : mockClasses;
      setClasses(loadedClasses);

      // Load centers
      const storedCenters = localStorage.getItem('warriors_mock_centers');
      const loadedCenters = storedCenters ? JSON.parse(storedCenters) : mockCenters;
      setCenters(loadedCenters);

      // Load students to compute capacity properly
      const storedStudents = localStorage.getItem('warriors_mock_students');
      const loadedStudents = storedStudents ? JSON.parse(storedStudents) : mockStudents;
      
      const counts: Record<string, number> = {};
      loadedClasses.forEach((c: ClassGroup) => counts[c.id] = 0);
      loadedStudents.forEach((s: any) => {
        if (s.classId && counts[s.classId] !== undefined) {
          counts[s.classId] += 1;
        }
      });
      setStudentsCountMap(counts);

    } catch (e) {
      console.error("Failed to load local data", e);
    } finally {
      setLoading(false);
    }

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
      centerId: "center_1",
      capacity: "30",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (c: ClassGroup) => {
    setEditingClass(c);
    setFormData({
      name: c.name,
      formationId: c.formationId,
      centerId: c.centerId,
      capacity: c.capacity.toString(),
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let updated;
    if (editingClass) {
      updated = classes.map(c => c.id === editingClass.id ? {
        ...c,
        name: formData.name,
        formationId: formData.formationId,
        centerId: formData.centerId,
        capacity: parseInt(formData.capacity),
      } : c);
    } else {
      const newClass: ClassGroup = {
        id: `class_${Date.now()}`,
        name: formData.name,
        formationId: formData.formationId,
        centerId: formData.centerId,
        status: 'ouverte',
        capacity: parseInt(formData.capacity),
      };
      updated = [newClass, ...classes];
    }
    setClasses(updated);
    localStorage.setItem('warriors_mock_classes', JSON.stringify(updated));
    setIsModalOpen(false);
    showToast(editingClass ? "Classe modifiée avec succès." : "Classe ajoutée avec succès.");
  };

  const handleDelete = () => {
    if (classToDelete) {
      const updated = classes.filter(c => c.id !== classToDelete.id);
      setClasses(updated);
      localStorage.setItem('warriors_mock_classes', JSON.stringify(updated));
      setClassToDelete(null);
      showToast("Classe supprimée.");
    }
  };

  const getFormationName = (id: string) => {
    const f = formations.find(f => f.id === id);
    return f ? f.name : 'Inconnue';
  };

  const formationOptions = formations.map(f => ({ label: f.name, value: f.id }));

  const filteredClasses = classes.filter(c => {
    let match = true;
    if (selectedFormation !== "Toutes" && c.formationId !== selectedFormation) match = false;
    if (selectedCenter !== "Tous" && c.centerId !== selectedCenter) match = false;
    if (searchQuery && !c.name.toLowerCase().includes(searchQuery.toLowerCase())) match = false;
    return match;
  });

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Classes</h1>
          <p className="text-sm text-muted-foreground mt-1">Gérez les cohortes et classes.</p>
        </div>
        <button 
          onClick={openAddModal}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Nouvelle classe
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="relative w-full md:w-96">
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
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto ml-auto">
          <div className="w-full sm:w-48">
            <Select 
              options={[{label: "Toutes les formations", value: "Toutes"}, ...formations.map(f => ({ label: f.name, value: f.id }))]}
              value={selectedFormation}
              onChange={(val) => setSelectedFormation(val)}
            />
          </div>
          <div className="w-full sm:w-48">
            <Select 
              options={[{label: "Tous les centres", value: "Tous"}, ...centers.map(c => ({ label: c.name, value: c.id }))]}
              value={selectedCenter}
              onChange={(val) => setSelectedCenter(val)}
            />
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-none overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Chargement...</div>
        ) : classes.length === 0 ? (
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
                  <th className="px-6 py-3 font-medium w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredClasses.map((c) => {
                  const enrolled = studentsCountMap[c.id] || 0;
                  const computedStatus = getComputedClassStatus(c, enrolled);
                  
                  return (
                    <tr key={c.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="px-6 py-4 font-medium text-foreground">{c.name}</td>
                      <td className="px-6 py-4 text-muted-foreground">{getFormationName(c.formationId)}</td>
                      <td className="px-6 py-4">
                        {computedStatus === 'ouverte' ? (
                           <Badge variant="success" className="px-2 py-0.5 text-[11px] whitespace-nowrap"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>Ouverte</Badge>
                        ) : (
                           <Badge variant="destructive" className="px-2 py-0.5 text-[11px] whitespace-nowrap"><span className="w-1.5 h-1.5 rounded-full bg-destructive mr-1.5"></span>Complète</Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-medium text-foreground">{enrolled}</span>
                        <span className="text-muted-foreground"> / {c.capacity}</span>
                      </td>
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
                              <Edit className="w-4 h-4" /> Éditer
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
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={editingClass ? "Éditer la classe" : "Créer une nouvelle classe"}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nom de la classe</label>
            <input 
              type="text" 
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              required
              className="w-full p-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm" 
              placeholder="Ex: Cohorte 2026 - A"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Formation</label>
            <Select 
              options={formationOptions}
              value={formData.formationId}
              onChange={(val) => setFormData({...formData, formationId: val})}
              placeholder="Sélectionner une formation"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Capacité maximale</label>
            <input 
              type="number" 
              value={formData.capacity}
              onChange={e => setFormData({...formData, capacity: e.target.value})}
              required
              min="1"
              className="w-full p-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm" 
            />
          </div>
          


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
              {editingClass ? "Enregistrer" : "Créer la classe"}
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
              <br/>Cette action est <span className="text-destructive font-medium">définitive</span>.
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
