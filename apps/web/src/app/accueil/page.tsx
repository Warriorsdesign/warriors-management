import type { Metadata } from "next";
import { adminPrisma } from "@/lib/db/admin";
import { Landing, type LandingPlan } from "@/components/landing/Landing";

export const metadata: Metadata = {
  title: "Warriors Management · Le suivi de votre centre de formation",
  description:
    "Inscriptions, départs, paiements et dépenses au même endroit. Voyez chaque jour ce qui se passe dans votre centre de formation. Essai gratuit de 14 jours.",
  openGraph: {
    title: "Warriors Management",
    description: "Sachez chaque jour ce qui se passe dans votre centre de formation.",
    locale: "fr_FR",
    type: "website",
  },
};

// Forfaits lus en base : un nom ou un prix modifié dans le back-office apparaît ici sans toucher au code.
export const dynamic = "force-dynamic";

export default async function AccueilPage() {
  const plans: LandingPlan[] = await adminPrisma.plan.findMany({
    orderBy: { price: "asc" },
    select: {
      id: true, name: true, price: true, maxCenters: true, maxStudents: true,
      isUnlimitedCenters: true, isUnlimitedStudents: true, isPopular: true,
    },
  });
  return <Landing plans={plans} />;
}
