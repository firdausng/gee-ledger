import { drizzle } from 'drizzle-orm/d1';
import { eq, and, isNull, inArray } from 'drizzle-orm';
import { businesses, userBusinessRoles } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';

export async function getBusinessesHandler(user: App.User, env: Cloudflare.Env) {
	const db = drizzle(env.DB, { schema });

	// Find all business IDs where the user has a role
	const roles = await db
		.select({ businessId: userBusinessRoles.businessId, policyKey: userBusinessRoles.policyKey })
		.from(userBusinessRoles)
		.where(eq(userBusinessRoles.userId, user.id));

	if (roles.length === 0) return [];

	const businessIds = roles.map((r) => r.businessId);
	const roleMap = new Map(roles.map((r) => [r.businessId, r.policyKey]));

	const result = await db
		.select()
		.from(businesses)
		.where(and(inArray(businesses.id, businessIds), isNull(businesses.deletedAt)));

	return result.map((b) => ({ ...b, policyKey: roleMap.get(b.id) }));
}
