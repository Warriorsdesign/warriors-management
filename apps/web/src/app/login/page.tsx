"use client"
import React, { useState } from "react";
import { useRouter } from "next/navigation";

import { Lock, Mail, Loader2, ShieldCheck, User } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);

  // Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      if (isLogin) {
        setTimeout(() => {
          router.push("/");
          router.refresh(); 
        }, 800);
      } else {
        setSuccessMsg("Compte créé avec succès ! Vous êtes connecté.");
        setTimeout(() => {
          router.push("/");
          router.refresh();
        }, 1500);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || (isLogin ? "Email ou mot de passe incorrect." : "Erreur lors de la création du compte."));
    } finally {
      // setIsLoading(false) is handled by navigation
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setErrorMsg("");
    setSuccessMsg("");
    setPassword("");
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
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Warriors Management</h1>
        <p className="text-muted-foreground mt-2">
          {isLogin ? "Connectez-vous pour accéder à votre espace" : "Créez votre compte pour commencer"}
        </p>
      </div>

      <Card className="w-full max-w-md p-8 bg-background/80 backdrop-blur-md border border-border/50 shadow-xl z-10 relative overflow-hidden transition-all duration-500 ease-in-out" 
            style={{ height: isLogin ? '400px' : '520px' }}>
        
        {/* Animated Wrapper for Form */}
        <div className="absolute inset-0 p-8 w-full h-full transition-transform duration-500 ease-in-out flex flex-col"
             style={{ transform: isLogin ? 'translateX(0)' : 'translateX(-100%)' }}>
          
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-center space-y-5">
            {isLogin && errorMsg && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-md animate-in fade-in slide-in-from-top-2">
                {errorMsg}
              </div>
            )}
            
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Adresse Email</label>
              <div className="relative group">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input 
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required={isLogin}
                  placeholder="admin@warriors.edu"
                  className="w-full pl-9 pr-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-background"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">Mot de passe</label>
              </div>
              <div className="relative group">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input 
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required={isLogin}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-background"
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-70 disabled:pointer-events-none transition-all flex items-center justify-center gap-2 mt-2 shadow-md hover:shadow-lg"
            >
              {isLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Connexion en cours...</>
              ) : ("Se connecter")}
            </button>
          </form>
          
          <div className="mt-6 text-center text-sm text-muted-foreground">
            Pas encore de compte ?{" "}
            <button onClick={toggleMode} type="button" className="text-primary hover:underline font-medium transition-colors">
              S'inscrire
            </button>
          </div>
        </div>

        {/* SIGN UP FORM (starts translated off-screen to the right) */}
        <div className="absolute inset-0 p-8 w-full h-full transition-transform duration-500 ease-in-out flex flex-col"
             style={{ transform: !isLogin ? 'translateX(0)' : 'translateX(100%)' }}>
          
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-center space-y-5">
            {!isLogin && errorMsg && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-md animate-in fade-in slide-in-from-top-2">
                {errorMsg}
              </div>
            )}
            {!isLogin && successMsg && (
              <div className="p-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded-md animate-in fade-in slide-in-from-top-2">
                {successMsg}
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Prénom</label>
                <div className="relative group">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <input 
                    type="text"
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    required={!isLogin}
                    placeholder="Jean"
                    className="w-full pl-9 pr-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-background"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Nom</label>
                <div className="relative group">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <input 
                    type="text"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    required={!isLogin}
                    placeholder="Dupont"
                    className="w-full pl-9 pr-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-background"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Adresse Email</label>
              <div className="relative group">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input 
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required={!isLogin}
                  placeholder="admin@warriors.edu"
                  className="w-full pl-9 pr-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-background"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Mot de passe</label>
              <div className="relative group">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input 
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required={!isLogin}
                  placeholder="••••••••"
                  minLength={6}
                  className="w-full pl-9 pr-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-background"
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-70 disabled:pointer-events-none transition-all flex items-center justify-center gap-2 mt-2 shadow-md hover:shadow-lg"
            >
              {isLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Création en cours...</>
              ) : ("Créer le compte")}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Vous avez déjà un compte ?{" "}
            <button onClick={toggleMode} type="button" className="text-primary hover:underline font-medium transition-colors">
              Se connecter
            </button>
          </div>
        </div>

      </Card>
      
      <p className="mt-8 text-sm text-muted-foreground text-center z-10">
        &copy; {new Date().getFullYear()} Warriors Management. Tous droits réservés.
      </p>
    </div>
  );
}
