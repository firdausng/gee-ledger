import { drizzle } from 'drizzle-orm/d1';
import { eq, and, count } from 'drizzle-orm';
import { userBusinessRoles } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import { requireBusinessPermission } from '$lib/server/utils/businessPermissions';
import { HTTPException } from 'hono/http-exception';
import type { UpdateMemberRoleInput } from '$lib/schemas/invitation';

export async function updateMemberRoleHandler(
	user: App.User,
	businessId: string,
	targetUserId: string,
	data: UpdateMemberRoleInput,
	env: Cloudflare.Env
) {
	await requireBusinessPermission(user, businessId, 'user:invite', env);

	const db = drizzle(env.DB, { schema });

	// Prevent downgrading the last owner
	if (data.policyKey !== 'owner') {
		const [{ value: ownerCount }] = await db
			.select({ value: count() })
			.from(userBusinessRoles)
			.where(
				and(
					eq(userBusinessRoles.businessId, businessId),
					eq(userBusinessRoles.policyKey, 'owner')
				)
			);

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

		if (targetRole?.policyKey === 'owner' && ownerCount <= 1) {
			throw new HTTPException(400, { message: 'Cannot remove the last owner' });
		}
	}

	const [updated] = await db
		.update(userBusinessRoles)
		.set({ policyKey: data.policyKey })
		.where(
			and(
				eq(userBusinessRoles.userId, targetUserId),
				eq(userBusinessRoles.businessId, businessId)
			)
		)
		.returning();

	if (!updated) throw new HTTPException(404, { message: 'Member not found' });

	return updated;
}
