"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { apiFetch, ApiClientError } from "@/lib/api/client";
import { useUIStore } from "@/lib/store/useUIStore";
import { Building2, Mail, Phone, MapPin, Key, Loader2 } from "lucide-react";

interface OrganizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: {
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
  } | null;
}

export function OrganizationModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}: OrganizationModalProps) {
  const showToast = useUIStore((state) => state.showToast);
  const isEditing = Boolean(initialData);

  const [name, setName] = useState(initialData?.name || "");
  const [email, setEmail] = useState(initialData?.email || "");
  const [phone, setPhone] = useState(initialData?.phone || "");
  const [address, setAddress] = useState(initialData?.address || "");
  const [plan, setPlan] = useState("STARTER");

  // Initial Admin fields for creation
  const [createAdmin, setCreateAdmin] = useState(!isEditing);
  const [adminFirstName, setAdminFirstName] = useState("");
  const [adminLastName, setAdminLastName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminMatricule, setAdminMatricule] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    try {
      if (isEditing && initialData) {
        await apiFetch(`/api/admin/organizations/${initialData.id}`, {
          method: "PATCH",
          body: JSON.stringify({ name, email, phone, address }),
        });
        showToast("Organisation mise à jour avec succès.", "success");
      } else {
        const payload: any = {
          name,
          email,
          phone,
          address,
          plan,
        };

        if (createAdmin && adminEmail && adminPassword) {
          payload.initialAdmin = {
            firstName: adminFirstName,
            lastName: adminLastName,
            email: adminEmail,
            matricule: adminMatricule,
            password: adminPassword,
          };
        }

        await apiFetch("/api/admin/organizations", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        showToast("Organisation créée avec succès.", "success");
      }

      onSuccess();
      onClose();
    } catch (err) {
      setErrorMsg(
        err instanceof ApiClientError ? err.message : "Une erreur est survenue."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Modifier l'Organisation" : "Créer une Nouvelle Organisation"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg">
            {errorMsg}
          </div>
        )}

        <div className="space-y-1">
          <label className="text-xs font-semibold text-foreground">
            Nom de l'organisation *
          </label>
          <div className="relative">
            <Building2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Institut Africain de Technologie"
              className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Email de contact</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contact@iat.com"
                className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Téléphone</label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+225 07 00 00 00"
                className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
              />
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-foreground">Adresse géographique</label>
          <div className="relative">
            <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Abidjan, Cocody Deux-Plateaux"
              className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        {!isEditing && (
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Formule d'Abonnement</label>
            <select
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-primary"
            >
              <option value="STARTER">Starter (Jusqu'à 3 centres, 200 apprenants)</option>
              <option value="PRO">Pro (Jusqu'à 5 centres, 500 apprenants)</option>
              <option value="ENTERPRISE">Enterprise (Centres illimités)</option>
            </select>
          </div>
        )}

        {!isEditing && (
          <div className="pt-2 border-t border-border">
            <label className="flex items-center gap-2 cursor-pointer mb-3">
              <input
                type="checkbox"
                checked={createAdmin}
                onChange={(e) => setCreateAdmin(e.target.checked)}
                className="rounded border-border text-primary focus:ring-0"
              />
              <span className="text-xs font-semibold text-foreground">
                Créer immédiatement le compte Administrateur de l'organisation
              </span>
            </label>

            {createAdmin && (
              <div className="space-y-3 p-3.5 rounded-xl bg-secondary/40 border border-border animate-in fade-in">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Prénom"
                    value={adminFirstName}
                    onChange={(e) => setAdminFirstName(e.target.value)}
                    className="px-3 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:border-primary"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Nom"
                    value={adminLastName}
                    onChange={(e) => setAdminLastName(e.target.value)}
                    className="px-3 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="email"
                    required
                    placeholder="Email de connexion"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="px-3 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:border-primary"
                  />
                  <input
                    type="text"
                    placeholder="Matricule (optionnel)"
                    value={adminMatricule}
                    onChange={(e) => setAdminMatricule(e.target.value.toUpperCase())}
                    className="px-3 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="relative">
                  <Key className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="password"
                    required
                    placeholder="Mot de passe initial"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center gap-2"
          >
            {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{isEditing ? "Enregistrer les modifications" : "Créer l'organisation"}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
