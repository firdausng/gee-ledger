import { drizzle } from 'drizzle-orm/d1';
import { eq, and, isNull } from 'drizzle-orm';
import { locations } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import { requireBusinessPermission } from '$lib/server/utils/businessPermissions';
import { HTTPException } from 'hono/http-exception';

export async function getLocationHandler(
	user: App.User,
	businessId: string,
	locationId: string,
	env: Cloudflare.Env
) {
	await requireBusinessPermission(user, businessId, 'transaction:view', env);

	const db = drizzle(env.DB, { schema });

	const [location] = await db
		.select()
		.from(locations)
		.where(and(eq(locations.id, locationId), eq(locations.businessId, businessId), isNull(locations.deletedAt)))
		.limit(1);

	if (!location) throw new HTTPException(404, { message: 'Location not found' });

	return location;
}
