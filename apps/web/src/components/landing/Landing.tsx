import Link from "next/link";
import {
  ArrowUpRight, Building2, CalendarClock, Check, FileSpreadsheet, GraduationCap,
  Plus, Receipt, Wallet,
} from "lucide-react";
import { Accordion, type AccordionItem } from "./Accordion";
import { DashboardMockup } from "./DashboardMockup";
import { LandingMotion, MOTION_BOOTSTRAP } from "./LandingMotion";
import { SiteFooter, SiteHeader } from "./SiteChrome";
import { CONTACT, TRIAL_DAYS, whatsappLink } from "@/lib/config/contact";

export interface LandingPlan {
  id: string;
  name: string;
  price: number;
  maxCenters: number;
  maxStudents: number;
  isUnlimitedCenters: boolean;
  isUnlimitedStudents: boolean;
  isPopular: boolean;
}

const TRIAL_CTA = `Essayer gratuitement ${TRIAL_DAYS} jours`;

function fcfa(value: number): string {
  return new Intl.NumberFormat("fr-FR").format(value).replace(/ | /g, " ");
}

/** Étiquette de section : pastille teintée, « + » prune, libellé en casse normale. */
function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <p className="lp-kicker" data-reveal>
      <Plus className="lp-kicker__icon" aria-hidden="true" />
      {children}
    </p>
  );
}

