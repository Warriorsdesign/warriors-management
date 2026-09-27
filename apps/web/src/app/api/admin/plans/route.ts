import { NextRequest, NextResponse } from "next/server";
import { adminPrisma } from "@/lib/db/admin";
import { withAdminRoute } from "@/lib/api/admin-handler";

export const GET = withAdminRoute(async (req) => {
  try {
    const plans = await adminPrisma.plan.findMany({
      orderBy: { price: 'asc' }
    });
    return NextResponse.json(plans);
  } catch (error) {
    console.error("GET /api/admin/plans - Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
});

export const POST = withAdminRoute(async (req) => {
  try {
    const body = await req.json();
    const { name, description, price, maxCenters, maxStudents, isPopular, features } = body;

    if (!name || maxCenters === undefined || maxStudents === undefined) {
      return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
    }

    const plan = await adminPrisma.plan.create({
      data: {
        name,
        description,
        price: parseFloat(price) || 0,
        maxCenters: parseInt(maxCenters),
        maxStudents: parseInt(maxStudents),
        isPopular: !!isPopular,
        features: features || [],
      },
    });

    return NextResponse.json(plan, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/admin/plans - Erreur:", error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Un plan avec ce nom existe déjà" }, { status: 400 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
});
