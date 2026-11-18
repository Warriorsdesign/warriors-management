import { NextResponse } from 'next/server';
import { ApiError, toErrorResponse } from '@/lib/api/errors';
import { setAuthCookie } from '@/lib/auth/session';
import { assertSignupRateLimit, createTrialOrganization } from '@/lib/business/signup';
import { signupSchema } from '@/lib/validation/signup';
import { clientIp } from '@/lib/auth/loginThrottle';


/**
 * Inscription publique : crée l'établissement en essai gratuit et connecte directement son
 * administrateur, qui est envoyé vers l'assistant de configuration.
 */
export async function POST(request: Request) {
  try {
    const parsed = signupSchema.safeParse(await request.json());
    if (!parsed.success) {
      const first = parsed.error.issues[0]?.message ?? 'Formulaire incomplet.';
      throw new ApiError(400, first, 'VALIDATION_ERROR', parsed.error.flatten().fieldErrors);
    }
    // Champ piège rempli : robot. Réponse neutre, rien n'est créé.
    if (parsed.data.website) {
      throw new ApiError(400, 'Inscription impossible.', 'SIGNUP_REJECTED');
    }

    const ip = clientIp(request);
    await assertSignupRateLimit(ip);
    const { user, trialEndsAt } = await createTrialOrganization(parsed.data, ip);

    const response = NextResponse.json(
      { matricule: user.matricule, trialEndsAt: trialEndsAt.toISOString(), redirectTo: '/onboarding' },
      { status: 201 }
    );
    await setAuthCookie(response, { userId: user.id, orgId: user.organizationId ?? '', roles: user.roles });
    return response;
  } catch (err) {
    return toErrorResponse(err);
  }
}
