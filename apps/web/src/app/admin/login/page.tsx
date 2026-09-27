"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Mail, Loader2, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { Card } from "@/components/ui/card";
import { apiFetch, ApiClientError } from "@/lib/api/client";

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    try {
      await apiFetch("/api/admin/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      const redirect = searchParams.get("redirect") ?? "/admin/dashboard";
      router.push(redirect);
      router.refresh();
    } catch (err) {
      setErrorMsg(
        err instanceof ApiClientError
          ? err.message
          : "Identifiants invalides ou droits Super Admin manquants."
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F4F4] flex flex-col items-center justify-center p-4 overflow-hidden relative">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="mb-8 text-center z-10 transition-all duration-500 transform">
        <div className="w-16 h-16 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Warriors Management
        </h1>
        <p className="text-muted-foreground mt-2 text-sm font-medium">
          Portail Super Administrateur
        </p>
      </div>

      <Card className="w-full max-w-md p-8 bg-background/80 backdrop-blur-md border border-border/50 shadow-xl z-10 relative overflow-hidden rounded-xl">
        <form onSubmit={handleSubmit} className="flex flex-col justify-center space-y-5">
          {errorMsg && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-md animate-in fade-in slide-in-from-top-2">
              {errorMsg}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Email Administrateur
            </label>
            <div className="relative group">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="superadmin@warriors.com"
                className="w-full pl-9 pr-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-background"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Mot de passe
            </label>
            <div className="relative group">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••••••"
                className="w-full pl-9 pr-9 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-background"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-70 disabled:pointer-events-none transition-all flex items-center justify-center gap-2 mt-2 shadow-md hover:shadow-lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Connexion en cours...
              </>
            ) : (
              "Se connecter au Back-Office"
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-border text-center">
          <a
            href="/login"
            className="text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            ← Retour à l'espace de connexion des centres
          </a>
        </div>
      </Card>

      <p className="mt-8 text-sm text-muted-foreground text-center z-10">
        &copy; {new Date().getFullYear()} Warriors Management. Tous droits réservés.
      </p>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense>
      <AdminLoginForm />
    </Suspense>
  );
}
