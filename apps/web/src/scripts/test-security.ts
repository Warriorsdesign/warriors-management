import { randomUUID } from 'node:crypto';
import { eq, inArray } from 'drizzle-orm';
import { signAdminToken, signToken, verifyAdminToken } from '../lib/auth/jwt';
import { db, disconnectDatabase, withTenantContext } from '../lib/db';
import { organizations } from '../lib/db/schema';

async function main() {
  const clientToken = await signToken({
    userId: 'client-user',
    orgId: 'client-org',
    roles: ['ADMIN'],
  });
  let rejectedClientToken = false;
  try {
    await verifyAdminToken(clientToken);
  } catch {
    rejectedClientToken = true;
  }
  assert('Un jeton client ne peut pas authentifier un Super Admin', rejectedClientToken);

  const adminToken = await signAdminToken({
    userId: 'platform-admin',
    email: 'platform-admin@example.test',
    isSuperAdmin: true,
  });
  const adminClaims = await verifyAdminToken(adminToken);
  assert('Un jeton Super Admin signé est accepté', adminClaims.isSuperAdmin);

  const firstId = randomUUID();
  const secondId = randomUUID();
  await db.insert(organizations).values([
    { id: firstId, name: 'RLS test A' },
    { id: secondId, name: 'RLS test B' },
  ]);
  try {
    const visibleFromFirstTenant = await withTenantContext(firstId, (tx) =>
      tx.select({ id: organizations.id })
        .from(organizations)
        .where(eq(organizations.id, firstId)),
    );
    assert('Le contexte locataire voit sa propre organisation', visibleFromFirstTenant.length === 1);

    const hiddenFromFirstTenant = await withTenantContext(firstId, (tx) =>
      tx.select({ id: organizations.id })
        .from(organizations)
        .where(eq(organizations.id, secondId)),
    );
    assert('Le contexte locataire ne voit pas une autre organisation', hiddenFromFirstTenant.length === 0);

    let crossTenantInsertRejected = false;
    try {
      await withTenantContext(firstId, async (tx) => {
        await tx.insert(organizations).values({ id: randomUUID(), name: 'RLS test invalid' });
      });
    } catch (error) {
      crossTenantInsertRejected =
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === '42501';
    }
    assert('RLS refuse la création d’une organisation hors contexte', crossTenantInsertRejected);
  } finally {
    await db.delete(organizations).where(inArray(organizations.id, [firstId, secondId]));
  }

  console.log('Vérifications de sécurité Drizzle/RLS terminées.');
}

function assert(description: string, condition: boolean) {
  if (!condition) throw new Error(`Échec : ${description}`);
  console.log(`[PASS] ${description}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(disconnectDatabase);
