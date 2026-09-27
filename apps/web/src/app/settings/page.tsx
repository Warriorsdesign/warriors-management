"use client";

import React, { useState, useEffect, useRef } from "react";
import { Upload, Building2, Save, User as UserIcon, CreditCard } from "lucide-react";
import { useSession, useCan, updateOwnProfile, changeOwnPassword } from "@/lib/hooks/useSession";
import { useOrganization, updateOrganization } from "@/lib/hooks/useOrganization";
import { ApiClientError } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/lib/store/useUIStore";
import { SubscriptionSettings } from "@/components/settings/SubscriptionSettings";
import { RoleSettings } from "@/components/settings/RoleSettings";
import { Shield } from "lucide-react";

type Tab = "profile" | "organization" | "roles" | "subscription";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const { user } = useSession();
  const { organization } = useOrganization();
  const canReadOrg = useCan("organization", "read");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
  const [isSubmittingOrg, setIsSubmittingOrg] = useState(false);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

  const showToast = useUIStore(state => state.showToast);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [orgFormData, setOrgFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    logoUrl: ""
  });

  const userFileInputRef = useRef<HTMLInputElement>(null);
  const [userFormData, setUserFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    avatarUrl: "",
  });
  const [passwordFormData, setPasswordFormData] = useState({ currentPassword: "", newPassword: "" });

  useEffect(() => {
    if (organization) {
      setOrgFormData({
        name: organization.name,
        email: organization.email || "",
        phone: organization.phone || "",
        address: organization.address || "",
        logoUrl: organization.logoUrl || "",
      });
    }
  }, [organization]);

  useEffect(() => {
    if (user) {
      setUserFormData({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        avatarUrl: user.avatarUrl || "",
      });
    }
  }, [user]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setOrgFormData(prev => ({ ...prev, logoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUserImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUserFormData(prev => ({ ...prev, avatarUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOrgSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgFormData.name.trim()) {
      setErrors({ orgName: "Veuillez renseigner le nom de l'organisation." });
      return;
    }
    setErrors({});
    setIsSubmittingOrg(true);
    try {
      await updateOrganization({
        name: orgFormData.name,
        email: orgFormData.email || null,
        phone: orgFormData.phone || null,
        address: orgFormData.address || null,
        logoUrl: orgFormData.logoUrl || null,
      });
      showToast("Paramètres d'organisation enregistrés avec succès.");
    } catch (err) {
      showToast(err instanceof ApiClientError ? err.message : "Une erreur est survenue.", "error");
    } finally {
      setIsSubmittingOrg(false);
    }
  };

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    if (!userFormData.firstName.trim()) newErrors.firstName = "Veuillez renseigner votre prénom.";
    if (!userFormData.lastName.trim()) newErrors.lastName = "Veuillez renseigner votre nom.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    setIsSubmittingProfile(true);
    try {
      await updateOwnProfile({
        firstName: userFormData.firstName,
        lastName: userFormData.lastName,
        email: userFormData.email,
        avatarUrl: userFormData.avatarUrl || null,
      });
      showToast("Profil utilisateur enregistré avec succès.");
    } catch (err) {
      showToast(err instanceof ApiClientError ? err.message : "Une erreur est survenue.", "error");
    } finally {
      setIsSubmittingProfile(false);
    }
  };

  const handlePasswordUpdate = async () => {
    if (!passwordFormData.currentPassword || !passwordFormData.newPassword) {
      showToast("Veuillez renseigner le mot de passe actuel et le nouveau.", "error");
      return;
    }
    setIsSubmittingPassword(true);
    try {
      await changeOwnPassword(passwordFormData);
      showToast("Mot de passe mis à jour avec succès.");
      setPasswordFormData({ currentPassword: "", newPassword: "" });
    } catch (err) {
      showToast(err instanceof ApiClientError ? err.message : "Une erreur est survenue.", "error");
    } finally {
      setIsSubmittingPassword(false);
    }
  };

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
              {canReadOrg && (
                <>
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
                  <button
                    onClick={() => setActiveTab("roles")}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                      activeTab === "roles"
                        ? "bg-secondary text-foreground font-semibold"
                        : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                    )}
                  >
                    <Shield className="w-4 h-4" />
                    Rôles & Permissions
                  </button>
                  <button
                    onClick={() => setActiveTab("subscription")}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                      activeTab === "subscription"
                        ? "bg-secondary text-foreground font-semibold"
                        : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                    )}
                  >
                    <CreditCard className="w-4 h-4" />
                    Abonnement & Factures
                  </button>
                </>
              )}
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
                      onChange={(e) => {
                        setUserFormData({...userFormData, firstName: e.target.value});
                        if (errors.firstName) setErrors({ ...errors, firstName: '' });
                      }}
                      className={cn(
                        "w-full p-2.5 border rounded-md bg-background focus:outline-none focus:ring-2 transition-all text-sm",
                        errors.firstName ? "border-red-500 focus:ring-red-500/50 animate-shake" : "border-border focus:ring-primary/50"
                      )}
                    />
                    {errors.firstName && <p className="text-xs text-red-500">{errors.firstName}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Nom</label>
                    <input
                      type="text"
                      value={userFormData.lastName}
                      onChange={(e) => {
                        setUserFormData({...userFormData, lastName: e.target.value});
                        if (errors.lastName) setErrors({ ...errors, lastName: '' });
                      }}
                      className={cn(
                        "w-full p-2.5 border rounded-md bg-background focus:outline-none focus:ring-2 transition-all text-sm",
                        errors.lastName ? "border-red-500 focus:ring-red-500/50 animate-shake" : "border-border focus:ring-primary/50"
                      )}
                    />
                    {errors.lastName && <p className="text-xs text-red-500">{errors.lastName}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Adresse Email</label>
                  <input
                    type="email"
                    value={userFormData.email}
                    onChange={e => setUserFormData({...userFormData, email: e.target.value})}
                    required
                    className="w-full p-2.5 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm"
                  />
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmittingProfile}
                    className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {isSubmittingProfile ? "Enregistrement..." : "Enregistrer le profil"}
                  </button>
                </div>
              </form>

              <div className="pt-6 border-t border-border space-y-6">
                <h3 className="text-lg font-semibold text-foreground">Sécurité du compte</h3>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Mot de passe actuel</label>
                  <input
                    type="password"
                    value={passwordFormData.currentPassword}
                    onChange={e => setPasswordFormData({...passwordFormData, currentPassword: e.target.value})}
                    className="w-full p-2.5 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Nouveau mot de passe</label>
                  <div className="flex gap-3">
                    <input
                      type="password"
                      value={passwordFormData.newPassword}
                      onChange={e => setPasswordFormData({...passwordFormData, newPassword: e.target.value})}
                      className="flex-1 p-2.5 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm"
                    />
                    <button
                      type="button"
                      disabled={isSubmittingPassword}
                      onClick={handlePasswordUpdate}
                      className="px-4 py-2 bg-secondary text-foreground text-sm font-medium rounded-md hover:bg-secondary/80 transition-colors whitespace-nowrap disabled:opacity-50"
                    >
                      {isSubmittingPassword ? "..." : "Modifier le mot de passe"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ORGANISATION TAB */}
          {activeTab === "organization" && canReadOrg && (
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
                        onChange={(e) => {
                          setOrgFormData({...orgFormData, name: e.target.value});
                          if (errors.orgName) setErrors({ ...errors, orgName: '' });
                        }}
                        className={cn(
                          "w-full p-2.5 border rounded-md bg-background focus:outline-none focus:ring-2 transition-all text-sm",
                          errors.orgName ? "border-red-500 focus:ring-red-500/50 animate-shake" : "border-border focus:ring-primary/50"
                        )}
                        placeholder="Ex: Warriors Management"
                      />
                      {errors.orgName && <p className="text-xs text-red-500">{errors.orgName}</p>}
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
                      placeholder="+237 6XX XXX XXX"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Adresse complète</label>
                    <input
                      type="text"
                      value={orgFormData.address}
                      onChange={e => setOrgFormData({...orgFormData, address: e.target.value})}
                      className="w-full p-2.5 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm"
                      placeholder="Bonamoussadi, Douala"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-border flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmittingOrg}
                    className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {isSubmittingOrg ? "Enregistrement..." : "Enregistrer l'organisation"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ROLES TAB */}
          {activeTab === "roles" && canReadOrg && (
            <RoleSettings />
          )}

          {/* ABONNEMENT TAB */}
          {activeTab === "subscription" && canReadOrg && (
            <SubscriptionSettings />
          )}

        </div>
      </div>
    </div>
  );
}
