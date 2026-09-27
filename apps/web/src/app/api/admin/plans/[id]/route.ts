import { NextRequest, NextResponse } from "next/server";
import { adminPrisma } from "@/lib/db/admin";
import { withAdminRoute } from "@/lib/api/admin-handler";

export const PUT = withAdminRoute(async (req, { params }) => {
  try {
    const { id } = params;
    const body = await req.json();
    
    const plan = await adminPrisma.plan.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        price: body.price !== undefined ? parseFloat(body.price) : undefined,
        maxCenters: body.maxCenters !== undefined ? parseInt(body.maxCenters) : undefined,
        maxStudents: body.maxStudents !== undefined ? parseInt(body.maxStudents) : undefined,
        isPopular: body.isPopular,
        features: body.features,
      }
    });

    return NextResponse.json(plan);
  } catch (error: any) {
    console.error(`PUT /api/admin/plans/${params.id} - Erreur:`, error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: "Plan non trouvé" }, { status: 404 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
});

export const DELETE = withAdminRoute(async (req, { params }) => {
  try {
    const { id } = params;
    await adminPrisma.plan.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(`DELETE /api/admin/plans/${params.id} - Erreur:`, error);
    if (error.code === 'P2003') {
      return NextResponse.json({ error: "Impossible de supprimer ce plan car il est utilisé par des organisations" }, { status: 400 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
});
