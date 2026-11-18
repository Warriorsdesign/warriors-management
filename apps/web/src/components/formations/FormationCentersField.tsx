"use client";

import React from "react";
import { Building, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface FormationCentersFieldProps {
  /** Centres accessibles à l'utilisateur connecté (GET /api/centers, déjà limité à son périmètre). */
  centers: { id: string; name: string }[];
  value: string[];
  onChange: (centerIds: string[]) => void;
  /** Utilisateur non administrateur rattaché à un seul centre : ce centre est imposé. */
  locked: boolean;
  error?: string;
  label?: string;
}

/**
 * Choix des centres où une formation est proposée (au moins un, obligatoire). Un utilisateur
 * non administrateur qui n'a accès qu'à un centre ne choisit pas : son centre est imposé.
 */
export function FormationCentersField({ centers, value, onChange, locked, error, label = "Centres où la formation est proposée" }: FormationCentersFieldProps) {
  const toggle = (id: string) => onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">
        {label} <span className="text-red-500">*</span>
      </label>

      {centers.length === 0 ? (
        <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-md px-3 py-2">
          Aucun centre disponible. Un administrateur doit d&apos;abord créer un centre.
        </p>
      ) : locked ? (
        <div className="flex items-center gap-2 rounded-md border border-border bg-secondary/40 px-3 py-2 text-sm">
          <Building className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium text-foreground">{centers[0].name}</span>
          <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
            <Lock className="w-3 h-3" /> Votre centre de rattachement
          </span>
        </div>
      ) : (
        <div
          className={cn(
            "grid grid-cols-1 sm:grid-cols-2 gap-2 border rounded-md p-3 max-h-40 overflow-y-auto transition-colors",
            error ? "border-red-500" : "border-border"
          )}
        >
          {centers.map((center) => (
            <label key={center.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/30 p-1 rounded-md">
              <input
                type="checkbox"
                className="rounded border-border text-primary focus:ring-primary"
                checked={value.includes(center.id)}
                onChange={() => toggle(center.id)}
              />
              <span>{center.name}</span>
            </label>
          ))}
        </div>
      )}
      {error && <p className="text-xs text-red-500 mt-1 animate-fade-in">{error}</p>}
    </div>
  );
}

/** Sélection initiale : le centre unique accessible est pré-sélectionné (imposé pour un non-administrateur). */
export function defaultFormationCenters(centers: { id: string }[]): string[] {
  return centers.length === 1 ? [centers[0].id] : [];
}
