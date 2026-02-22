import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import { userBusinessRoles, users } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import { requireBusinessPermission } from '$lib/server/utils/businessPermissions';

export async function listMembersHandler(
	user: App.User,
	businessId: string,
	env: Cloudflare.Env
) {
	await requireBusinessPermission(user, businessId, 'transaction:view', env);

	const db = drizzle(env.DB, { schema });

	const rows = await db
		.select({
			userId: userBusinessRoles.userId,
			businessId: userBusinessRoles.businessId,
			policyKey: userBusinessRoles.policyKey,
			createdAt: userBusinessRoles.createdAt,
			userEmail: users.email,
			userDisplayName: users.displayName,
			userPhotoURL: users.photoURL
		})
		.from(userBusinessRoles)
		.leftJoin(users, eq(userBusinessRoles.userId, users.id))
		.where(eq(userBusinessRoles.businessId, businessId));

	return rows.map((r) => ({
		userId: r.userId,
		businessId: r.businessId,
		policyKey: r.policyKey,
		createdAt: r.createdAt,
		user: {
			id: r.userId,
			email: r.userEmail ?? '',
			displayName: r.userDisplayName ?? null,
			photoURL: r.userPhotoURL ?? null
		}
	}));
}
