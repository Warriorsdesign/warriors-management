"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Circle, KeyRound, Loader2, Lock, LogOut } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PasswordInput } from "@/components/ui/password-input";
import { apiFetch, ApiClientError } from "@/lib/api/client";
import { useSession } from "@/lib/hooks/useSession";
import { cn } from "@/lib/utils";

const MIN_LENGTH = 8;

/**
 * Changement obligatoire du mot de passe provisoire (création du compte ou réinitialisation
 * par un administrateur). Le middleware n'autorise aucune autre page tant que ce n'est pas fait.
 */
export default function ChangePasswordPage() {
  const router = useRouter();
  const { user } = useSession();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const rules = [
    { ok: newPassword.length >= MIN_LENGTH, label: `Au moins ${MIN_LENGTH} caractères` },
    { ok: newPassword.length > 0 && newPassword !== currentPassword, label: "Différent du mot de passe provisoire" },
    { ok: confirmPassword.length > 0 && newPassword === confirmPassword, label: "Les deux saisies sont identiques" },
  ];
  const canSubmit = currentPassword.length > 0 && rules.every((r) => r.ok);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setIsSubmitting(true);
    setError("");
    try {
      const { redirectTo } = await apiFetch<{ redirectTo: string }>("/api/users/me/password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      router.push(redirectTo || "/");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Une erreur est survenue.");
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await apiFetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-[#F4F4F4] flex flex-col items-center justify-center p-4 overflow-hidden relative">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="mb-8 text-center z-10">
        <div className="w-16 h-16 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/20">
          <KeyRound className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Choisissez votre mot de passe</h1>
        <p className="text-muted-foreground mt-2 max-w-md">
          {user ? `Bienvenue ${user.firstName}. ` : ""}Pour sécuriser votre compte, remplacez le mot de passe provisoire qui vous a été
          communiqué avant d&apos;accéder à l&apos;application.
        </p>
      </div>

      <Card className="w-full max-w-md p-8 bg-background/80 backdrop-blur-md border border-border/50 shadow-xl z-10">
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-md animate-fade-in">{error}</div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Mot de passe provisoire</label>
            <PasswordInput
              autoComplete="current-password"
              autoFocus
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              placeholder="••••••••"
              className="py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Nouveau mot de passe</label>
            <PasswordInput
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              placeholder="••••••••"
              className="py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Confirmer le nouveau mot de passe</label>
            <PasswordInput
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              placeholder="••••••••"
              className="py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          <ul className="space-y-1.5">
            {rules.map((rule) => (
              <li key={rule.label} className={cn("flex items-center gap-2 text-xs transition-colors", rule.ok ? "text-emerald-600" : "text-muted-foreground")}>
                {rule.ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
                {rule.label}
              </li>
            ))}
          </ul>

          <button
            type="submit"
            disabled={!canSubmit || isSubmitting}
            className="w-full py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60 disabled:pointer-events-none transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
          >
            {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Enregistrement...</> : "Enregistrer et continuer"}
          </button>
        </form>
      </Card>

      <button
        type="button"
        onClick={handleLogout}
        className="mt-6 z-10 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <LogOut className="w-4 h-4" /> Se déconnecter
      </button>
    </div>
  );
}
