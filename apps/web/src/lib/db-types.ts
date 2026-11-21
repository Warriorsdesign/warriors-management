import type { withTenantContext } from '@/lib/db';

export type TenantClient = Parameters<Parameters<typeof withTenantContext>[1]>[0];
