import { drizzle } from 'drizzle-orm/d1';
import { categories } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import { requireBusinessPermission } from '$lib/server/utils/businessPermissions';
import type { CreateCategoryInput } from '$lib/schemas/category';

export async function createCategoryHandler(
	user: App.User,
	businessId: string,
	data: CreateCategoryInput,
	env: Cloudflare.Env
) {
	await requireBusinessPermission(user, businessId, 'category:manage', env);

	const db = drizzle(env.DB, { schema });
	const now = new Date().toISOString();

	const [category] = await db
		.insert(categories)
		.values({
			id: crypto.randomUUID(),
			businessId,
			name: data.name,
			type: data.type,
			color: data.color ?? null,
			icon: data.icon ?? null,
			createdAt: now,
			createdBy: user.id,
			updatedAt: now,
			updatedBy: user.id
		})
		.returning();

	return category;
}
