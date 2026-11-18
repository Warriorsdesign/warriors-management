import "./landing.css";
import { ShieldCheck } from "lucide-react";
import { CONTACT, TRIAL_DAYS, whatsappLink } from "@/lib/config/contact";

// Liens en <a> (navigation complète) : le site public et l'application ont des mises en page
// racine différentes (voir app/layout.tsx), une navigation côté client garderait la mauvaise.
export { SiteHeader } from "./SiteHeader";

/** Pied de page du site public : marque, pages, compte, contact. */
export function SiteFooter() {
  return (
    <footer className="lp-footer">
      <div className="lp-wrap">
        <div className="lp-footer__cols">
          <div>
            <p className="flex items-center gap-2.5 font-bold">
              <span className="w-8 h-8 rounded-full bg-[var(--lp-accent)] text-[var(--lp-on-accent)] flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" aria-hidden="true" />
              </span>
              Warriors Management
            </p>
            <p className="mt-3 text-[15px] text-[var(--lp-muted)] max-w-[32ch]">
              Le suivi des inscriptions, des paiements et de l’activité des centres de formation.
            </p>
          </div>
          <div>
            <p className="font-bold text-[15px]">Pages</p>
            <ul className="mt-3 space-y-2 text-[15px]">
              <li><a href="/#fonctionnalites">Fonctionnalités</a></li>
              <li><a href="/#fonctionnement">Fonctionnement</a></li>
              <li><a href="/#tarifs">Tarifs</a></li>
              <li><a href="/#faq">Questions fréquentes</a></li>
            </ul>
          </div>
          <div>
            <p className="font-bold text-[15px]">Compte</p>
            <ul className="mt-3 space-y-2 text-[15px]">
              <li><a href="/essai">Essai gratuit de {TRIAL_DAYS} jours</a></li>
              <li><a href="/login">Se connecter</a></li>
            </ul>
          </div>
          <div>
            <p className="font-bold text-[15px]">Contact</p>
            <ul className="mt-3 space-y-2 text-[15px]">
              <li><a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a></li>
              <li>
                <a href={whatsappLink("Bonjour, j'aimerais en savoir plus sur Warriors Management.")} target="_blank" rel="noopener noreferrer">
                  WhatsApp : {CONTACT.whatsappDisplay}
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-6 border-t border-[var(--lp-line)] flex flex-col sm:flex-row gap-3 justify-between text-sm text-[var(--lp-muted)]">
          <p>&copy; {new Date().getFullYear()} Warriors Management. Tous droits réservés.</p>
          <a href="/informations-legales">Mentions légales, conditions et confidentialité</a>
        </div>
      </div>
    </footer>
  );
}
