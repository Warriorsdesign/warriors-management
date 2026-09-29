import Link from "next/link";
import {
  ArrowUpRight, BarChart3, ChevronsRight, Building2, CalendarClock, Check, FileSpreadsheet, GraduationCap,
  Receipt, ShieldCheck, Wallet, X,
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
  return new Intl.NumberFormat("fr-FR").format(value).replace(/ | /g, " ");
}

function Kicker({ n, children }: { n?: string; children: React.ReactNode }) {
  return (
    <p className="lp-kicker" data-reveal>
      {n && <b>{n}</b>}
      {children}
    </p>
  );
}

function TrialButton({ variant = "primary" }: { variant?: "primary" | "accent" | "on-accent" }) {
  return (
    <Link href="/essai" className={`lp-btn lp-btn--${variant}`}>
      {TRIAL_CTA}
      <span className="lp-btn__dot" aria-hidden="true"><ArrowUpRight className="w-4 h-4" /></span>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Petites maquettes (données fictives)
// ---------------------------------------------------------------------------

function MiniRow({ left, right, tone }: { left: string; right: string; tone?: string }) {
  return (
    <div className="flex justify-between gap-3 py-2 border-b border-[var(--lp-line)] last:border-0 text-sm">
      <span className="text-[var(--lp-muted)]">{left}</span>
      <span className={`font-semibold tabular-nums ${tone ?? ""}`}>{right}</span>
    </div>
  );
}

function MiniPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[var(--lp-radius-sm)] border border-[var(--lp-line)] bg-white p-4 w-full max-w-sm shadow-[0_20px_40px_-30px_rgba(20,20,20,0.4)]">
      <p className="text-xs font-bold mb-1">{title}</p>
      {children}
    </div>
  );
}

function TeamVisual() {
  return (
    <div className="mt-6 space-y-2">
      {[
        { name: "Centre Akwa", people: "Gestionnaire, Comptable", n: "74 étudiants" },
        { name: "Centre Bonamoussadi", people: "Gestionnaire", n: "52 étudiants" },
        { name: "Centre Yaoundé Bastos", people: "Gestionnaire, Comptable", n: "30 étudiants" },
      ].map((c) => (
        <div key={c.name} className="flex items-center gap-3 rounded-[var(--lp-radius-sm)] border border-[var(--lp-line)] bg-[var(--lp-bg)] p-3">
          <span className="w-9 h-9 rounded-lg bg-white border border-[var(--lp-line)] flex items-center justify-center shrink-0">
            <Building2 className="w-4 h-4" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold truncate">{c.name}</span>
            <span className="block text-xs text-[var(--lp-muted)] truncate">{c.people}</span>
          </span>
          <span className="text-xs font-semibold tabular-nums">{c.n}</span>
        </div>
      ))}
      <p className="text-xs text-[var(--lp-muted)] pt-1">Exemple, données fictives</p>
    </div>
  );
}

