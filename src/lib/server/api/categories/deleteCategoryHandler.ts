import { drizzle } from 'drizzle-orm/d1';
import { eq, and, isNull } from 'drizzle-orm';
import { categories } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import { requireBusinessPermission } from '$lib/server/utils/businessPermissions';
import { HTTPException } from 'hono/http-exception';

export async function deleteCategoryHandler(
	user: App.User,
	businessId: string,
	categoryId: string,
	env: Cloudflare.Env
) {
	await requireBusinessPermission(user, businessId, 'category:manage', env);

	const db = drizzle(env.DB, { schema });
	const now = new Date().toISOString();

	const [deleted] = await db
		.update(categories)
		.set({ deletedAt: now, deletedBy: user.id })
		.where(
			and(
				eq(categories.id, categoryId),
				eq(categories.businessId, businessId),
				isNull(categories.deletedAt)
			)
		)
		.returning();

	if (!deleted) throw new HTTPException(404, { message: 'Category not found' });

	return { success: true };
}