function TrialButton({ variant = "primary" }: { variant?: "primary" | "accent" | "light" }) {
  return (
    <Link href="/essai" className={`lp-btn lp-btn--${variant}`}>
      {TRIAL_CTA}
      <span className="lp-btn__dot" aria-hidden="true"><ArrowUpRight className="w-4 h-4" /></span>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Petites maquettes
// ---------------------------------------------------------------------------

function MiniRow({ left, right, strong }: { left: string; right: string; strong?: boolean }) {
  return (
    <div className="flex justify-between gap-3 py-2 border-b border-[var(--lp-line)] last:border-0 text-sm">
      <span className="text-[var(--lp-muted)]">{left}</span>
      <span className={`font-semibold tabular-nums ${strong ? "text-[var(--lp-accent)]" : ""}`}>{right}</span>
    </div>
  );
}

function MiniPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[var(--lp-radius-sm)] border border-[var(--lp-line)] bg-white p-4 w-full max-w-sm shadow-[0_24px_48px_-32px_rgba(93,14,65,0.45)]">
      <p className="text-xs font-bold mb-1">{title}</p>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Contenu
// ---------------------------------------------------------------------------

const TRAININGS = [
  "Informatique", "Comptabilité", "Secrétariat bureautique", "Infographie", "Langues", "Couture",
  "Esthétique et coiffure", "Hôtellerie", "Maintenance", "Commerce", "Logistique", "Marketing digital",
];
/** Pictogrammes en orbite autour du manifeste : chacun s'ouvre au survol sur une information. */
const ORBIT = [
  { icon: Wallet, title: "Paiements", text: "Espèces ou Mobile Money, reçu remis sur place." },
  { icon: CalendarClock, title: "Échéances", text: "Les 7 prochains jours, listés à l’avance." },
  { icon: Receipt, title: "Dépenses", text: "Loyer, salaires, charges : tout est compté." },
  { icon: GraduationCap, title: "Étudiants", text: "Inscriptions, classes et départs suivis." },
];
const CHIP_ROWS = [TRAININGS.slice(0, 4), TRAININGS.slice(4, 8), TRAININGS.slice(8)];

function Step({ text, panel }: { text: string; panel: React.ReactNode }) {
  return (
    <div className="grid gap-6 md:grid-cols-2 items-start">
      <p className="lp-muted">{text}</p>
      {panel}
    </div>
  );
}

const HOW: AccordionItem[] = [
  {
    title: "Vous inscrivez",
    content: (
      <Step
        text="Fiche, classe, frais et tranches : l’échéancier se calcule dès l’inscription."
        panel={
          <MiniPanel title="Nouvelle inscription">
            <MiniRow left="Formation" right="Informatique" />
            <MiniRow left="Tranches" right="10 × 1 mois" />
            <MiniRow left="Première échéance" right="06/11/2026" />
          </MiniPanel>
        }
      />
    ),
  },
  {
    title: "Vous encaissez",
    content: (
      <Step
        text="Espèces ou Mobile Money, reçu prêt à imprimer. Le reste à payer se met à jour seul."
        panel={
          <MiniPanel title="Paiement enregistré">
            <MiniRow left="Tranche 2" right="25 000 FCFA" />
            <MiniRow left="Reste à payer" right="175 000 FCFA" />
            <MiniRow left="Statut" right="À jour" strong />
          </MiniPanel>
        }
      />
    ),
  },
  {
    title: "Vous suivez",
    content: (
      <Step
        text="Entrées, départs et encaissements, du jour à l’année, par centre ou par formation."
        panel={
          <MiniPanel title="Ce mois-ci">
            <MiniRow left="Nouvelles inscriptions" right="+24" strong />
            <MiniRow left="Départs" right="-8" />
            <MiniRow left="Étudiants actifs" right="156" />
          </MiniPanel>
        }
      />
    ),
  },
  {
    title: "Vous agissez",
    content: (
      <Step
        text="Échéances à venir et impayés déjà triés : vous savez qui appeler aujourd’hui."
        panel={
          <MiniPanel title="Impayés par ancienneté">
            <MiniRow left="Moins de 30 jours" right="180 000 FCFA" />
            <MiniRow left="30 à 60 jours" right="95 000 FCFA" />
            <MiniRow left="Plus de 60 jours" right="45 000 FCFA" strong />
          </MiniPanel>
        }
      />
    ),
  },
];

const FAQ: AccordionItem[] = [
  {
    title: "Mes données sont-elles visibles par d’autres établissements ?",
    content: <p className="lp-muted max-w-[65ch]">Non. Chaque établissement a son espace, et chaque employé ne voit que son centre et ce que son rôle permet.</p>,
  },
  {
    title: "J’ai plusieurs centres. Est-ce que ça fonctionne ?",
    content: <p className="lp-muted max-w-[65ch]">Oui. Vous les voyez ensemble ou un par un. Le nombre de centres dépend du forfait.</p>,
  },
  {
    title: "Je dois tout ressaisir ?",
    content: <p className="lp-muted max-w-[65ch]">Non. Formations, classes et étudiants s’importent depuis Excel, chaque ligne vérifiée avant l’import.</p>,
  },
  {
    title: `Et après les ${TRIAL_DAYS} jours ?`,
    content: (
      <p className="lp-muted max-w-[65ch]">
        Votre espace est mis en pause, rien n’est effacé. Choisissez un forfait, réglez par Mobile Money, et vous reprenez là où vous en étiez.
      </p>
    ),
  },
];

// ---------------------------------------------------------------------------
// Tarifs (lus en base)
// ---------------------------------------------------------------------------

function titleCase(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
}

function planLimits(p: LandingPlan): string[] {
  const centers = p.isUnlimitedCenters || p.maxCenters === -1 ? "Centres illimités" : `${p.maxCenters} centre${p.maxCenters > 1 ? "s" : ""}`;
  const students = p.isUnlimitedStudents || p.maxStudents === -1 ? "Apprenants illimités" : `Jusqu’à ${fcfa(p.maxStudents)} apprenants`;
  return [centers, students, "Toutes les fonctionnalités"];
}

function planPitch(p: LandingPlan): string {
  if (p.price === 0) return "Pour découvrir l’outil avec vos données.";
  if (p.isUnlimitedCenters || p.maxCenters === -1) return "Pour les établissements à plusieurs sites.";
  return "Pour un centre qui grandit.";
}

function PlanCard({ plan }: { plan: LandingPlan }) {
  const name = titleCase(plan.name);
  const free = plan.price === 0;
  return (
    <div className={`lp-card lp-plan ${plan.isPopular ? "lp-plan--featured" : ""}`} data-reveal>
      <div className="flex items-center justify-between gap-3">
        <h3 className="lp-h3">{name}</h3>
        {plan.isPopular && <span className="lp-plan__badge">Recommandé</span>}
      </div>
      <p className="mt-1 text-[15px] lp-muted">{planPitch(plan)}</p>
      <p className="mt-6 flex items-baseline gap-1.5 flex-wrap">
        {free ? (
          <><span className="text-4xl font-bold tracking-tight">Gratuit</span><span className="lp-muted">pendant {TRIAL_DAYS} jours</span></>
        ) : (
          <><span className="text-4xl font-bold tracking-tight tabular-nums">{fcfa(plan.price)}</span><span className="lp-muted">FCFA / mois</span></>
        )}
      </p>
      <ul className="mt-6 space-y-2.5 flex-1">
        {planLimits(plan).map((l) => (
          <li key={l} className="flex items-center gap-2.5"><Check className="w-5 h-5 lp-plan__check shrink-0" aria-hidden="true" />{l}</li>
        ))}
      </ul>
      {free ? (
        <Link href="/essai" className="lp-btn lp-btn--primary mt-8">
          Commencer l’essai
          <span className="lp-btn__dot" aria-hidden="true"><ArrowUpRight className="w-4 h-4" /></span>
        </Link>
      ) : (
        <a
          href={whatsappLink(`Bonjour, je souhaite souscrire au forfait ${name} pour mon établissement.`)}
          target="_blank"
          rel="noopener noreferrer"
          className="lp-btn lp-btn--ghost mt-8"
        >
          Choisir {name}
        </a>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function Landing({ plans }: { plans: LandingPlan[] }) {
  return (
    <div className="lp min-h-screen">
      <script dangerouslySetInnerHTML={{ __html: MOTION_BOOTSTRAP }} />
      <LandingMotion />
      <SiteHeader />

      <main>
        {/* 1. Hero */}
        <section className="lp-hero">
          <div className="lp-hero__panel">
            <div className="lp-hero__inner">
              <h1 className="lp-display max-w-[17ch]" data-split>
                Sachez chaque jour ce qui se passe dans votre centre de formation.
              </h1>
              <p className="lp-lead mt-6" data-reveal>
                Inscriptions, paiements et dépenses au même endroit. Les chiffres du jour, chaque matin.
              </p>
              <div className="lp-hero__actions mt-8" data-reveal>
                <TrialButton />
                <a href="#fonctionnement" className="lp-btn lp-btn--ghost">Voir comment ça marche</a>
              </div>
              <div className="lp-hero__visual" data-reveal>
                <DashboardMockup />
              </div>
            </div>
          </div>
        </section>

        {/* 2. Manifeste */}
        <section className="lp-section">
          <div className="lp-wrap lp-manifesto__layout">
            <div>
              <Kicker>Notre conviction</Kicker>
              <p className="lp-manifesto__text mt-6" data-split="scroll">
                Votre centre mérite des chiffres <span className="lp-hl">à jour,</span> pas des souvenirs de fin de mois.
              </p>
            </div>
            <div className="lp-orbit">
              {ORBIT.map((o, i) => (
                <div key={o.title} className="lp-orbit__item" style={{ "--a": `${i * 90 - 60}deg` } as React.CSSProperties}>
                  <div className="lp-deco" tabIndex={0}>
                    <o.icon className="lp-deco__icon" aria-hidden="true" />
                    <span className="lp-deco__info">
                      <strong>{o.title}</strong>
                      <span>{o.text}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 3. Fonctionnalités */}
        <section id="fonctionnalites" className="lp-section scroll-mt-20">
          <div className="lp-wrap">
            <Kicker>Fonctionnalités</Kicker>
            <h2 className="lp-h2 mt-4 max-w-[20ch]" data-reveal>Tout votre centre, sur un seul écran.</h2>
            <div className="lp-bento mt-12" data-stagger>
              <article className="lp-tile lp-tile--soft" data-reveal>
                <div className="lp-chips" aria-hidden="true">
                  {CHIP_ROWS.map((row, r) => (
                    <div key={r} className="lp-chips__row">
                      {[...row, ...row, ...row, ...row].map((t, i) => <span key={i} className="lp-chip">{t}</span>)}
                    </div>
                  ))}
                </div>
                <div>
                  <p className="lp-tile__label">Effectifs</p>
                  <p className="lp-tile__value mt-2 lp-stat__value" data-count="6">6</p>
                  <p className="lp-tile__text">périodes d’analyse. Entrées et sorties par formation, du jour à l’année.</p>
                </div>
              </article>

              <article className="lp-tile lp-tile--accent" data-reveal>
                <p className="lp-tile__label">Paiements</p>
                <div>
                  <p className="lp-tile__value lp-stat__value"><span data-count="7">7</span> jours</p>
                  <p className="lp-tile__text">d’échéances listées à l’avance. Espèces ou Mobile Money, reçu remis sur place.</p>
                </div>
              </article>

              <article className="lp-tile lp-tile--dark" data-reveal>
                <div className="space-y-2" aria-hidden="true">
                  {[["Centre Akwa", "74"], ["Centre Bonamoussadi", "52"], ["Centre Bastos", "30"]].map(([n, v]) => (
                    <div key={n} className="lp-glassrow">
                      <span className="flex items-center gap-2 min-w-0"><Building2 className="w-4 h-4 shrink-0" /><span className="truncate">{n}</span></span>
                      <span className="tabular-nums font-semibold">{v}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <p className="lp-tile__label">Centres et équipe</p>
                  <p className="lp-tile__value mt-2">1 seul</p>
                  <p className="lp-tile__text">espace pour tous vos centres. Chacun voit ce que son rôle permet.</p>
                </div>
              </article>

              <article className="lp-tile lp-tile--soft" data-reveal>
                <p className="lp-tile__label">Import Excel</p>
                <div className="pr-14">
                  <p className="lp-tile__value lp-stat__value" data-count="5000">5 000</p>
                  <p className="lp-tile__text">lignes par fichier, vérifiées avant l’import.</p>
                </div>
                <span className="lp-tile__corner" aria-hidden="true"><FileSpreadsheet className="w-5 h-5" /></span>
              </article>
            </div>
          </div>
        </section>

        {/* 4. Comment ça marche */}
        <section id="fonctionnement" className="lp-section scroll-mt-20">
          <div className="lp-wrap lp-grid gap-y-10">
            <div className="col-span-12 lg:col-span-4">
              <Kicker>Fonctionnement</Kicker>
              <h2 className="lp-h2 mt-4" data-reveal>Quatre gestes, les chiffres suivent.</h2>
            </div>
            <div className="col-span-12 lg:col-span-8" data-reveal>
              <Accordion items={HOW} defaultOpen={0} />
            </div>
          </div>
        </section>

        {/* 5. Tarifs */}
        <section id="tarifs" className="lp-section scroll-mt-20">
          <div className="lp-wrap">
            <Kicker>Tarifs</Kicker>
            <h2 className="lp-h2 mt-4 max-w-[22ch]" data-reveal>Un tarif à la taille de votre établissement.</h2>
            <p className="lp-lead mt-4" data-reveal>Toutes les fonctionnalités dans chaque forfait. Paiement par Mobile Money.</p>
            <div className="lp-plans mt-12" data-stagger>
              {plans.map((p) => <PlanCard key={p.id} plan={p} />)}
            </div>
          </div>
        </section>

        {/* 6. FAQ */}
        <section id="faq" className="lp-section scroll-mt-20">
          <div className="lp-wrap lp-grid gap-y-10">
            <div className="col-span-12 lg:col-span-4">
              <Kicker>Questions</Kicker>
              <h2 className="lp-h2 mt-4" data-reveal>Vos questions.</h2>
              <div className="mt-8 flex flex-col items-start gap-2" data-reveal>
                <a className="lp-btn lp-btn--ghost" href={whatsappLink("Bonjour, j'ai une question sur Warriors Management.")} target="_blank" rel="noopener noreferrer">
                  WhatsApp : {CONTACT.whatsappDisplay}
                </a>
                <a className="text-sm underline underline-offset-4 lp-muted py-2" href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
              </div>
            </div>
            <div className="col-span-12 lg:col-span-8" data-reveal>
              <Accordion items={FAQ} />
            </div>
          </div>
        </section>

        {/* 7. Poster de clôture */}
        <section className="lp-poster-wrap">
          <div className="lp-wrap">
            <div className="lp-poster">
              <p className="lp-kicker"><Plus className="lp-kicker__icon" aria-hidden="true" />Essai gratuit, sans engagement</p>
              <h2 className="lp-display mt-5" data-split>Pilotez votre centre avec des chiffres, pas des suppositions.</h2>
              <p className="lp-lead mt-6" data-reveal>Créez votre espace, importez vos fichiers, invitez votre équipe.</p>
              <div className="mt-10" data-reveal>
                <TrialButton variant="light" />
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
