import { drizzle } from 'drizzle-orm/d1';
import { eq, and, isNull } from 'drizzle-orm';
import { categories } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import { requireBusinessPermission } from '$lib/server/utils/businessPermissions';
import { HTTPException } from 'hono/http-exception';

export async function getCategoryHandler(
	user: App.User,
	businessId: string,
	categoryId: string,
	env: Cloudflare.Env
) {
	await requireBusinessPermission(user, businessId, 'transaction:view', env);

	const db = drizzle(env.DB, { schema });

	const [category] = await db
		.select()
		.from(categories)
		.where(and(eq(categories.id, categoryId), eq(categories.businessId, businessId), isNull(categories.deletedAt)))
		.limit(1);

	if (!category) throw new HTTPException(404, { message: 'Category not found' });

	return category;
}
