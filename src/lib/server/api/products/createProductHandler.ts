import { drizzle } from 'drizzle-orm/d1';
import { products } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import { requireBusinessPermission } from '$lib/server/utils/businessPermissions';
import type { CreateProductInput } from '$lib/schemas/product';

export async function createProductHandler(
	user: App.User,
	businessId: string,
	data: CreateProductInput,
	env: Cloudflare.Env
) {
	await requireBusinessPermission(user, businessId, 'product:manage', env);

	const db = drizzle(env.DB, { schema });
	const now = new Date().toISOString();

	const [product] = await db
		.insert(products)
		.values({
			id: crypto.randomUUID(),
			businessId,
			name: data.name,
			sku: data.sku ?? null,
			description: data.description ?? null,
			defaultPrice: data.defaultPrice,
			defaultQty: data.defaultQty ?? 1,
			createdAt: now,
			createdBy: user.id,
			updatedAt: now,
			updatedBy: user.id,
		})
		.returning();

	return product;
}
