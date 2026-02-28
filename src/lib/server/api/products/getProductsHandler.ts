import { drizzle } from 'drizzle-orm/d1';
import { eq, and, isNull } from 'drizzle-orm';
import { products } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import { requireBusinessPermission } from '$lib/server/utils/businessPermissions';

export async function getProductsHandler(
	user: App.User,
	businessId: string,
	env: Cloudflare.Env,
	includeInactive = false
) {
	await requireBusinessPermission(user, businessId, 'transaction:view', env);

	const db = drizzle(env.DB, { schema });

	const conditions = [eq(products.businessId, businessId), isNull(products.deletedAt)];
	if (!includeInactive) {
		conditions.push(eq(products.isActive, true));
	}

	return db
		.select()
		.from(products)
		.where(and(...conditions));
}
