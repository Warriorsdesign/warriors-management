import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { plans, subscriptions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { withAdminRoute } from "@/lib/api/admin-handler";

export const PUT = withAdminRoute(async (req, { params }) => {
  try {
    const { id } = params;
    const body = await req.json();

    const result = await db.transaction(async (tx) => {
      const values: Partial<typeof plans.$inferInsert> = {};
      if (body.name !== undefined) values.name = body.name;
      if (body.description !== undefined) values.description = body.description;
      if (body.price !== undefined) values.price = parseFloat(body.price);
      if (body.isUnlimitedCenters !== undefined) values.isUnlimitedCenters = body.isUnlimitedCenters;
      if (body.isUnlimitedStudents !== undefined) values.isUnlimitedStudents = body.isUnlimitedStudents;
      if (body.isPopular !== undefined) values.isPopular = body.isPopular;
      if (body.features !== undefined) values.features = body.features;
      if (body.unavailableFeatures !== undefined) values.unavailableFeatures = body.unavailableFeatures;
      if (body.isUnlimitedCenters) values.maxCenters = -1;
      else if (body.maxCenters !== undefined) values.maxCenters = parseInt(body.maxCenters);
      if (body.isUnlimitedStudents) values.maxStudents = -1;
      else if (body.maxStudents !== undefined) values.maxStudents = parseInt(body.maxStudents);

      const [updated] = await tx.update(plans).set(values).where(eq(plans.id, id)).returning();
      if (!updated) throw Object.assign(new Error('Plan not found'), { code: '23503' });

      if (body.maxCenters !== undefined || body.maxStudents !== undefined || body.isUnlimitedCenters !== undefined || body.isUnlimitedStudents !== undefined) {
        const subscriptionValues: Partial<typeof subscriptions.$inferInsert> = {};
        if (body.isUnlimitedCenters) subscriptionValues.maxCenters = -1;
        else if (body.maxCenters !== undefined) subscriptionValues.maxCenters = parseInt(body.maxCenters);
        if (body.isUnlimitedStudents) subscriptionValues.maxStudents = -1;
        else if (body.maxStudents !== undefined) subscriptionValues.maxStudents = parseInt(body.maxStudents);
        await tx.update(subscriptions).set(subscriptionValues).where(and(eq(subscriptions.planId, id), eq(subscriptions.status, 'active')));
      }
      return updated;
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error(`PUT /api/admin/plans/${params.id} - Erreur:`, error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
});

export const DELETE = withAdminRoute(async (_req, { params }) => {
  try {
    const { id } = params;
    await db.delete(plans).where(eq(plans.id, id));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error(`DELETE /api/admin/plans/${params.id} - Erreur:`, error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
});
