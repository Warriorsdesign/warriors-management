"use client";

import React, { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { mockCenters } from "@/lib/data/mockData";

export default function CentersPage() {
  const [centers, setCenters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Centres</h1>
          <p className="text-sm text-muted-foreground mt-1">Gérez les centres de formation.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
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
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {centers.map((c) => (
                  <tr key={c.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground">{c.name}</td>
                    <td className="px-6 py-4 text-muted-foreground">{c.address || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${c.status === 'actif' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        {c.status}
                      </span>
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
        onClose={() => setIsModalOpen(false)}
        title="Ajouter un centre"
      >
        <div className="p-4 text-center">
          <p className="text-sm text-muted-foreground">La création de centres est actuellement désactivée en mode local.</p>
        </div>
      </Modal>
    </div>
  );
}
