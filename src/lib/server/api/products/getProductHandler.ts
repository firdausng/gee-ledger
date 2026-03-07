import { drizzle } from 'drizzle-orm/d1';
import { eq, and, isNull } from 'drizzle-orm';
import { products } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import { requireBusinessPermission } from '$lib/server/utils/businessPermissions';
import { HTTPException } from 'hono/http-exception';

export async function getProductHandler(
	user: App.User,
	businessId: string,
	productId: string,
	env: Cloudflare.Env
) {
	await requireBusinessPermission(user, businessId, 'transaction:view', env);

	const db = drizzle(env.DB, { schema });

	const [product] = await db
		.select()
		.from(products)
		.where(and(eq(products.id, productId), eq(products.businessId, businessId), isNull(products.deletedAt)))
		.limit(1);

	if (!product) throw new HTTPException(404, { message: 'Product not found' });

	return product;
}
