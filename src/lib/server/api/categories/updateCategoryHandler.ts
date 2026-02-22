import { drizzle } from 'drizzle-orm/d1';
import { eq, and, isNull } from 'drizzle-orm';
import { categories } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import { requireBusinessPermission } from '$lib/server/utils/businessPermissions';
import { HTTPException } from 'hono/http-exception';
import type { UpdateCategoryInput } from '$lib/schemas/category';

export async function updateCategoryHandler(
	user: App.User,
	businessId: string,
	categoryId: string,
	data: UpdateCategoryInput,
	env: Cloudflare.Env
) {
	await requireBusinessPermission(user, businessId, 'category:manage', env);

	const db = drizzle(env.DB, { schema });
	const now = new Date().toISOString();

	const [updated] = await db
		.update(categories)
		.set({
			...(data.name !== undefined && { name: data.name }),
			...(data.color !== undefined && { color: data.color }),
			...(data.icon !== undefined && { icon: data.icon }),
			updatedAt: now,
			updatedBy: user.id
		})
		.where(
			and(
				eq(categories.id, categoryId),
				eq(categories.businessId, businessId),
				isNull(categories.deletedAt)
			)
		)
		.returning();

	if (!updated) throw new HTTPException(404, { message: 'Category not found' });

	return updated;
}
