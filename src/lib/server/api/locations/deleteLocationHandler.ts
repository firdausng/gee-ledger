import { drizzle } from 'drizzle-orm/d1';
import { eq, and, isNull } from 'drizzle-orm';
import { locations } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import { requireBusinessPermission } from '$lib/server/utils/businessPermissions';
import { HTTPException } from 'hono/http-exception';

export async function deleteLocationHandler(
	user: App.User,
	businessId: string,
	locationId: string,
	env: Cloudflare.Env
) {
	await requireBusinessPermission(user, businessId, 'business:manage', env);

	const db = drizzle(env.DB, { schema });
	const now = new Date().toISOString();

	const [deleted] = await db
		.update(locations)
		.set({ deletedAt: now, deletedBy: user.id })
		.where(
			and(
				eq(locations.id, locationId),
				eq(locations.businessId, businessId),
				isNull(locations.deletedAt)
			)
		)
		.returning();

	if (!deleted) throw new HTTPException(404, { message: 'Location not found' });

	return { success: true };
}