function ImportVisual() {
  return (
    <div className="rounded-[var(--lp-radius-sm)] border border-[var(--lp-line)] bg-[var(--lp-bg)] p-4 text-sm">
      <p className="flex items-center gap-2 font-semibold"><FileSpreadsheet className="w-4 h-4" aria-hidden="true" /> etudiants_rentree.xlsx</p>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg bg-white p-2.5"><p className="text-lg font-bold text-emerald-700">212</p><p className="text-xs text-[var(--lp-muted)]">valides</p></div>
        <div className="rounded-lg bg-white p-2.5"><p className="text-lg font-bold text-rose-700">3</p><p className="text-xs text-[var(--lp-muted)]">à corriger</p></div>
        <div className="rounded-lg bg-white p-2.5"><p className="text-lg font-bold">1</p><p className="text-xs text-[var(--lp-muted)]">doublon</p></div>
      </div>
      <ul className="mt-3 space-y-1 text-xs text-[var(--lp-muted)]">
        <li>Ligne 14 · Classe « Info Soir B » introuvable</li>
        <li>Ligne 58 · Date « 31/02/2026 » invalide</li>
        <li>Ligne 97 · Étudiant déjà enregistré</li>
      </ul>
      <p className="mt-2 text-[11px] text-[var(--lp-muted)]">Exemple d’analyse, données fictives</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Contenu
// ---------------------------------------------------------------------------

const STATS = [
  { value: 14, text: "14", label: `jours d’essai gratuit, sans engagement` },
  { value: 5000, text: "5 000", label: "lignes par fichier Excel importé" },
  { value: 6, text: "6", label: "périodes d’analyse, d’aujourd’hui à l’année" },
];

const TRAININGS = [
  "Informatique", "Comptabilité", "Secrétariat bureautique", "Infographie", "Langues", "Couture",
  "Esthétique et coiffure", "Hôtellerie", "Maintenance", "Commerce", "Logistique", "Marketing digital",
];

const HOW: AccordionItem[] = [
  {
    title: "Vous inscrivez",
    content: (
      <div className="grid gap-6 md:grid-cols-2 items-start">
        <div>
          <p className="lp-muted">
            L’accueil crée la fiche de l’étudiant, choisit sa classe et fixe ses frais : inscription payée et nombre de tranches.
            Tout le reste en découle.
          </p>
          <ul className="mt-4 space-y-2">
            {["Matricule attribué automatiquement", "Échéancier calculé dès l’inscription", "Classe, niveau et statut au même endroit"].map((b) => (
              <li key={b} className="flex gap-2"><Check className="w-5 h-5 text-[var(--lp-accent-text)] shrink-0" aria-hidden="true" />{b}</li>
            ))}
          </ul>
        </div>
        <MiniPanel title="Nouvelle inscription">
          <MiniRow left="Formation" right="Informatique" />
          <MiniRow left="Frais d’inscription" right="25 000 FCFA" />
          <MiniRow left="Tranches" right="10 × 1 mois" />
          <MiniRow left="Première échéance" right="06/11/2026" />
        </MiniPanel>
      </div>
    ),
  },
  {
    title: "Vous encaissez",
    content: (
      <div className="grid gap-6 md:grid-cols-2 items-start">
        <div>
          <p className="lp-muted">
            Un paiement en espèces ou par Mobile Money s’enregistre en quelques secondes. Le reçu est prêt, et ce qu’il reste
            à payer se met à jour tout seul.
          </p>
          <ul className="mt-4 space-y-2">
            {["Reçu imprimable pour chaque paiement", "Tranches soldées dans l’ordre", "Retards détectés sans intervention"].map((b) => (
              <li key={b} className="flex gap-2"><Check className="w-5 h-5 text-[var(--lp-accent-text)] shrink-0" aria-hidden="true" />{b}</li>
            ))}
          </ul>
        </div>
        <MiniPanel title="Paiement enregistré">
          <MiniRow left="Tranche 2" right="25 000 FCFA" />
          <MiniRow left="Mode" right="Mobile Money" />
          <MiniRow left="Reste à payer" right="175 000 FCFA" />
          <MiniRow left="Statut" right="À jour" tone="text-emerald-700" />
        </MiniPanel>
      </div>
    ),
  },
  {
    title: "Vous suivez",
    content: (
      <div className="grid gap-6 md:grid-cols-2 items-start">
        <div>
          <p className="lp-muted">
            Un effectif de 156 étudiants ne dit pas grand-chose. 24 arrivées et 8 départs ce mois-ci, ça raconte déjà une
            histoire. Changez de période en un clic, filtrez par centre ou par formation.
          </p>
          <ul className="mt-4 space-y-2">
            {["Aujourd’hui, ce mois, le trimestre, l’année", "Entrées et sorties par formation", "Encaissements jour par jour"].map((b) => (
              <li key={b} className="flex gap-2"><Check className="w-5 h-5 text-[var(--lp-accent-text)] shrink-0" aria-hidden="true" />{b}</li>
            ))}
          </ul>
        </div>
        <MiniPanel title="Ce mois-ci">
          <MiniRow left="Nouvelles inscriptions" right="+24" tone="text-emerald-700" />
          <MiniRow left="Départs" right="-8" tone="text-rose-700" />
          <MiniRow left="Étudiants actifs" right="156" />
          <MiniRow left="Centre de Douala" right="62 depuis la rentrée" />
        </MiniPanel>
      </div>
    ),
  },
  {
    title: "Vous agissez",
    content: (
      <div className="grid gap-6 md:grid-cols-2 items-start">
        <div>
          <p className="lp-muted">
            Avoir les données, c’est bien. Savoir ce qu’elles veulent dire, c’est mieux. Les échéances à venir et les impayés
            sont déjà triés : vous savez qui appeler aujourd’hui.
          </p>
          <ul className="mt-4 space-y-2">
            {["Échéances des 7 prochains jours", "Impayés par ancienneté", "Bilan de la période en PDF"].map((b) => (
              <li key={b} className="flex gap-2"><Check className="w-5 h-5 text-[var(--lp-accent-text)] shrink-0" aria-hidden="true" />{b}</li>
            ))}
          </ul>
        </div>
        <MiniPanel title="Impayés par ancienneté">
          <MiniRow left="Moins de 30 jours" right="180 000 FCFA" />
          <MiniRow left="30 à 60 jours" right="95 000 FCFA" />
          <MiniRow left="Plus de 60 jours" right="45 000 FCFA" tone="text-rose-700" />
        </MiniPanel>
      </div>
    ),
  },
];

const SEGMENTS = [
  {
    title: "La direction",
    text: "Tous les centres d’un coup d’œil : inscriptions, départs, encaissements et résultat de la période.",
    visual: (
      <MiniPanel title="Vue d’ensemble">
        <MiniRow left="Étudiants actifs" right="156" />
        <MiniRow left="CA du mois" right="1 450 000" />
        <MiniRow left="Recouvrement" right="82 %" />
      </MiniPanel>
    ),
  },
  {
    title: "La gestion pédagogique",
    text: "Inscriptions, classes et suivi des étudiants, avec le statut de paiement mais sans accès à la caisse.",
    visual: (
      <MiniPanel title="Classe Informatique A">
        <MiniRow left="Effectif" right="28 / 30" />
        <MiniRow left="Nouvel inscrit" right="À jour" tone="text-emerald-700" />
        <MiniRow left="Réinscrit" right="En retard" tone="text-rose-700" />
      </MiniPanel>
    ),
  },
  {
    title: "La comptabilité",
    text: "Encaissements, reçus, dépenses et rapports financiers, centre par centre.",
    visual: (
      <MiniPanel title="Dépenses du mois">
        <MiniRow left="Loyer" right="250 000" />
        <MiniRow left="Salaires" right="300 000" />
        <MiniRow left="Électricité" right="60 000" />
      </MiniPanel>
    ),
  },
];

const ONBOARDING = [
  { title: "Créez votre espace", text: "Le nom de votre établissement, votre email, un mot de passe." },
  { title: "Décrivez votre établissement", text: "Un assistant vous guide : centres, formations, classes." },
  { title: "Importez vos fichiers", text: "Vos étudiants déjà inscrits arrivent depuis Excel, vérifiés ligne par ligne." },
  { title: "Invitez votre équipe", text: "Chacun reçoit son accès, limité à son centre et à son rôle." },
];

const COMPARE = [
  { before: "Les inscriptions dans un registre, les paiements dans Excel", after: "Inscriptions, paiements et dépenses au même endroit" },
  { before: "Les chiffres du mois arrivent quand le mois est fini", after: "Les chiffres du jour, chaque matin" },
  { before: "Les retards se découvrent au moment de relancer", after: "Les échéances des 7 prochains jours, listées à l’avance" },
  { before: "Un fichier par centre, une façon de compter par centre", after: "Tous vos centres, comptés de la même façon" },
  { before: "On ne sait plus très bien qui a accès à quoi", after: "Chacun voit son centre et ce que son rôle permet" },
];

const FAQ: AccordionItem[] = [
  {
    title: "Mes données sont-elles visibles par d’autres établissements ?",
    content: (
      <p className="lp-muted max-w-[65ch]">
        Non. Chaque établissement dispose de son propre espace, séparé des autres. À l’intérieur, chaque employé ne voit que
        son centre et ce que son rôle lui permet : votre gestionnaire peut inscrire des étudiants sans voir la caisse.
      </p>
    ),
  },
  {
    title: "J’ai plusieurs centres. Est-ce que ça fonctionne ?",
    content: (
      <p className="lp-muted max-w-[65ch]">
        Oui. Vous voyez l’ensemble de vos centres ou un seul à la fois, et vous rattachez chaque membre de l’équipe au centre
        où il travaille. Le nombre de centres dépend du forfait choisi.
      </p>
    ),
  },
  {
    title: "Faut-il installer quelque chose ?",
    content: (
      <p className="lp-muted max-w-[65ch]">
        Non. Tout se passe dans le navigateur, sur l’ordinateur du centre. Une connexion internet est nécessaire pour travailler.
      </p>
    ),
  },
  {
    title: "Je dois tout ressaisir ?",
    content: (
      <p className="lp-muted max-w-[65ch]">
        Non. Vos formations, vos classes et vos étudiants s’importent depuis des fichiers Excel, jusqu’à 5 000 lignes par
        fichier. Chaque ligne est vérifiée avant l’import : vous corrigez ce qui pose problème, puis vous relancez.
      </p>
    ),
  },
  {
    title: `Que se passe-t-il au bout des ${TRIAL_DAYS} jours, et comment payer ?`,
    content: (
      <p className="lp-muted max-w-[65ch]">
        Votre espace est mis en pause jusqu’à ce que vous choisissiez un forfait. Rien n’est effacé : vous reprenez là où vous
        en étiez. L’abonnement se règle par Mobile Money : écrivez-nous et votre forfait est activé dès réception du paiement.
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
  if (p.price === 0) return "Pour découvrir l’outil avec vos propres données.";
  if (p.isUnlimitedCenters || p.maxCenters === -1) return "Pour les établissements à plusieurs sites.";
  return "Pour un centre qui grandit, ou deux à trois sites.";
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
        <Link href="/essai" className="lp-btn lp-btn--accent mt-8">
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
          <div className="lp-wrap">
            <div className="lp-hero__panel">
              <Kicker>Pour les centres de formation</Kicker>
              <h1 className="lp-display mt-5 max-w-[17ch]" data-split>
                Sachez chaque jour{" "}
                <span className="lp-inline-icon" aria-hidden="true"><span><BarChart3 /></span><ChevronsRight /></span>{" "}
                ce qui se passe dans votre centre de formation.
              </h1>
              <p className="lp-lead mt-6" data-reveal>
                Inscriptions, départs, paiements et dépenses au même endroit, avec les chiffres de la journée dès le matin.
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

        {/* 2. Chiffres clés */}
        <section className="lp-after-hero border-t border-[var(--lp-line)] bg-[var(--lp-bg)]">
          <div className="lp-wrap">
            <div className="lp-stats" data-stagger>
              {STATS.map((s) => (
                <div key={s.label} data-reveal>
                  <p className="lp-stat__value" data-count={s.value}>{s.text}</p>
                  <p className="mt-2 lp-muted">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Bandeau défilant */}
          <div className="lp-wrap mt-14">
            <p className="lp-kicker">Pensé pour les centres qui forment en</p>
          </div>
          <div className="lp-marquee mt-5 pb-16" aria-label={`Formations : ${TRAININGS.join(", ")}`}>
            <div className="lp-marquee__track" aria-hidden="true">
              {[...TRAININGS, ...TRAININGS].map((t, i) => <span key={i} className="lp-marquee__item">{t}</span>)}
            </div>
          </div>
        </section>

        {/* 4. Manifeste */}
        <section className="lp-section lp-manifesto">
          <div className="lp-wrap relative">
            <span className="lp-deco hidden sm:flex" style={{ top: "-10%", right: "8%" }} data-parallax="0.12" aria-hidden="true"><Wallet className="w-6 h-6" /></span>
            <span className="lp-deco hidden sm:flex" style={{ top: "38%", right: "22%" }} data-parallax="-0.08" aria-hidden="true"><GraduationCap className="w-6 h-6" /></span>
            <span className="lp-deco hidden md:flex" style={{ bottom: "-12%", right: "4%" }} data-parallax="0.1" aria-hidden="true"><CalendarClock className="w-6 h-6" /></span>
            <span className="lp-deco hidden lg:flex" style={{ bottom: "-6%", right: "36%" }} data-parallax="-0.12" aria-hidden="true"><Receipt className="w-6 h-6" /></span>
            <Kicker>Notre conviction</Kicker>
            <p className="lp-manifesto__text mt-6" data-split="scroll">
              Votre centre mérite des chiffres à jour, pas des souvenirs de fin de mois.
            </p>
          </div>
        </section>

        {/* 5. Fonctionnalités */}
        <section id="fonctionnalites" className="lp-section scroll-mt-20">
          <div className="lp-wrap">
            <Kicker n="01">Fonctionnalités</Kicker>
            <h2 className="lp-h2 mt-4 max-w-[20ch]" data-reveal>Ce que votre équipe fait chaque jour, en plus simple.</h2>
            <div className="lp-features mt-12" data-stagger>
              <article className="lp-card" data-reveal>
                <p className="lp-num">01 · Effectifs</p>
                <h3 className="lp-h3 mt-3">Qui arrive, qui part</h3>
                <p className="mt-2 lp-muted">Entrées, sorties et effectif par formation, sur la période de votre choix. Vous voyez quelle formation attire et laquelle se vide.</p>
              </article>
              <article className="lp-card" data-reveal>
                <p className="lp-num">02 · Paiements</p>
                <h3 className="lp-h3 mt-3">Ce qui est encaissé, ce qui reste</h3>
                <p className="mt-2 lp-muted">Espèces ou Mobile Money, reçu remis sur place, tranches suivies. Les retards apparaissent seuls, classés par ancienneté.</p>
              </article>
              <article className="lp-card flex flex-col" data-reveal>
                <p className="lp-num">03 · Centres et équipe</p>
                <h3 className="lp-h3 mt-3">Chacun voit ce qui le concerne</h3>
                <p className="mt-2 lp-muted">Vue d’ensemble pour la direction, un centre à la fois pour les équipes. Les rôles décident qui voit la caisse.</p>
                <TeamVisual />
              </article>
              <article className="lp-card grid gap-6 md:grid-cols-2 md:items-center" data-reveal>
                <div>
                  <p className="lp-num">04 · Import Excel</p>
                  <h3 className="lp-h3 mt-3">Vos données sont déjà dans Excel ? Gardez-les.</h3>
                  <p className="mt-2 lp-muted">Téléchargez nos modèles, recopiez-y vos formations, vos classes et vos étudiants, puis envoyez le fichier. Chaque ligne est vérifiée avant l’import.</p>
                </div>
                <ImportVisual />
              </article>
            </div>
          </div>
        </section>

        {/* 6. Comment ça marche */}
        <section id="fonctionnement" className="lp-section scroll-mt-20">
          <div className="lp-wrap lp-grid gap-y-10">
            <div className="col-span-12 lg:col-span-4">
              <Kicker n="02">Fonctionnement</Kicker>
              <h2 className="lp-h2 mt-4" data-reveal>Un seul endroit, quatre gestes.</h2>
              <p className="lp-lead mt-4" data-reveal>Votre équipe travaille comme d’habitude. Les chiffres se calculent seuls.</p>
            </div>
            <div className="col-span-12 lg:col-span-8" data-reveal>
              <Accordion items={HOW} defaultOpen={0} />
            </div>
          </div>
        </section>

        {/* 7. Chiffres + CTA (fond contrasté) */}
        <section className="lp-section">
          <div className="lp-wrap">
            <div className="lp-darkpanel">
            <div className="grid gap-10 sm:grid-cols-2" data-stagger>
              <div data-reveal>
                <p className="lp-bigvalue">1 seul</p>
                <p className="mt-3 text-[var(--lp-on-dark-muted)]">endroit pour tous vos centres, toute votre équipe et tous vos chiffres.</p>
              </div>
              <div data-reveal>
                <p className="lp-bigvalue"><span data-count="7">7</span> jours</p>
                <p className="mt-3 text-[var(--lp-on-dark-muted)]">d’échéances à venir, listées à l’avance pour relancer au bon moment.</p>
              </div>
            </div>
            <div className="mt-12 pt-10 border-t border-[#2a3232] flex flex-col md:flex-row md:items-center justify-between gap-6" data-reveal>
              <p className="lp-h3 max-w-[30ch]">Relancez avant le retard, pas après.</p>
              <TrialButton variant="accent" />
            </div>
            </div>
          </div>
        </section>

        {/* 8. Pour qui */}
        <section className="lp-section">
          <div className="lp-wrap">
            <Kicker n="03">Pour qui</Kicker>
            <h2 className="lp-h2 mt-4 max-w-[22ch]" data-reveal>Chacun dans l’établissement y trouve ce qu’il cherche.</h2>
            <div className="lp-segments mt-12" data-stagger>
              {SEGMENTS.map((s) => (
                <Link key={s.title} href="/essai" className="lp-card lp-segment" data-reveal>
                  <div className="lp-segment__visual">{s.visual}</div>
                  <div className="p-6">
                    <h3 className="lp-h3">{s.title}</h3>
                    <p className="mt-2 lp-muted">{s.text}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* 9. Démarrage */}
        <section className="lp-section">
          <div className="lp-wrap">
            <Kicker n="04">Démarrage</Kicker>
            <h2 className="lp-h2 mt-4 max-w-[22ch]" data-reveal>Opérationnel dès le premier jour.</h2>
            <ol className="lp-steps mt-12" data-stagger>
              {ONBOARDING.map((s, i) => (
                <li key={s.title} className="lp-step" data-reveal>
                  <span className="lp-step__dot" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="lp-h3">{s.title}</h3>
                  <p className="mt-2 lp-muted">{s.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* 10. Comparatif */}
        <section className="lp-section">
          <div className="lp-wrap">
            <Kicker n="05">Avant, après</Kicker>
            <h2 className="lp-h2 mt-4 max-w-[22ch]" data-reveal>Vous connaissez votre nombre d’étudiants. Mais le reste ?</h2>
            <p className="lp-lead mt-4" data-reveal>
              Dans beaucoup de centres, la réponse existe mais elle est éparpillée : un registre à l’accueil, un fichier Excel pour
              les paiements, et un coup de téléphone pour savoir où en est l’autre centre.
            </p>
            <div className="lp-compare mt-12">
              <div className="lp-card lp-compare__col" data-stagger>
                <p className="lp-compare__head bg-white">L’ancienne façon</p>
                {COMPARE.map((c) => (
                  <p key={c.before} className="lp-compare__row" data-reveal>
                    <X className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" aria-label="Non" />
                    <span className="lp-muted">{c.before}</span>
                  </p>
                ))}
              </div>
              <span className="lp-vs" aria-hidden="true">VS</span>
              <div className="lp-card lp-compare__col lp-compare__col--new" data-stagger>
                <p className="lp-compare__head bg-[var(--lp-dark)]">Avec Warriors Management</p>
                {COMPARE.map((c) => (
                  <p key={c.after} className="lp-compare__row" data-reveal>
                    <Check className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" aria-label="Oui" />
                    <span>{c.after}</span>
                  </p>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 11. Tarifs */}
        <section id="tarifs" className="lp-section scroll-mt-20">
          <div className="lp-wrap">
            <Kicker n="06">Tarifs</Kicker>
            <h2 className="lp-h2 mt-4 max-w-[22ch]" data-reveal>Un tarif qui suit la taille de votre établissement.</h2>
            <p className="lp-lead mt-4" data-reveal>Toutes les fonctionnalités sont incluses dans chaque forfait. Seules les limites changent.</p>
            <div className="lp-plans mt-12" data-stagger>
              {plans.map((p) => <PlanCard key={p.id} plan={p} />)}
            </div>
            <p className="mt-6 text-[15px] lp-muted">
              Abonnement réglé par Mobile Money. Une question sur les forfaits ? WhatsApp : {CONTACT.whatsappDisplay}.
            </p>
          </div>
        </section>

        {/* 12. FAQ */}
        <section id="faq" className="lp-section scroll-mt-20">
          <div className="lp-wrap lp-grid gap-y-10">
            <div className="col-span-12 lg:col-span-4">
              <Kicker n="07">Questions</Kicker>
              <h2 className="lp-h2 mt-4" data-reveal>Les questions qu’on nous pose.</h2>
              <div className="lp-card mt-8" data-reveal>
                <p className="font-bold">Une autre question ?</p>
                <p className="mt-1 text-[15px] lp-muted">Écrivez-nous, on vous répond rapidement.</p>
                <div className="mt-4 flex flex-col gap-2">
                  <a className="lp-btn lp-btn--ghost" href={whatsappLink("Bonjour, j'ai une question sur Warriors Management.")} target="_blank" rel="noopener noreferrer">
                    WhatsApp : {CONTACT.whatsappDisplay}
                  </a>
                  <a className="text-sm underline underline-offset-4 lp-muted text-center py-2" href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
                </div>
              </div>
            </div>
            <div className="col-span-12 lg:col-span-8" data-reveal>
              <Accordion items={FAQ} />
            </div>
          </div>
        </section>

        {/* 13. Poster de clôture (seul aplat d'accent) */}
        <section className="lp-poster-wrap">
          <div className="lp-wrap">
            <div className="lp-poster">
              <p className="lp-kicker"><ShieldCheck className="w-4 h-4" aria-hidden="true" /> Essai gratuit, sans engagement</p>
              <h2 className="lp-display mt-5" data-split>Regardez votre centre avec des chiffres, pas avec des suppositions.</h2>
              <div className="mt-10" data-reveal>
                <TrialButton variant="on-accent" />
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
