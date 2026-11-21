export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { plans } from "@/lib/db/schema";
import { asc } from "drizzle-orm";
import { withAdminRoute } from "@/lib/api/admin-handler";

export const GET = withAdminRoute(async () => {
  try {
    const rows = await db.select().from(plans).orderBy(asc(plans.price));
    return NextResponse.json(rows);
  } catch (error) {
    console.error("GET /api/admin/plans - Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
});

export const POST = withAdminRoute(async (req) => {
  try {
    const body = await req.json();
    const { name, description, price, maxCenters, maxStudents, isUnlimitedCenters, isUnlimitedStudents, isPopular, features, unavailableFeatures } = body;

    if (!name || (maxCenters === undefined && !isUnlimitedCenters) || (maxStudents === undefined && !isUnlimitedStudents)) {
      return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
    }

    const [plan] = await db.insert(plans).values({
      name,
      description,
      price: parseFloat(price) || 0,
      maxCenters: isUnlimitedCenters ? -1 : parseInt(maxCenters),
      maxStudents: isUnlimitedStudents ? -1 : parseInt(maxStudents),
      isUnlimitedCenters: !!isUnlimitedCenters,
      isUnlimitedStudents: !!isUnlimitedStudents,
      isPopular: !!isPopular,
      features: features || [],
      unavailableFeatures: unavailableFeatures || [],
    }).returning();

    return NextResponse.json(plan, { status: 201 });
  } catch (error: unknown) {
    console.error("POST /api/admin/plans - Erreur:", error);
    if (error instanceof Error && 'code' in error && (error as Error & { code?: string }).code === '23505') {
      return NextResponse.json({ error: "Un plan avec ce nom existe déjà" }, { status: 400 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
});
