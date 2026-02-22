import { drizzle } from 'drizzle-orm/d1';
import { eq, and, isNull } from 'drizzle-orm';
import { locations } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import { requireBusinessPermission } from '$lib/server/utils/businessPermissions';
import { HTTPException } from 'hono/http-exception';
import type { UpdateLocationInput } from '$lib/schemas/location';

export async function updateLocationHandler(
	user: App.User,
	businessId: string,
	locationId: string,
	data: UpdateLocationInput,
	env: Cloudflare.Env
) {
	await requireBusinessPermission(user, businessId, 'business:manage', env);

	const db = drizzle(env.DB, { schema });
	const now = new Date().toISOString();

	const [updated] = await db
		.update(locations)
		.set({
			...(data.name !== undefined && { name: data.name }),
			...(data.type !== undefined && { type: data.type }),
			...(data.address !== undefined && { address: data.address }),
			...(data.isActive !== undefined && { isActive: data.isActive }),
			updatedAt: now,
			updatedBy: user.id
		})
		.where(
			and(
				eq(locations.id, locationId),
				eq(locations.businessId, businessId),
				isNull(locations.deletedAt)
			)
		)
		.returning();

	if (!updated) throw new HTTPException(404, { message: 'Location not found' });

	return updated;
}
