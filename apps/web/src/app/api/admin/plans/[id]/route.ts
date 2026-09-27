import { NextRequest, NextResponse } from "next/server";
import { adminPrisma } from "@/lib/db/admin";
import { withAdminRoute } from "@/lib/api/admin-handler";

export const PUT = withAdminRoute(async (req, { params }) => {
  try {
    const { id } = params;
    const body = await req.json();
    
    const plan = await adminPrisma.$transaction(async (tx) => {
      const updatedPlan = await tx.plan.update({
        where: { id },
        data: {
          name: body.name,
          description: body.description,
          price: body.price !== undefined ? parseFloat(body.price) : undefined,
          maxCenters: body.isUnlimitedCenters ? -1 : (body.maxCenters !== undefined ? parseInt(body.maxCenters) : undefined),
          maxStudents: body.isUnlimitedStudents ? -1 : (body.maxStudents !== undefined ? parseInt(body.maxStudents) : undefined),
          isUnlimitedCenters: body.isUnlimitedCenters !== undefined ? body.isUnlimitedCenters : undefined,
          isUnlimitedStudents: body.isUnlimitedStudents !== undefined ? body.isUnlimitedStudents : undefined,
          isPopular: body.isPopular,
          features: body.features,
          unavailableFeatures: body.unavailableFeatures,
        }
      });

      if (body.maxCenters !== undefined || body.maxStudents !== undefined || body.isUnlimitedCenters !== undefined || body.isUnlimitedStudents !== undefined) {
        await tx.subscription.updateMany({
          where: { planId: id, status: 'active' },
          data: {
            ...((body.maxCenters !== undefined || body.isUnlimitedCenters !== undefined) && { maxCenters: body.isUnlimitedCenters ? -1 : parseInt(body.maxCenters) }),
            ...((body.maxStudents !== undefined || body.isUnlimitedStudents !== undefined) && { maxStudents: body.isUnlimitedStudents ? -1 : parseInt(body.maxStudents) }),
          }
        });
      }

      return updatedPlan;
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
