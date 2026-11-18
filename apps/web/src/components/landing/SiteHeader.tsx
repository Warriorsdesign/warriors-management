"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, Menu, ShieldCheck, X } from "lucide-react";

// Liens en <a> (navigation complète) : le site public et l'application ont des mises en page
// racine différentes (voir app/layout.tsx), une navigation côté client garderait la mauvaise.
const LINKS = [
  { href: "/#fonctionnalites", label: "Fonctionnalités" },
  { href: "/#fonctionnement", label: "Fonctionnement" },
  { href: "/#tarifs", label: "Tarifs" },
  { href: "/#faq", label: "Questions" },
];

/**
 * En-tête du site public : transparent en haut de la landing, opaque avec filet dès 40 px de
 * défilement (toujours opaque sur les autres pages). Menu plein écran sous 900 px.
 */
export function SiteHeader({ solid = false }: { solid?: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const logo = (
    <a href="/" className="flex items-center gap-2.5 min-h-[44px]" onClick={() => setOpen(false)}>
      <span className="w-9 h-9 rounded-full bg-[var(--lp-accent)] text-[var(--lp-on-accent)] flex items-center justify-center">
        <ShieldCheck className="w-5 h-5" aria-hidden="true" />
      </span>
      <span className="font-bold tracking-tight">Warriors Management</span>
    </a>
  );

  return (
    <header className={`lp-header ${scrolled ? "is-scrolled" : ""} ${solid ? "is-solid" : ""}`}>
      <div className="lp-wrap lp-header__bar">
        {logo}
        <nav className="lp-header__nav" aria-label="Navigation principale">
          {LINKS.map((l) => <a key={l.href} href={l.href}>{l.label}</a>)}
        </nav>
        <div className="lp-header__actions">
          <a href="/login" className="lp-btn lp-btn--plain" style={{ fontWeight: 500 }}>Se connecter</a>
          <a href="/essai" className="lp-btn lp-btn--accent">
            Essai gratuit
            <span className="lp-btn__dot" aria-hidden="true"><ArrowUpRight className="w-4 h-4" /></span>
          </a>
        </div>
        <button type="button" className="lp-burger" aria-label="Ouvrir le menu" aria-expanded={open} onClick={() => setOpen(true)}>
          <Menu className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>

      {open && (
        <div className="lp-menu" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="flex items-center justify-between h-[52px]">
            {logo}
            <button type="button" className="lp-burger" aria-label="Fermer le menu" onClick={() => setOpen(false)} autoFocus>
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
          <nav aria-label="Navigation principale">
            {LINKS.map((l) => <a key={l.href} href={l.href} onClick={() => setOpen(false)}>{l.label}</a>)}
          </nav>
          <div className="mt-auto grid gap-3">
            <a href="/essai" className="lp-btn lp-btn--accent lp-btn--plain" onClick={() => setOpen(false)}>Essayer gratuitement 14 jours</a>
            <a href="/login" className="lp-btn lp-btn--ghost" onClick={() => setOpen(false)}>Se connecter</a>
          </div>
        </div>
      )}
    </header>
  );
}
