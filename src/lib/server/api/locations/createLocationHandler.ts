import { drizzle } from 'drizzle-orm/d1';
import { locations } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import { requireBusinessPermission } from '$lib/server/utils/businessPermissions';
import type { CreateLocationInput } from '$lib/schemas/location';

export async function createLocationHandler(
	user: App.User,
	businessId: string,
	data: CreateLocationInput,
	env: Cloudflare.Env
) {
	await requireBusinessPermission(user, businessId, 'business:manage', env);

	const db = drizzle(env.DB, { schema });
	const now = new Date().toISOString();
	const id = crypto.randomUUID();

	const [location] = await db
		.insert(locations)
		.values({
			id,
			businessId,
			name: data.name,
			type: data.type,
			address: data.address ?? null,
			createdAt: now,
			createdBy: user.id,
			updatedAt: now,
			updatedBy: user.id
		})
		.returning();

	return location;
}
