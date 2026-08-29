"use client";

import React, { useState, useEffect, useRef } from "react";
import { Upload, Building2, Save, AlertTriangle, Trash2 } from "lucide-react";
import { Organization, mockOrganization } from "@/lib/data/mockData";

export default function SettingsPage() {
  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    logoUrl: ""
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem('warriors_mock_organization');
      const loaded: Organization = stored ? JSON.parse(stored) : mockOrganization;
      setOrg(loaded);
      setFormData({
        name: loaded.name,
        email: loaded.email || "",
        phone: loaded.phone || "",
        address: loaded.address || "",
        logoUrl: loaded.logoUrl || ""
      });
    } catch (e) {
      console.error("Failed to load local data", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          logoUrl: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!org) return;
    const updated: Organization = {
      ...org,
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
      logoUrl: formData.logoUrl
    };
    setOrg(updated);
    localStorage.setItem('warriors_mock_organization', JSON.stringify(updated));
    // Afficher une notification visuelle de succès si possible, sinon alerter discrètement
    alert("Paramètres enregistrés avec succès.");
  };

  const handleClearData = () => {
    if (window.confirm("Êtes-vous sûr de vouloir effacer TOUTES les données ? Cette action est irréversible et supprimera tous les étudiants, paiements, classes et configurations.")) {
      localStorage.clear();
      window.location.href = "/";
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Chargement...</div>;
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Paramètres</h1>
          <p className="text-sm text-muted-foreground mt-1">Gérez votre profil et l'organisation.</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-none overflow-hidden max-w-2xl">
        <div className="p-6 border-b border-border bg-secondary/20">
          <div className="flex items-center gap-3">
            <Building2 className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Informations de l'Organisation</h2>
          </div>
          <p className="text-sm text-muted-foreground mt-1 ml-8">Ces informations seront utilisées sur les reçus et factures.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <div className="flex-shrink-0 flex flex-col items-center gap-3">
              <div 
                className="w-32 h-32 bg-secondary rounded-xl border border-dashed border-border flex items-center justify-center overflow-hidden bg-cover bg-center cursor-pointer hover:border-primary/50 transition-colors"
                style={formData.logoUrl ? { backgroundImage: `url(${formData.logoUrl})` } : {}}
                onClick={() => fileInputRef.current?.click()}
              >
                {!formData.logoUrl && (
                  <div className="text-center text-muted-foreground flex flex-col items-center">
                    <Upload className="w-6 h-6 mb-2" />
                    <span className="text-xs font-medium">Ajouter un logo</span>
                  </div>
                )}
              </div>
              {formData.logoUrl && (
                <button 
                  type="button"
                  onClick={() => setFormData({...formData, logoUrl: ""})}
                  className="text-xs text-destructive hover:underline"
                >
                  Supprimer le logo
                </button>
              )}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                accept="image/*" 
                className="hidden" 
              />
            </div>
            
            <div className="flex-1 w-full space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Nom de l'organisation</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  required
                  className="w-full p-2.5 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm" 
                  placeholder="Ex: Warriors Management"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Email de contact</label>
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="w-full p-2.5 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm" 
                  placeholder="contact@organisation.com"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Téléphone</label>
              <input 
                type="text" 
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
                className="w-full p-2.5 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm" 
                placeholder="+225 00 00 00 00"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Adresse complète</label>
              <input 
                type="text" 
                value={formData.address}
                onChange={e => setFormData({...formData, address: e.target.value})}
                className="w-full p-2.5 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm" 
                placeholder="Rue, Ville, Pays"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-border flex justify-end">
            <button 
              type="submit" 
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors shadow-sm"
            >
              <Save className="w-4 h-4" />
              Enregistrer les modifications
            </button>
          </div>
        </form>
      </div>

      <div className="bg-card border border-rose-200 rounded-xl shadow-none overflow-hidden max-w-2xl mt-8">
        <div className="p-6 border-b border-rose-200 bg-rose-50/50">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            <h2 className="text-lg font-semibold text-rose-900">Zone de Danger</h2>
          </div>
          <p className="text-sm text-rose-600/80 mt-1 ml-8">Actions irréversibles concernant les données de l'application.</p>
        </div>
        <div className="p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-sm font-medium text-foreground">Effacer toutes les données</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-md">
                Cette action supprimera toutes les données stockées localement (étudiants, paiements, classes, etc.) et réinitialisera l'application à zéro.
              </p>
            </div>
            <button
              onClick={handleClearData}
              className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-rose-100 text-rose-700 hover:bg-rose-200 hover:text-rose-800 text-sm font-medium rounded-md transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Réinitialiser les données
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
