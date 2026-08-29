"use client";

import React, { useState, useEffect, useRef } from "react";
import { Upload, Building2, Save, AlertTriangle, Trash2, User as UserIcon, Shield } from "lucide-react";
import { Organization, mockOrganization } from "@/lib/data/mockData";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/lib/store/useUIStore";

type Tab = "profile" | "organization" | "security";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  
  const showToast = useUIStore(state => state.showToast);
  
  // Organization State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [orgFormData, setOrgFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    logoUrl: ""
  });

  // User Profile State
  const userFileInputRef = useRef<HTMLInputElement>(null);
  const [userFormData, setUserFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    avatarUrl: "",
  });

  useEffect(() => {
    try {
      // Load Org
      const storedOrg = localStorage.getItem('warriors_mock_organization');
      const loadedOrg: Organization = storedOrg ? JSON.parse(storedOrg) : mockOrganization;
      setOrg(loadedOrg);
      setOrgFormData({
        name: loadedOrg.name,
        email: loadedOrg.email || "",
        phone: loadedOrg.phone || "",
        address: loadedOrg.address || "",
        logoUrl: loadedOrg.logoUrl || ""
      });

      // Load User
      const storedUser = localStorage.getItem('warriors_mock_user');
      if (storedUser) {
        const loadedUser = JSON.parse(storedUser);
        setUserFormData({
          firstName: loadedUser.firstName || "",
          lastName: loadedUser.lastName || "",
          email: loadedUser.email || "admin@warriors-management.com",
          password: "••••••••",
          avatarUrl: loadedUser.avatarUrl || "",
        });
      } else {
        setUserFormData({
          firstName: "Admin",
          lastName: "System",
          email: "admin@warriors-management.com",
          password: "••••••••",
          avatarUrl: "",
        });
      }
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
        setOrgFormData(prev => ({
          ...prev,
          logoUrl: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUserImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUserFormData(prev => ({
          ...prev,
          avatarUrl: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOrgSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!org) return;
    const updated: Organization = {
      ...org,
      name: orgFormData.name,
      email: orgFormData.email,
      phone: orgFormData.phone,
      address: orgFormData.address,
      logoUrl: orgFormData.logoUrl
    };
    setOrg(updated);
    localStorage.setItem('warriors_mock_organization', JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('organization_updated', { detail: updated }));
    showToast("Paramètres d'organisation enregistrés avec succès.");
  };

  const handleUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedUser = {
      firstName: userFormData.firstName,
      lastName: userFormData.lastName,
      email: userFormData.email,
      role: "ADMIN", // keep it admin
      avatarUrl: userFormData.avatarUrl
    };
    localStorage.setItem('warriors_mock_user', JSON.stringify(updatedUser));
    window.dispatchEvent(new CustomEvent('user_profile_updated', { detail: updatedUser }));
    showToast("Profil utilisateur enregistré avec succès.");
  };

  const handlePasswordUpdate = () => {
    // Fake logic for password update
    if (userFormData.password && userFormData.password !== "••••••••") {
      showToast("Mot de passe mis à jour avec succès.");
    } else {
      showToast("Veuillez saisir un nouveau mot de passe.");
    }
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
    <div className="space-y-6 pb-24 min-h-[250px]">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Paramètres</h1>
        <p className="text-sm text-muted-foreground mt-1">Gérez votre profil personnel et l'organisation.</p>
      </div>

      <div className="flex flex-col md:flex-row bg-card border border-border rounded-xl shadow-none overflow-hidden min-h-[600px]">
        {/* Sidebar */}
        <div className="w-full md:w-64 border-r border-border p-4 bg-secondary/10 flex-shrink-0 flex flex-col gap-6">
          
          <div>
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
              Paramètres Généraux
            </div>
            <div className="space-y-1">
              <button 
                onClick={() => setActiveTab("profile")}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                  activeTab === "profile" 
                    ? "bg-secondary text-foreground font-semibold" 
                    : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                )}
              >
                <UserIcon className="w-4 h-4" />
                Mon Profil
              </button>
              <button 
                onClick={() => setActiveTab("organization")}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                  activeTab === "organization" 
                    ? "bg-secondary text-foreground font-semibold" 
                    : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                )}
              >
                <Building2 className="w-4 h-4" />
                Organisation
              </button>
            </div>
          </div>

          <div>
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
              Espace de Travail
            </div>
            <div className="space-y-1">
              <button 
                onClick={() => setActiveTab("security")}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                  activeTab === "security" 
                    ? "bg-rose-50 text-rose-600 font-semibold" 
                    : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                )}
              >
                <Shield className="w-4 h-4" />
                Sécurité & Données
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 md:p-8">
          
          {/* PROFIL TAB */}
          {activeTab === "profile" && (
            <div className="max-w-2xl space-y-8 animate-in fade-in duration-300">
              <div className="border-b border-border pb-4">
                <h2 className="text-xl font-semibold text-foreground">Mon Profil</h2>
                <p className="text-sm text-muted-foreground mt-1">Gérez vos informations personnelles et votre sécurité.</p>
              </div>

              <form onSubmit={handleUserSubmit} className="space-y-8">
                {/* Avatar (simulé) */}
                <div className="flex items-center gap-6">
                  {userFormData.avatarUrl ? (
                    <div className="w-20 h-20 rounded-full overflow-hidden bg-white shadow-sm border border-border">
                      <img src={userFormData.avatarUrl} alt="User Avatar" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-2xl font-bold shadow-sm">
                      {userFormData.firstName.charAt(0)}{userFormData.lastName.charAt(0)}
                    </div>
                  )}
                  <div className="flex gap-3">
                    <input 
                      type="file"
                      ref={userFileInputRef}
                      onChange={handleUserImageUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button type="button" onClick={() => userFileInputRef.current?.click()} className="px-4 py-2 bg-secondary text-foreground text-sm font-medium rounded-md hover:bg-secondary/80 transition-colors">
                      Changer l'image
                    </button>
                    <button type="button" onClick={() => setUserFormData({...userFormData, avatarUrl: ""})} className="px-4 py-2 bg-background border border-border text-muted-foreground text-sm font-medium rounded-md hover:bg-secondary transition-colors">
                      Supprimer
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Prénom</label>
                    <input 
                      type="text" 
                      value={userFormData.firstName}
                      onChange={e => setUserFormData({...userFormData, firstName: e.target.value})}
                      required
                      className="w-full p-2.5 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Nom</label>
                    <input 
                      type="text" 
                      value={userFormData.lastName}
                      onChange={e => setUserFormData({...userFormData, lastName: e.target.value})}
                      required
                      className="w-full p-2.5 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm" 
                    />
                  </div>
                </div>

                <div className="pt-6 border-t border-border space-y-6">
                  <h3 className="text-lg font-semibold text-foreground">Sécurité du compte</h3>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Adresse Email</label>
                    <div className="flex gap-3">
                      <input 
                        type="email" 
                        value={userFormData.email}
                        onChange={e => setUserFormData({...userFormData, email: e.target.value})}
                        required
                        className="flex-1 p-2.5 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm" 
                      />
                      <button type="button" className="px-4 py-2 bg-secondary text-foreground text-sm font-medium rounded-md hover:bg-secondary/80 transition-colors whitespace-nowrap">
                        Modifier l'email
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Mot de passe</label>
                    <div className="flex gap-3">
                      <input 
                        type="password" 
                        value={userFormData.password}
                        onChange={e => setUserFormData({...userFormData, password: e.target.value})}
                        className="flex-1 p-2.5 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm" 
                      />
                      <button type="button" onClick={handlePasswordUpdate} className="px-4 py-2 bg-secondary text-foreground text-sm font-medium rounded-md hover:bg-secondary/80 transition-colors whitespace-nowrap">
                        Modifier le mot de passe
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button 
                    type="submit" 
                    className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors shadow-sm"
                  >
                    <Save className="w-4 h-4" />
                    Enregistrer le profil
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ORGANISATION TAB */}
          {activeTab === "organization" && (
            <div className="max-w-2xl space-y-8 animate-in fade-in duration-300">
              <div className="border-b border-border pb-4">
                <h2 className="text-xl font-semibold text-foreground">Informations de l'Organisation</h2>
                <p className="text-sm text-muted-foreground mt-1">Ces informations seront utilisées sur les reçus et factures.</p>
              </div>

              <form onSubmit={handleOrgSubmit} className="space-y-8">
                <div className="flex flex-col sm:flex-row gap-6 items-start">
                  <div className="flex-shrink-0 flex flex-col items-center gap-3">
                    <div 
                      className="w-32 h-32 bg-secondary rounded-xl border border-dashed border-border flex items-center justify-center overflow-hidden bg-cover bg-center cursor-pointer hover:border-primary/50 transition-colors"
                      style={orgFormData.logoUrl ? { backgroundImage: `url(${orgFormData.logoUrl})` } : {}}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {!orgFormData.logoUrl && (
                        <div className="text-center text-muted-foreground flex flex-col items-center">
                          <Upload className="w-6 h-6 mb-2" />
                          <span className="text-xs font-medium">Ajouter un logo</span>
                        </div>
                      )}
                    </div>
                    {orgFormData.logoUrl && (
                      <button 
                        type="button"
                        onClick={() => setOrgFormData({...orgFormData, logoUrl: ""})}
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
                        value={orgFormData.name}
                        onChange={e => setOrgFormData({...orgFormData, name: e.target.value})}
                        required
                        className="w-full p-2.5 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm" 
                        placeholder="Ex: Warriors Management"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Email de contact</label>
                      <input 
                        type="email" 
                        value={orgFormData.email}
                        onChange={e => setOrgFormData({...orgFormData, email: e.target.value})}
                        className="w-full p-2.5 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm" 
                        placeholder="contact@organisation.com"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Téléphone</label>
                    <input 
                      type="text" 
                      value={orgFormData.phone}
                      onChange={e => setOrgFormData({...orgFormData, phone: e.target.value})}
                      className="w-full p-2.5 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm" 
                      placeholder="+225 00 00 00 00"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Adresse complète</label>
                    <input 
                      type="text" 
                      value={orgFormData.address}
                      onChange={e => setOrgFormData({...orgFormData, address: e.target.value})}
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
                    Enregistrer l'organisation
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* SECURITY TAB */}
          {activeTab === "security" && (
            <div className="max-w-2xl space-y-8 animate-in fade-in duration-300">
              <div className="border-b border-border pb-4">
                <h2 className="text-xl font-semibold text-rose-600">Sécurité et Données</h2>
                <p className="text-sm text-muted-foreground mt-1">Actions sensibles et irréversibles.</p>
              </div>

              <div className="border border-rose-200 rounded-xl overflow-hidden">
                <div className="p-6 bg-rose-50/50">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-rose-100 rounded-lg text-rose-600 shrink-0">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <h3 className="text-base font-semibold text-rose-900">Effacer toutes les données</h3>
                      <p className="text-sm text-rose-700/80">
                        Cette action est permanente. Elle supprimera toutes les données stockées localement (étudiants, paiements, classes, configurations) et réinitialisera l'application à zéro.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-rose-100/30 border-t border-rose-200 flex justify-end">
                  <button
                    onClick={handleClearData}
                    className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 text-white hover:bg-rose-700 text-sm font-medium rounded-md transition-colors shadow-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                    Réinitialiser les données
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
