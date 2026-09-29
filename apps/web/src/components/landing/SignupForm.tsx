"use client";

import React, { useState } from "react";
import { ArrowRight, CheckCircle2, IdCard, Loader2 } from "lucide-react";
import { apiFetch, ApiClientError } from "@/lib/api/client";
import { PasswordInput } from "@/components/ui/password-input";

interface SignupResult {
  matricule: string;
  trialEndsAt: string;
  redirectTo: string;
}

const FIELD = "w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all";

export function SignupForm() {
  const [form, setForm] = useState({
    organizationName: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    acceptTerms: false,
    website: "", // champ piège (invisible)
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<SignupResult | null>(null);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      setResult(await apiFetch<SignupResult>("/api/public/signup", { method: "POST", body: JSON.stringify(form) }));
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Une erreur est survenue. Réessayez.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (result) {
    const endsAt = new Date(result.trialEndsAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
    return (
      <div className="text-center">
        <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
        <h2 className="mt-4 text-2xl font-bold text-foreground">Votre espace est prêt</h2>
        <p className="mt-2 text-muted-foreground">Votre essai gratuit court jusqu’au {endsAt}.</p>
        <div className="mt-6 rounded-xl border-2 border-dashed border-foreground/30 bg-secondary/40 p-5">
          <p className="text-sm text-muted-foreground flex items-center justify-center gap-2"><IdCard className="w-4 h-4" /> Votre matricule de connexion</p>
          <p className="mt-1 text-3xl font-bold tracking-wider text-foreground" data-testid="signup-matricule">{result.matricule}</p>
          <p className="mt-2 text-xs text-muted-foreground">Notez-le : c’est lui, avec votre mot de passe, qui vous permettra de vous reconnecter.</p>
        </div>
        <button
          // Navigation complète : l'assistant appartient à l'application (autre mise en page racine).
          onClick={() => window.location.assign(result.redirectTo)}
          className="mt-6 w-full lp-btn lp-btn--primary lp-btn--plain"
        >
          Configurer mon établissement <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {error && <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg" role="alert">{error}</div>}

      <div className="space-y-1.5">
        <label htmlFor="organizationName" className="text-sm font-medium text-foreground">Nom de votre établissement</label>
        <input id="organizationName" className={FIELD} value={form.organizationName} onChange={set("organizationName")} placeholder="Ex : Institut Excellence Douala" required />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="firstName" className="text-sm font-medium text-foreground">Prénom</label>
          <input id="firstName" className={FIELD} value={form.firstName} onChange={set("firstName")} autoComplete="given-name" required />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="lastName" className="text-sm font-medium text-foreground">Nom</label>
          <input id="lastName" className={FIELD} value={form.lastName} onChange={set("lastName")} autoComplete="family-name" required />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium text-foreground">Email</label>
          <input id="email" type="email" className={FIELD} value={form.email} onChange={set("email")} autoComplete="email" required />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="phone" className="text-sm font-medium text-foreground">Téléphone</label>
          <input id="phone" type="tel" className={FIELD} value={form.phone} onChange={set("phone")} placeholder="6XX XX XX XX" autoComplete="tel" required />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="password" className="text-sm font-medium text-foreground">Mot de passe</label>
        <PasswordInput id="password" className="py-2.5 rounded-lg" value={form.password} onChange={set("password")} autoComplete="new-password" required />
        <p className="text-xs text-muted-foreground">8 caractères minimum.</p>
      </div>

      {/* Champ piège : invisible pour les personnes, rempli par les robots. */}
      <div aria-hidden="true" className="absolute -left-[9999px] w-px h-px overflow-hidden">
        <label htmlFor="website">Site web</label>
        <input id="website" tabIndex={-1} autoComplete="off" value={form.website} onChange={set("website")} />
      </div>

      <label className="flex items-start gap-2.5 text-sm text-muted-foreground">
        <input type="checkbox" className="mt-0.5 w-4 h-4 rounded border-border" checked={form.acceptTerms} onChange={set("acceptTerms")} />
        <span>
          J’accepte les{" "}
          <a href="/informations-legales#conditions" target="_blank" className="text-foreground underline">conditions d’utilisation</a>
          {" "}et la{" "}
          <a href="/informations-legales#confidentialite" target="_blank" className="text-foreground underline">politique de confidentialité</a>.
        </span>
      </label>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full lp-btn lp-btn--primary lp-btn--plain disabled:opacity-70"
      >
        {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Création de votre espace...</> : "Créer mon espace"}
      </button>

      <p className="text-center text-sm text-muted-foreground">
        Déjà un compte ? <a href="/login" className="font-semibold text-foreground hover:underline">Se connecter</a>
      </p>
    </form>
  );
}
