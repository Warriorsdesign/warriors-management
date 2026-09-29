"use client";

import { useEffect } from "react";

/**
 * Système d'animation unique du site public (aucune librairie) :
 * - [data-reveal] : apparition au défilement (IntersectionObserver unique, jamais rejouée) ;
 * - [data-stagger] : décale ses enfants [data-reveal] via la variable --i ;
 * - [data-split] : découpe un titre en mots à partir du texte d'origine (le HTML reste lisible sans JS) ;
 * - [data-split="scroll"] : mots allumés un à un selon la progression du défilement (manifeste) ;
 * - [data-count] : compteur animé (1 200 ms, easeOutCubic) qui retombe sur le texte d'origine ;
 * - [data-parallax] : légère parallaxe (40 px max) réservée aux pictogrammes décoratifs.
 * Si prefers-reduced-motion est actif, tout est affiché immédiatement.
 */
export function LandingMotion() {
  useEffect(() => {
    (window as unknown as { __lpMotion?: boolean }).__lpMotion = true;
    const root = document.querySelector<HTMLElement>(".lp");
    if (!root || !root.classList.contains("lp-js")) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // --- Découpage en mots ---
    root.querySelectorAll<HTMLElement>("[data-split]").forEach((el) => {
      if (el.dataset.splitDone) return;
      el.dataset.splitDone = "1";
      let i = 0;
      const wrapWord = (word: string) => {
        const span = document.createElement("span");
        span.className = "lp-word";
        span.style.setProperty("--i", String(i++));
        span.textContent = word;
        return span;
      };
      Array.from(el.childNodes).forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          const parts = (node.textContent ?? "").split(/(\s+)/);
          const frag = document.createDocumentFragment();
          parts.forEach((part) => frag.appendChild(/^\s+$/.test(part) || part === "" ? document.createTextNode(part) : wrapWord(part)));
          node.replaceWith(frag);
        } else if (node instanceof HTMLElement) {
          node.classList.add("lp-word");
          node.style.setProperty("--i", String(i++));
        }
      });
    });

    // --- Décalage des enfants ---
    root.querySelectorAll<HTMLElement>("[data-stagger]").forEach((group) => {
      group.querySelectorAll<HTMLElement>(":scope > [data-reveal]").forEach((child, index) => {
        child.style.setProperty("--i", String(Math.min(index, 8)));
      });
    });

    // --- Compteurs ---
    const runCounter = (el: HTMLElement) => {
      const target = Number(el.dataset.count);
      const finalText = el.textContent ?? "";
      if (reduce || !Number.isFinite(target)) return;
      const format = (n: number) => new Intl.NumberFormat("fr-FR").format(n).replace(/ | /g, " ");
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / 1200);
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = t < 1 ? format(Math.round(target * eased)) : finalText;
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    // --- Apparition (observer unique) ---
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target as HTMLElement;
          el.classList.add("in");
          if (el.dataset.count !== undefined) runCounter(el);
          io.unobserve(el);
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -10%" }
    );
    root.querySelectorAll<HTMLElement>("[data-reveal], [data-split]:not([data-split='scroll']), [data-count]").forEach((el) => io.observe(el));

    // --- Défilement : manifeste mot à mot + parallaxe ---
    const scrollWords = Array.from(root.querySelectorAll<HTMLElement>("[data-split='scroll']"));
    const parallax = Array.from(root.querySelectorAll<HTMLElement>("[data-parallax]"));
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const vh = window.innerHeight;
        scrollWords.forEach((block) => {
          const rect = block.getBoundingClientRect();
          // 0 quand le bloc entre par le bas, 1 quand son centre atteint le tiers haut de l'écran.
          const progress = Math.min(1, Math.max(0, (vh - rect.top) / (vh * 0.65 + rect.height * 0.5)));
          const words = block.querySelectorAll<HTMLElement>(".lp-word");
          const lit = Math.round(progress * words.length);
          words.forEach((w, idx) => w.classList.toggle("in", idx < lit));
        });
        if (!reduce) {
          parallax.forEach((el) => {
            const rect = el.parentElement?.getBoundingClientRect();
            if (!rect) return;
            const speed = Number(el.dataset.parallax) || 0.1;
            const offset = (rect.top + rect.height / 2 - vh / 2) * speed;
            el.style.transform = `translate3d(0, ${Math.max(-40, Math.min(40, offset))}px, 0)`;
          });
        }
      });
    };
    if (reduce) scrollWords.forEach((b) => b.querySelectorAll(".lp-word").forEach((w) => w.classList.add("in")));
    else onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}

/**
 * Posé en tout début de page : active les états de départ des animations avant le premier
 * affichage. Filet de sécurité : si le script principal ne s'exécute pas (JS bloqué, erreur),
 * la classe est retirée au bout de 3 s et tout le contenu reste visible.
 */
export const MOTION_BOOTSTRAP =
  "(function(){var r=document.currentScript&&document.currentScript.parentElement;if(!r)return;r.classList.add('lp-js');setTimeout(function(){if(!window.__lpMotion)r.classList.remove('lp-js');},3000);})();";
