import { drizzle } from 'drizzle-orm/d1';
import { eq, and, isNull } from 'drizzle-orm';
import { businesses, locations, salesChannels, accounts, categories, transactions } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import { requireOwnerRole } from '$lib/server/utils/businessPermissions';
import { HTTPException } from 'hono/http-exception';

export async function deleteBusinessHandler(
	user: App.User,
	businessId: string,
	env: Cloudflare.Env
) {
	await requireOwnerRole(user, businessId, env);

	const db = drizzle(env.DB, { schema });
	const now = new Date().toISOString();

	const [existing] = await db
		.select({ id: businesses.id })
		.from(businesses)
		.where(and(eq(businesses.id, businessId), isNull(businesses.deletedAt)))
		.limit(1);

	if (!existing) throw new HTTPException(404, { message: 'Business not found' });

	// Cascade soft-delete all business data atomically
	await db.batch([
		db.update(businesses)
			.set({ deletedAt: now, deletedBy: user.id })
			.where(eq(businesses.id, businessId)),
		db.update(locations)
			.set({ deletedAt: now, deletedBy: user.id })
			.where(and(eq(locations.businessId, businessId), isNull(locations.deletedAt))),
		db.update(salesChannels)
			.set({ deletedAt: now, deletedBy: user.id })
			.where(and(eq(salesChannels.businessId, businessId), isNull(salesChannels.deletedAt))),
		db.update(accounts)
			.set({ deletedAt: now, deletedBy: user.id })
			.where(and(eq(accounts.businessId, businessId), isNull(accounts.deletedAt))),
		db.update(categories)
			.set({ deletedAt: now, deletedBy: user.id })
			.where(and(eq(categories.businessId, businessId), isNull(categories.deletedAt))),
		db.update(transactions)
			.set({ deletedAt: now, deletedBy: user.id })
			.where(and(eq(transactions.businessId, businessId), isNull(transactions.deletedAt)))
	]);

	return { success: true };
}
