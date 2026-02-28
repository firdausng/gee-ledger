import { drizzle } from 'drizzle-orm/d1';
import { eq, and, isNull } from 'drizzle-orm';
import { products } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import { requireBusinessPermission } from '$lib/server/utils/businessPermissions';
import { HTTPException } from 'hono/http-exception';

export async function deleteProductHandler(
	user: App.User,
	businessId: string,
	productId: string,
	env: Cloudflare.Env
) {
	await requireBusinessPermission(user, businessId, 'product:manage', env);

	const db = drizzle(env.DB, { schema });
	const now = new Date().toISOString();

	const [deleted] = await db
		.update(products)
		.set({ deletedAt: now, deletedBy: user.id })
		.where(
			and(
				eq(products.id, productId),
				eq(products.businessId, businessId),
				isNull(products.deletedAt)
			)
		)
		.returning();

	if (!deleted) throw new HTTPException(404, { message: 'Product not found' });

	return { success: true };
}
