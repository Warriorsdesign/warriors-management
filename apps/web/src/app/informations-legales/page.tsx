import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "@/components/landing/SiteChrome";
import { CONTACT, TRIAL_DAYS } from "@/lib/config/contact";

export const metadata: Metadata = {
  title: "Informations légales · Warriors Management",
  description: "Mentions légales, conditions d'utilisation et politique de confidentialité de Warriors Management.",
};

/**
 * ÉBAUCHE en attente de validation juridique. Les éléments entre crochets sont à compléter
 * par l'éditeur (raison sociale, RCCM, adresse, hébergeur).
 */
function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20 py-8 border-b border-border last:border-0">
      <h2 className="text-2xl font-bold text-foreground">{title}</h2>
      <div className="mt-4 space-y-4 text-muted-foreground leading-relaxed">{children}</div>
    </section>
  );
}

function Sub({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="font-semibold text-foreground">{title}</h3>
      <div className="mt-1.5 space-y-2">{children}</div>
    </div>
  );
}

export default function InformationsLegalesPage() {
  return (
    <div className="lp min-h-screen flex flex-col">
      <SiteHeader solid />
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-12">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">Informations légales</h1>
        <p className="mt-3 text-sm rounded-lg bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3">
          Version provisoire, en cours de validation. Dernière mise à jour : septembre 2026.
        </p>
        <nav className="mt-6 flex flex-wrap gap-3 text-sm">
          <a href="#mentions" className="px-3 py-1.5 rounded-lg bg-background border border-border hover:bg-secondary">Mentions légales</a>
          <a href="#conditions" className="px-3 py-1.5 rounded-lg bg-background border border-border hover:bg-secondary">Conditions d’utilisation</a>
          <a href="#confidentialite" className="px-3 py-1.5 rounded-lg bg-background border border-border hover:bg-secondary">Confidentialité</a>
        </nav>

        <Section id="mentions" title="Mentions légales">
          <Sub title="Éditeur">
            <p>Warriors Management est édité par [raison sociale], [forme juridique], immatriculée au RCCM sous le numéro [numéro], dont le siège est situé [adresse], Cameroun.</p>
            <p>Contact : {CONTACT.email} · WhatsApp : {CONTACT.whatsappDisplay}.</p>
          </Sub>
          <Sub title="Hébergement">
            <p>Le service est hébergé par [nom de l’hébergeur], [adresse de l’hébergeur].</p>
          </Sub>
        </Section>

        <Section id="conditions" title="Conditions d’utilisation">
          <Sub title="1. Objet">
            <p>Warriors Management est un service en ligne qui permet aux centres de formation de suivre leurs inscriptions, leurs étudiants, leurs paiements, leurs dépenses et leur activité. Les présentes conditions encadrent son utilisation par l’établissement client et par les personnes qu’il autorise.</p>
          </Sub>
          <Sub title="2. Création du compte">
            <p>La personne qui crée l’espace déclare agir au nom de l’établissement et être habilitée à l’engager. Elle devient administrateur de l’espace et fournit des informations exactes. Chaque utilisateur est responsable de la confidentialité de son matricule et de son mot de passe.</p>
          </Sub>
          <Sub title="3. Essai gratuit">
            <p>Chaque nouvel établissement bénéficie d’un essai gratuit de {TRIAL_DAYS} jours, dans les limites du forfait d’essai. À l’issue de l’essai, l’accès est suspendu tant qu’aucun forfait payant n’a été choisi. Aucun montant n’est prélevé automatiquement.</p>
          </Sub>
          <Sub title="4. Forfaits et paiement">
            <p>Les forfaits, leurs limites et leurs prix sont indiqués sur le site. L’abonnement est réglé d’avance, par Mobile Money ou selon les modalités convenues avec l’éditeur. Le forfait est activé à réception du paiement. À l’échéance, faute de renouvellement, l’accès est suspendu ; les données sont conservées.</p>
          </Sub>
          <Sub title="5. Données de l’établissement">
            <p>L’établissement reste propriétaire des données qu’il saisit ou importe. Il est responsable de leur exactitude et de la licéité de leur collecte auprès de ses étudiants et de son personnel. L’éditeur les traite uniquement pour fournir le service.</p>
          </Sub>
          <Sub title="6. Utilisation du service">
            <p>Le client s’engage à ne pas utiliser le service à des fins illicites, à ne pas tenter d’accéder aux données d’autres établissements et à ne pas perturber son fonctionnement.</p>
          </Sub>
          <Sub title="7. Disponibilité et responsabilité">
            <p>L’éditeur met en œuvre des moyens raisonnables pour assurer la disponibilité et la sécurité du service, sans garantir une disponibilité ininterrompue. Le service nécessite une connexion internet. La responsabilité de l’éditeur est limitée aux dommages directs et, au plus, aux sommes versées par le client au cours des douze derniers mois.</p>
          </Sub>
          <Sub title="8. Résiliation">
            <p>Le client peut cesser d’utiliser le service à tout moment. L’éditeur peut suspendre un compte en cas de non-paiement ou de manquement grave aux présentes conditions.</p>
          </Sub>
          <Sub title="9. Droit applicable">
            <p>Les présentes conditions sont soumises au droit camerounais. À défaut d’accord amiable, tout litige relève des juridictions compétentes de [ville].</p>
          </Sub>
        </Section>

        <Section id="confidentialite" title="Politique de confidentialité">
          <Sub title="Données collectées">
            <p>Lors de l’inscription : nom de l’établissement, nom, prénom, email et téléphone de l’administrateur. Dans le cadre du service : les données saisies par l’établissement (étudiants, personnel, paiements, dépenses). Pour la sécurité : journaux de connexion et adresse IP.</p>
          </Sub>
          <Sub title="Finalités">
            <p>Fournir et sécuriser le service, gérer l’abonnement, prévenir les abus et répondre aux demandes du client. Les données ne sont ni vendues ni utilisées à des fins publicitaires.</p>
          </Sub>
          <Sub title="Séparation et accès">
            <p>Chaque établissement dispose d’un espace séparé. À l’intérieur, les accès sont limités selon le rôle et le centre de chaque utilisateur. Les mots de passe sont stockés sous forme chiffrée et irréversible.</p>
          </Sub>
          <Sub title="Durée de conservation">
            <p>Les données sont conservées pendant la durée de l’abonnement, puis [durée] après sa fin, sauf demande de suppression de l’établissement ou obligation légale contraire.</p>
          </Sub>
          <Sub title="Vos droits">
            <p>Conformément à la réglementation camerounaise applicable, toute personne concernée peut demander l’accès, la rectification ou la suppression de ses données en écrivant à {CONTACT.email}. Pour les données des étudiants, la demande est traitée avec l’établissement concerné.</p>
          </Sub>
        </Section>
      </main>
      <SiteFooter />
    </div>
  );
}
