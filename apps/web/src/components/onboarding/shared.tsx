"use client";

import React from "react";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

/** Classes des champs texte, identiques à celles des formulaires existants (ex : app/centers/page.tsx). */
export function inputClass(hasError?: boolean) {
  return cn(
    "w-full bg-background border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 transition-all",
    hasError ? "border-red-500 focus:ring-red-500/50 animate-shake" : "border-border focus:ring-primary"
  );
}

export const primaryButtonClass =
  "inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50";

export const secondaryButtonClass =
  "inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium border border-border rounded-md hover:bg-secondary transition-colors disabled:opacity-50";

export function Field({ label, error, children, className }: { label: string; error?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1 animate-fade-in">{error}</p>}
    </div>
  );
}

export function StepHeader({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
  return (
    <div className="flex items-start gap-4">
      <div className="w-11 h-11 shrink-0 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <h2 className="text-xl font-bold tracking-tight text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">{description}</p>
      </div>
    </div>
  );
}

/** Liste de ce qui existe déjà en base : la reprise de l'assistant reflète toujours la réalité. */
export function CreatedList({
  title, items, emptyText, isLoading,
}: {
  title: string;
  items: { id: string; label: string; detail?: string }[];
  emptyText: string;
  isLoading?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <span className="text-xs font-medium text-muted-foreground bg-secondary rounded-full px-2 py-0.5">{items.length}</span>
      </div>
      {isLoading ? (
        <p className="px-4 py-6 text-sm text-muted-foreground">Chargement...</p>
      ) : items.length === 0 ? (
        <p className="px-4 py-6 text-sm text-muted-foreground text-center">{emptyText}</p>
      ) : (
        <ul className="divide-y divide-border max-h-72 overflow-y-auto">
          {items.map((item) => (
            <li key={item.id} className="px-4 py-2.5 flex items-center gap-3 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{item.label}</p>
                {item.detail && <p className="text-xs text-muted-foreground truncate">{item.detail}</p>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function QuotaNote({ used, max, noun }: { used: number; max: number | undefined; noun: string }) {
  if (max === undefined) return null;
  if (max === -1) return <p className="text-xs text-muted-foreground">Votre abonnement autorise un nombre illimité de {noun}.</p>;
  const reached = used >= max;
  return (
    <p className={cn("text-xs", reached ? "text-amber-700" : "text-muted-foreground")}>
      {used} / {max} {noun} utilisés par votre abonnement.
      {reached && " Limite atteinte : contactez admin@warriors-management.com pour passer à un plan supérieur."}
    </p>
  );
}
