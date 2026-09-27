import { NextResponse } from 'next/server';
import { withAdminRoute } from '@/lib/api/admin-handler';
import { metricsService } from '@/lib/services/metrics.service';

export const GET = withAdminRoute(async (_req) => {
  try {
    const metrics = await metricsService.getGlobalMetrics();
    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques globales:', error);
    return NextResponse.json({ error: 'Erreur lors de la récupération des données' }, { status: 500 });
  }
});
