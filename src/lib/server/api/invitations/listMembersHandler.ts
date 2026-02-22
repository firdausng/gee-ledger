import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import { userBusinessRoles } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import { requireBusinessPermission } from '$lib/server/utils/businessPermissions';

export async function listMembersHandler(
	user: App.User,
	businessId: string,
	env: Cloudflare.Env
) {
	await requireBusinessPermission(user, businessId, 'transaction:view', env);

	const db = drizzle(env.DB, { schema });

	return db
		.select()
		.from(userBusinessRoles)
		.where(eq(userBusinessRoles.businessId, businessId));
}
