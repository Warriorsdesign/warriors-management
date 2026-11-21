import type { Metadata } from "next";
import { db } from "@/lib/db";
import { plans } from "@/lib/db/schema";
import { asc } from "drizzle-orm";
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
  const landingPlans: LandingPlan[] = await db
    .select({
      id: plans.id, name: plans.name, price: plans.price, maxCenters: plans.maxCenters,
      maxStudents: plans.maxStudents, isUnlimitedCenters: plans.isUnlimitedCenters,
      isUnlimitedStudents: plans.isUnlimitedStudents, isPopular: plans.isPopular,
    })
    .from(plans)
    .orderBy(asc(plans.price));
  return <Landing plans={landingPlans} />;
}
