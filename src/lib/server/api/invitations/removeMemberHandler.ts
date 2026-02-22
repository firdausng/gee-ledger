import { drizzle } from 'drizzle-orm/d1';
import { eq, and, count } from 'drizzle-orm';
import { userBusinessRoles } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import { requireBusinessPermission } from '$lib/server/utils/businessPermissions';
import { HTTPException } from 'hono/http-exception';

export async function removeMemberHandler(
	user: App.User,
	businessId: string,
	targetUserId: string,
	env: Cloudflare.Env
) {
	await requireBusinessPermission(user, businessId, 'user:invite', env);

	const db = drizzle(env.DB, { schema });

	const [targetRole] = await db
		.select({ policyKey: userBusinessRoles.policyKey })
		.from(userBusinessRoles)
		.where(
			and(
				eq(userBusinessRoles.userId, targetUserId),
				eq(userBusinessRoles.businessId, businessId)
			)
		)
		.limit(1);

	if (!targetRole) throw new HTTPException(404, { message: 'Member not found' });

	// Prevent removing the last owner
	if (targetRole.policyKey === 'owner') {
		const [{ value: ownerCount }] = await db
			.select({ value: count() })
			.from(userBusinessRoles)
			.where(
				and(
					eq(userBusinessRoles.businessId, businessId),
					eq(userBusinessRoles.policyKey, 'owner')
				)
			);

		if (ownerCount <= 1) throw new HTTPException(400, { message: 'Cannot remove the last owner' });
	}

	await db
		.delete(userBusinessRoles)
		.where(
			and(
				eq(userBusinessRoles.userId, targetUserId),
				eq(userBusinessRoles.businessId, businessId)
			)
		);

	return { success: true };
}
